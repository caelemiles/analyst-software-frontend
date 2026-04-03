import { Router } from 'express';
import type { Request, Response } from 'express';
import { getPlayers, getTeamPlayers } from '../db/queries.js';
import { playerRowToApiFormat } from '../scraper/normalize.js';
import { CURRENT_SEASON } from '../scraper/index.js';

const router = Router();

/**
 * Normalize an incoming season string to the format stored in the DB (e.g. "2025/26").
 * Handles:
 *   "2025/26"  → "2025/26"  (already correct)
 *   "2025-26"  → "2025/26"
 *   "2025"     → "2025/26"  (assumes /YY+1)
 *   ""         → CURRENT_SEASON fallback
 */
function normalizeSeason(raw: string | undefined): string {
  if (!raw || raw.trim() === '') return CURRENT_SEASON;

  const trimmed = raw.trim();

  // Already in "YYYY/YY" form
  if (/^\d{4}\/\d{2}$/.test(trimmed)) return trimmed;

  // "YYYY-YY" → replace dash with slash
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed.replace('-', '/');

  // Bare year "YYYY" → derive the short second year
  if (/^\d{4}$/.test(trimmed)) {
    const year = parseInt(trimmed, 10);
    const nextShort = String((year + 1) % 100).padStart(2, '0');
    return `${year}/${nextShort}`;
  }

  // Unrecognised — return as-is so it can still match if the DB stores this value
  return trimmed;
}

/**
 * GET /api/players
 * Returns all players with current season stats.
 * Supports filtering by league, season, team, position, search, age, goals, xG.
 * Supports pagination with page & limit query params.
 *
 * NEVER returns HTTP 500 for empty results — returns 200 with an empty array.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  console.log(`[API] ➡️ /api/players request received`);
  console.log(`[API]   Raw query params: ${JSON.stringify(req.query)}`);

  try {
    // --- Stage 1: Parse incoming query params ---
    const {
      league,
      season,
      team,
      position,
      search,
      minAge,
      maxAge,
      minGoals,
      minXG,
      page,
      limit,
    } = req.query;

    console.log(`[API]   Raw league param: ${JSON.stringify(league)}`);
    console.log(`[API]   Raw season param: ${JSON.stringify(season)}`);

    // --- Stage 2: Normalize league ---
    const leagueName = typeof league === 'string'
      ? league.replace(/-/g, ' ')
      : 'EFL League Two';
    console.log(`[API]   Normalized league: "${leagueName}"`);

    // --- Stage 3: Normalize season ---
    const normalizedSeason = normalizeSeason(
      typeof season === 'string' ? season : undefined
    );
    console.log(`[API]   Normalized season: "${normalizedSeason}"`);

    const options = {
      league: leagueName,
      season: normalizedSeason,
      team: typeof team === 'string' ? team : undefined,
      position: typeof position === 'string' ? position : undefined,
      search: typeof search === 'string' ? search : undefined,
      minAge: minAge ? parseInt(String(minAge), 10) : undefined,
      maxAge: maxAge ? parseInt(String(maxAge), 10) : undefined,
      minGoals: minGoals ? parseInt(String(minGoals), 10) : undefined,
      minXG: minXG ? parseFloat(String(minXG)) : undefined,
      page: page ? parseInt(String(page), 10) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
    };

    console.log(`[API]   Parsed options: ${JSON.stringify(options)}`);

    // --- Stage 4: Query database ---
    console.log(`[API]   Database query started…`);
    const { players, total } = await getPlayers(options);
    console.log(`[API]   Database query finished — ${players.length} rows returned (total matching: ${total})`);

    // --- Stage 5: Return results (200 even when empty) ---
    if (!players || players.length === 0) {
      console.log(`[API]   No players matched filters — returning 200 with empty array`);
      res.json({ players: [], total: 0, liveData: false });
      return;
    }

    const formatted = players.map((p) => playerRowToApiFormat(p as unknown as Record<string, unknown>));
    console.log(`[API]   ✅ Sending ${formatted.length} players to frontend`);

    // If pagination was requested, return paginated response
    if (options.page && options.limit) {
      res.json({
        players: formatted,
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
        liveData: true,
      });
      return;
    }

    // Otherwise return flat array with metadata
    res.json({
      players: formatted,
      total,
      liveData: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[API] ❌ /api/players UNHANDLED ERROR`);
    console.error(`[API]   Message: ${message}`);
    console.error(`[API]   Stack: ${stack}`);
    console.error(`[API]   Query params were: ${JSON.stringify(req.query)}`);

    // If the error mentions team_id, provide specific diagnostic info
    const isTeamIdError = message.includes('team_id');
    if (isTeamIdError) {
      console.error(`[API] ❌ CRITICAL: Error references 'team_id' but this column should NOT exist.`);
      console.error(`[API]   The players table uses 'team' (VARCHAR), not 'team_id'.`);
      console.error(`[API]   This error likely means stale compiled code is running.`);
      console.error(`[API]   Run: npm run build && npm start — to recompile from source.`);
    }

    // Fetch actual schema columns for diagnostics (best-effort)
    let debugSchema: { columns?: string[]; error?: string } = {};
    try {
      const { getTableColumns } = await import('../db/connection.js');
      const cols = await getTableColumns('players');
      debugSchema = { columns: cols };
      console.error(`[API]   Actual players columns: ${cols.join(', ')}`);
    } catch (schemaErr) {
      const schemaMsg = schemaErr instanceof Error ? schemaErr.message : String(schemaErr);
      console.error(`[API]   Failed to query schema for diagnostics: ${schemaMsg}`);
      debugSchema = { error: `Could not query schema: ${schemaMsg}` };
    }

    // Return a structured error payload — still 200 so the frontend can handle it gracefully
    res.json({
      error: 'Failed to fetch players',
      message,
      players: [],
      total: 0,
      liveData: false,
      debug: {
        details: message,
        queryParams: req.query,
        actualPlayerColumns: debugSchema,
        hint: isTeamIdError
          ? 'This server does NOT use team_id. The players table uses "team" (VARCHAR). If you see this error, stale compiled code may be running. Rebuild with: npm run build'
          : undefined,
      },
    });
  }
});

/**
 * GET /api/players/:id/highlights
 * Returns player highlights (placeholder for now).
 */
router.get('/:id/highlights', async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.id, 10);
    console.log(`[API] GET /api/players/${playerId}/highlights`);

    // Highlights are not scraped — return empty array
    res.json({ highlights: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error fetching highlights: ${message}`);
    res.status(500).json({ highlights: [], error: message });
  }
});

export default router;

export { getTeamPlayers };
