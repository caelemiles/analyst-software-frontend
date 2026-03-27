import { Router } from 'express';
import type { Request, Response } from 'express';
import { getTeams } from '../db/queries.js';
import { teamRowToLeagueEntry } from '../scraper/normalize.js';
import { CURRENT_SEASON, LEAGUE_NAME } from '../scraper/index.js';

const router = Router();

/**
 * GET /api/league-table
 * Returns league standings with form data.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log(`[API] GET /api/league-table`);

    const teams = await getTeams({ league: LEAGUE_NAME, season: CURRENT_SEASON });
    const table = teams.map(teamRowToLeagueEntry);

    res.json(table);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error fetching league table: ${message}`);
    res.status(500).json({ error: 'Failed to fetch league table', message });
  }
});

export default router;
