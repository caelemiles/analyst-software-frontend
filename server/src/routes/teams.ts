import { Router } from 'express';
import type { Request, Response } from 'express';
import { getTeams, getTeamPlayers } from '../db/queries.js';
import { teamRowToApiFormat, playerRowToApiFormat } from '../scraper/normalize.js';
import { CURRENT_SEASON } from '../scraper/index.js';

const router = Router();

/**
 * GET /api/teams
 * Returns all teams with current players linked.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const league = typeof req.query.league === 'string'
      ? req.query.league.replace(/-/g, ' ')
      : 'EFL League Two';

    console.log(`[API] GET /api/teams (league: ${league})`);

    const teams = await getTeams({ league, season: CURRENT_SEASON });

    // For each team, fetch its players for the squad
    const formatted = await Promise.all(
      teams.map(async (team) => {
        const players = await getTeamPlayers(team.id, CURRENT_SEASON);
        const squad = players.map((p) => ({
          id: p.id,
          name: p.name,
          position: p.position,
          age: p.age,
          nationality: p.nationality,
          appearances: Number(p.appearances),
          goals: Number(p.goals),
          assists: Number(p.assists),
        }));
        return teamRowToApiFormat(team, squad);
      })
    );

    res.json(formatted);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error fetching teams: ${message}`);
    res.status(500).json({ error: 'Failed to fetch teams', message });
  }
});

/**
 * GET /api/teams/:teamId/players
 * Returns all players for a specific team.
 */
router.get('/:teamId/players', async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    console.log(`[API] GET /api/teams/${teamId}/players`);

    const players = await getTeamPlayers(teamId, CURRENT_SEASON);
    const formatted = players.map(playerRowToApiFormat);

    res.json(formatted);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error fetching team players: ${message}`);
    res.status(500).json({ error: 'Failed to fetch team players', message });
  }
});

export default router;
