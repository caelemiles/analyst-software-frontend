import { Router } from 'express';
import type { Request, Response } from 'express';
import { getPlayers, getTeamPlayers } from '../db/queries.js';
import { playerRowToApiFormat } from '../scraper/normalize.js';
import { CURRENT_SEASON } from '../scraper/index.js';

const router = Router();

/**
 * GET /api/players
 * Returns all players with current season stats.
 * Supports filtering by league, season, team, position, search, age, goals, xG.
 * Supports pagination with page & limit query params.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  console.log('➡️ /api/players called');

  try {
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

    const leagueName = typeof league === 'string'
      ? league.replace(/-/g, ' ')
      : 'EFL League Two';

    const options = {
      league: leagueName,
      season: (typeof season === 'string' ? season : CURRENT_SEASON),
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

    console.log(`[API] GET /api/players`, JSON.stringify(options));

    const { players, total } = await getPlayers(options);

    console.log(`📊 Players from DB: ${players.length}`);

    if (!players || players.length === 0) {
      console.log('❌ NO PLAYERS IN DATABASE');
      res.status(500).json({ error: 'No players in DB', players: [], total: 0, liveData: false });
      return;
    }

    const formatted = players.map(playerRowToApiFormat);

    console.log('✅ Sending players to frontend');

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
    console.error(`❌ API ERROR: ${message}`);
    res.status(500).json({
      error: 'Failed to fetch players',
      message,
      players: [],
      total: 0,
      liveData: false,
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
