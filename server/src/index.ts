import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase, validateSchema, getTableColumns, EXPECTED_PLAYER_COLUMNS, EXPECTED_TEAM_COLUMNS } from './db/connection.js';
import { startScheduler, triggerScrape } from './scheduler/index.js';
import { needsInitialScrape, runScrape, CURRENT_SEASON, LEAGUE_NAME } from './scraper/index.js';
import { getLastUpdateTime, getPlayers, upsertPlayer } from './db/queries.js';

import playersRouter from './routes/players.js';
import teamsRouter from './routes/teams.js';
import leagueRouter from './routes/league.js';
import seasonRouter from './routes/season.js';

const env = config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/league-table', leagueRouter);
app.use('/api/season', seasonRouter);

// Legacy routes (some frontend calls may use these)
app.get('/players', async (req, res) => {
  // Redirect to the new API format
  const league = typeof req.query.league === 'string'
    ? req.query.league.replace(/-/g, ' ')
    : 'EFL League Two';
  const season = typeof req.query.season === 'string'
    ? req.query.season
    : CURRENT_SEASON;

  try {
    const { getPlayers } = await import('./db/queries.js');
    const { playerRowToApiFormat } = await import('./scraper/normalize.js');
    const { players } = await getPlayers({ league, season });
    res.json(players.map(playerRowToApiFormat));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error in legacy /players: ${message}`);
    res.status(500).json({ error: message });
  }
});

app.get('/player/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { getPlayers } = await import('./db/queries.js');
    const { playerRowToApiFormat } = await import('./scraper/normalize.js');
    const { players } = await getPlayers();
    const player = players.find(p => p.id === id);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(playerRowToApiFormat(player));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error in /player/:id: ${message}`);
    res.status(500).json({ error: message });
  }
});

// League-specific player endpoint
app.get('/api/league/:leagueId/players', async (req, res) => {
  try {
    const league = req.params.leagueId.replace(/-/g, ' ');
    const { getPlayers } = await import('./db/queries.js');
    const { playerRowToApiFormat } = await import('./scraper/normalize.js');
    const { players } = await getPlayers({ league, season: CURRENT_SEASON });
    res.json(players.map(playerRowToApiFormat));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error in /api/league/:leagueId/players: ${message}`);
    res.status(500).json({ error: message });
  }
});

// Admin endpoint to manually trigger a scrape
app.post('/api/scrape', async (_req, res) => {
  try {
    const result = await triggerScrape();
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error triggering scrape: ${message}`);
    res.status(500).json({ success: false, message });
  }
});

// Debug route — returns first 20 players directly from DB for troubleshooting (no league/season filter)
app.get('/api/debug/players', async (_req, res) => {
  try {
    const { players } = await getPlayers({ limit: 20 });
    console.log(`[Debug] /api/debug/players returning ${players.length} players`);
    res.json(players);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Debug] Error in /api/debug/players: ${message}`);
    res.json({ error: message, players: [] });
  }
});

// Debug route — seed 3 known League Two test players into the DB
app.post('/api/debug/seed', async (_req, res) => {
  try {
    const testPlayers = [
      { name: 'Test Player A', team: 'Swindon Town', position: 'Forward', age: 24, nationality: 'England', appearances: 30, goals: 12, assists: 5, xg: 10.5, xa: 3.2, minutes_played: 2400, season: CURRENT_SEASON, league: LEAGUE_NAME },
      { name: 'Test Player B', team: 'Walsall', position: 'Midfielder', age: 27, nationality: 'Wales', appearances: 28, goals: 6, assists: 9, xg: 5.1, xa: 7.8, minutes_played: 2200, season: CURRENT_SEASON, league: LEAGUE_NAME },
      { name: 'Test Player C', team: 'Gillingham', position: 'Defender', age: 22, nationality: 'Scotland', appearances: 32, goals: 2, assists: 1, xg: 1.0, xa: 0.5, minutes_played: 2800, season: CURRENT_SEASON, league: LEAGUE_NAME },
    ];

    const results = [];
    for (const p of testPlayers) {
      const row = await upsertPlayer(p);
      results.push({ id: row.id, name: row.name, team: row.team, season: row.season, league: row.league });
    }

    console.log(`[Debug] Seeded ${results.length} test players`);
    res.json({ success: true, seeded: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Debug] Error seeding test players: ${message}`);
    res.json({ success: false, error: message });
  }
});

