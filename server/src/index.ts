import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase, validateSchema, getTableColumns, EXPECTED_PLAYER_COLUMNS, EXPECTED_TEAM_COLUMNS } from './db/connection.js';
import { startScheduler, triggerScrape } from './scheduler/index.js';
import { needsInitialScrape, runScrape, CURRENT_SEASON, LEAGUE_NAME } from './scraper/index.js';
import { getLastUpdateTime, getPlayers, getPlayersSafe, getPlayersMinimal, getPlayerCounts, upsertPlayer, invalidatePlayerColumnsCache } from './db/queries.js';

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

// Debug route — returns first 20 players using ONLY columns confirmed to exist (no SELECT *, no joins)
app.get('/api/debug/players', async (_req, res) => {
  try {
    // Use the truly safe query — discovers columns from information_schema first
    const players = await getPlayersSafe(20);
    console.log(`[Debug] /api/debug/players returning ${players.length} players (safe query)`);
    res.json(players);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Debug] Error in /api/debug/players: ${message}`);
    res.json({ error: message, players: [] });
  }
});

// Debug route — ultra-minimal query returning only id, name, team + whatever of league/season exist
app.get('/api/debug/players-safe', async (_req, res) => {
  try {
    const db = (await import('./db/connection.js')).getPool();
    const cols = await getTableColumns('players');
    // Pick only the minimal subset that we are 100% sure exists
    const minimal = ['id', 'name', 'team'].filter(c => cols.includes(c));
    // Add league and season if they exist
    if (cols.includes('league')) minimal.push('league');
    if (cols.includes('season')) minimal.push('season');
    const selectCols = minimal.length > 0 ? minimal.join(', ') : '*';
    const result = await db.query(`SELECT ${selectCols} FROM players LIMIT 20`);
    res.json({
      actual_columns: cols,
      selected_columns: minimal,
      total_columns: cols.length,
      rows: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Debug] Error in /api/debug/players-safe: ${message}`);
    res.json({ error: message, actual_columns: [], rows: [] });
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

// Debug route — run a raw query to verify column access (no joins, no filters)
app.get('/api/debug/query-test', async (_req, res) => {
  try {
    const db = (await import('./db/connection.js')).getPool();
    // Test 1: Check that 'team' column exists (the correct column)
    const teamTest = await db.query('SELECT team FROM players LIMIT 1');
    // Test 2: Check column names from information_schema
    const colsResult = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'players' AND table_schema = current_schema()
       ORDER BY ordinal_position`
    );
    const columns = colsResult.rows.map(r => r.column_name);
    const hasTeam = columns.includes('team');
    const hasTeamId = columns.includes('team_id');

    let diagnosis: string;
    if (hasTeamId) {
      diagnosis = '❌ PROBLEM: players table has team_id column — this should not exist. Drop it or check migrations.';
    } else if (hasTeam) {
      diagnosis = '✅ OK: players table uses "team" column (VARCHAR). No team_id. This is correct.';
    } else {
      diagnosis = '❌ PROBLEM: players table has neither "team" nor "team_id" column.';
    }

    res.json({
      success: true,
      columns,
      hasTeamColumn: hasTeam,
      hasTeamIdColumn: hasTeamId,
      teamQueryWorks: teamTest.rows.length >= 0,
      sampleRow: teamTest.rows[0] ?? null,
      diagnosis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    let diagnosis: string;
    if (message.includes('team_id')) {
      diagnosis = 'The query referenced team_id which does not exist. The correct column is "team".';
    } else if (message.includes('team')) {
      diagnosis = 'The query referenced "team" but it failed — check the DB schema.';
    } else {
      diagnosis = `Unexpected error: ${message}`;
    }

    res.json({
      success: false,
      error: message,
      diagnosis,
    });
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

// Minimal players endpoint — no joins, no associations, no computed fields
// Returns only confirmed-existing columns from the base players table
app.get('/api/players-minimal', async (req, res) => {
  try {
    const limitParam = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
    const limit = Math.min(Math.max(1, limitParam), 200);
    console.log(`[API] ➡️ /api/players-minimal request (limit=${limit})`);
    const players = await getPlayersMinimal(limit);
    console.log(`[API] ✅ /api/players-minimal returning ${players.length} rows`);
    res.json({
      players,
      total: players.length,
      liveData: players.length > 0,
      note: 'Minimal query — only base players table, no joins, no associations, only confirmed columns',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] ❌ /api/players-minimal error: ${message}`);
    res.json({
      players: [],
      total: 0,
      liveData: false,
      error: message,
    });
  }
});

// Debug route — player counts grouped by league, season, and source
app.get('/api/debug/player-counts', async (_req, res) => {
  try {
    console.log(`[Debug] ➡️ /api/debug/player-counts request`);
    const counts = await getPlayerCounts();
    console.log(`[Debug] ✅ /api/debug/player-counts: total=${counts.total}`);
    res.json(counts);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Debug] ❌ /api/debug/player-counts error: ${message}`);
    res.json({ error: message, total: 0, byLeague: {}, bySeason: {}, bySource: {} });
  }
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
    // Initialize database (includes ALTER TABLE migrations for missing columns)
    console.log('[Server] Initializing database...');
    await initDatabase();

    // Invalidate column cache after migrations so queries see the updated schema
    invalidatePlayerColumnsCache();

    // Validate that the DB schema matches expected columns
    console.log('[Server] Validating database schema...');
    const schemaReport = await validateSchema();
    if (!schemaReport.players.match || !schemaReport.teams.match) {
      console.warn('[Server] ⚠️ Schema validation found mismatches — check logs above');
    }

    // Explicit startup diagnostics for the team_id issue
    console.log('[Server] === SCHEMA DIAGNOSTIC ===');
    console.log(`[Server] Players table columns: ${schemaReport.players.actual.join(', ')}`);
    console.log(`[Server] Has "team" column: ${schemaReport.players.actual.includes('team')}`);
    console.log(`[Server] Has "team_id" column: ${schemaReport.players.actual.includes('team_id')}`);
    if (schemaReport.players.actual.includes('team_id')) {
      console.error('[Server] ❌ CRITICAL: "team_id" column found in players table — this is NOT expected!');
      console.error('[Server]   No query in this codebase uses team_id. All queries use "team" (VARCHAR).');
    }
    if (!schemaReport.players.actual.includes('team')) {
      console.error('[Server] ❌ CRITICAL: "team" column NOT found in players table — queries will fail!');
    }
    console.log('[Server] === END DIAGNOSTIC ===');

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
      console.log(`  GET  /health                    — Simple health check`);
      console.log(`  GET  /api/health                — Detailed health check`);
      console.log(`  GET  /api/players               — All players with stats`);
      console.log(`  GET  /api/players-minimal       — Minimal player query (no joins, confirmed columns only)`);
      console.log(`  GET  /api/teams                 — All teams with squads`);
      console.log(`  GET  /api/league-table          — League standings`);
      console.log(`  GET  /api/season                — Current season info`);
      console.log(`  GET  /api/debug/players          — Debug: first 20 players (schema-safe)`);
      console.log(`  GET  /api/debug/players-safe     — Debug: ultra-minimal query with actual columns`);
      console.log(`  GET  /api/debug/schema           — Debug: compare DB vs expected schema`);
      console.log(`  GET  /api/debug/query-test       — Debug: verify team column access`);
      console.log(`  GET  /api/debug/player-counts    — Debug: player counts by league/season/source`);
      console.log(`  POST /api/debug/seed             — Seed 3 test League Two players`);
      console.log(`  POST /api/scrape                — Trigger manual scrape`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();

export { app };
