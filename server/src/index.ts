import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './db/connection.js';
import { startScheduler, triggerScrape } from './scheduler/index.js';
import { needsInitialScrape, runScrape, CURRENT_SEASON, LEAGUE_NAME } from './scraper/index.js';
import { getLastUpdateTime, getPlayers } from './db/queries.js';

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

// Debug route — returns first 10 players directly from DB for troubleshooting
app.get('/api/debug/players', async (_req, res) => {
  try {
    const { players } = await getPlayers({ limit: 10 });
    console.log(`[Debug] /api/debug/players returning ${players.length} players`);
    res.json(players);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Debug] Error in /api/debug/players: ${message}`);
    res.status(500).json({ error: message });
  }
});

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    const lastUpdate = await getLastUpdateTime(CURRENT_SEASON);
    res.json({
      status: 'ok',
      season: CURRENT_SEASON,
      league: LEAGUE_NAME,
      lastUpdate: lastUpdate?.toISOString() ?? null,
      environment: env.nodeEnv,
    });
  } catch {
    res.json({
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
      console.log(`  GET /api/players    — All players with stats`);
      console.log(`  GET /api/teams      — All teams with squads`);
      console.log(`  GET /api/league-table — League standings`);
      console.log(`  GET /api/season     — Current season info`);
      console.log(`  GET /api/health     — Health check`);
      console.log(`  GET /api/debug/players — Debug: first 10 players from DB`);
      console.log(`  POST /api/scrape    — Trigger manual scrape`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();

export { app };