// Debug route — show actual vs expected database schema for diagnosing column mismatches
app.get('/api/debug/schema', async (_req, res) => {
  try {
    const playerCols = await getTableColumns('players');
    const teamCols = await getTableColumns('teams');

    const playerMissing = EXPECTED_PLAYER_COLUMNS.filter(c => !playerCols.includes(c));
    const playerExtra = playerCols.filter(c => !EXPECTED_PLAYER_COLUMNS.includes(c));
    const teamMissing = EXPECTED_TEAM_COLUMNS.filter(c => !teamCols.includes(c));
    const teamExtra = teamCols.filter(c => !EXPECTED_TEAM_COLUMNS.includes(c));

    res.json({
      players: {
        actual_columns: playerCols,
        expected_columns: EXPECTED_PLAYER_COLUMNS,
        missing_columns: playerMissing,
        extra_columns: playerExtra,
        match: playerMissing.length === 0 && playerExtra.length === 0,
        note: 'Players use "team" (VARCHAR) for team linkage — NOT "team_id". No foreign key to teams table.',
      },
      teams: {
        actual_columns: teamCols,
        expected_columns: EXPECTED_TEAM_COLUMNS,
        missing_columns: teamMissing,
        extra_columns: teamExtra,
        match: teamMissing.length === 0 && teamExtra.length === 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Debug] Error in /api/debug/schema: ${message}`);
    res.json({ error: message });
  }
});

// Health check — simple
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Health check — detailed
app.get('/api/health', async (_req, res) => {
  try {
    const lastUpdate = await getLastUpdateTime(CURRENT_SEASON);
    res.json({
      ok: true,
      status: 'ok',
      season: CURRENT_SEASON,
      league: LEAGUE_NAME,
      lastUpdate: lastUpdate?.toISOString() ?? null,
      environment: env.nodeEnv,
    });
  } catch {
    res.json({
      ok: true,
      status: 'ok',
      season: CURRENT_SEASON,
      league: LEAGUE_NAME,
      lastUpdate: null,
      environment: env.nodeEnv,
    });
  }
});

// Start server
async function start(): Promise<void> {
  try {
    // Initialize database
    console.log('[Server] Initializing database...');
    await initDatabase();

    // Validate that the DB schema matches expected columns
    console.log('[Server] Validating database schema...');
    const schemaReport = await validateSchema();
    if (!schemaReport.players.match || !schemaReport.teams.match) {
      console.warn('[Server] ⚠️ Schema validation found mismatches — check logs above');
    }

    // Check if we need an initial scrape
    const needsScrape = await needsInitialScrape();
    if (needsScrape) {
      console.log('[Server] No existing data found, running initial scrape...');
      const result = await runScrape();
      console.log(`[Server] Initial scrape: ${result.teamsUpserted} teams, ${result.playersUpserted} players`);
    } else {
      console.log('[Server] Existing data found, skipping initial scrape');
    }

    // Start the periodic scrape scheduler
    startScheduler(env.scrapeIntervalHours);

    // Start Express server
    app.listen(env.port, () => {
      console.log(`[Server] Running on port ${env.port} (${env.nodeEnv})`);
      console.log(`[Server] API endpoints:`);
      console.log(`  GET  /health             — Simple health check`);
      console.log(`  GET  /api/health         — Detailed health check`);
      console.log(`  GET  /api/players        — All players with stats`);
      console.log(`  GET  /api/teams          — All teams with squads`);
      console.log(`  GET  /api/league-table   — League standings`);
      console.log(`  GET  /api/season         — Current season info`);
      console.log(`  GET  /api/debug/players  — Debug: first 20 players from DB`);
      console.log(`  GET  /api/debug/schema   — Debug: compare DB vs expected schema`);
      console.log(`  POST /api/debug/seed     — Seed 3 test League Two players`);
      console.log(`  POST /api/scrape         — Trigger manual scrape`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();

export { app };
