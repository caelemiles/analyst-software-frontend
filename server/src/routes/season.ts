import { Router } from 'express';
import type { Request, Response } from 'express';
import { CURRENT_SEASON, LEAGUE_NAME } from '../scraper/index.js';

const router = Router();

/**
 * GET /api/season
 * Returns the current season info.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log(`[API] GET /api/season`);

    res.json({
      currentSeason: CURRENT_SEASON,
      league: LEAGUE_NAME,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error fetching season info: ${message}`);
    res.status(500).json({ error: 'Failed to fetch season info', message });
  }
});

export default router;
