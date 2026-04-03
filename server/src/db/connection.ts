import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const isProduction = process.env.NODE_ENV === 'production';
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  const db = getPool();
  try {
    // Create tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        api_player_id INTEGER UNIQUE,
        name VARCHAR(255) NOT NULL,
        team VARCHAR(255) NOT NULL,
        position VARCHAR(50) NOT NULL DEFAULT 'Unknown',
        age INTEGER NOT NULL DEFAULT 0,
        nationality VARCHAR(100) NOT NULL DEFAULT 'Unknown',
        image_url TEXT,
        source VARCHAR(20) DEFAULT 'scraper',
        appearances INTEGER NOT NULL DEFAULT 0,
        goals INTEGER NOT NULL DEFAULT 0,
        assists INTEGER NOT NULL DEFAULT 0,
        xg NUMERIC(6,2) NOT NULL DEFAULT 0,
        xa NUMERIC(6,2) NOT NULL DEFAULT 0,
        passes_completed INTEGER NOT NULL DEFAULT 0,
        pass_accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
        tackles INTEGER NOT NULL DEFAULT 0,
        interceptions INTEGER NOT NULL DEFAULT 0,
        clearances INTEGER NOT NULL DEFAULT 0,
        minutes_played INTEGER NOT NULL DEFAULT 0,
        rating NUMERIC(4,2) NOT NULL DEFAULT 0,
        npxg NUMERIC(6,2) NOT NULL DEFAULT 0,
        dribbles INTEGER NOT NULL DEFAULT 0,
        key_passes INTEGER NOT NULL DEFAULT 0,
        aerial_duels_won INTEGER NOT NULL DEFAULT 0,
        yellow_cards INTEGER NOT NULL DEFAULT 0,
        red_cards INTEGER NOT NULL DEFAULT 0,
        fouls_drawn INTEGER NOT NULL DEFAULT 0,
        fouls_committed INTEGER NOT NULL DEFAULT 0,
        saves INTEGER DEFAULT 0,
        clean_sheets INTEGER DEFAULT 0,
        goals_conceded INTEGER DEFAULT 0,
        penalties_saved INTEGER DEFAULT 0,
        season VARCHAR(10) NOT NULL DEFAULT '2025/26',
        league VARCHAR(100) NOT NULL DEFAULT 'EFL League Two',
        notes TEXT DEFAULT '',
        ai_summary TEXT DEFAULT '',
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_player_team_season UNIQUE (name, team, season)
      );
    `);

    // --- MIGRATION: Add any missing columns to an already-existing players table ---
    // CREATE TABLE IF NOT EXISTS does nothing when the table already exists,
    // so production tables may lack columns added after the initial creation.
    const playerAlterStatements = [
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS api_player_id INTEGER UNIQUE`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS position VARCHAR(50) NOT NULL DEFAULT 'Unknown'`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS age INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) NOT NULL DEFAULT 'Unknown'`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS image_url TEXT`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'scraper'`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS appearances INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS goals INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS assists INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS xg NUMERIC(6,2) NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS xa NUMERIC(6,2) NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS passes_completed INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS pass_accuracy NUMERIC(5,2) NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS tackles INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS interceptions INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS clearances INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS minutes_played INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS rating NUMERIC(4,2) NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS npxg NUMERIC(6,2) NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS dribbles INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS key_passes INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS aerial_duels_won INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS yellow_cards INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS red_cards INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS fouls_drawn INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS fouls_committed INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS clean_sheets INTEGER DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS goals_conceded INTEGER DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS penalties_saved INTEGER DEFAULT 0`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS season VARCHAR(10) NOT NULL DEFAULT '2025/26'`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS league VARCHAR(100) NOT NULL DEFAULT 'EFL League Two'`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS ai_summary TEXT DEFAULT ''`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    ];
    for (const stmt of playerAlterStatements) {
      try {
        await db.query(stmt);
      } catch (alterErr) {
        // Log but don't fail — the column may already exist with a different constraint
        console.warn(`[DB] ALTER warning: ${alterErr instanceof Error ? alterErr.message : String(alterErr)}`);
      }
    }
    // Ensure unique constraint exists (ignore error if already present)
    try {
      await db.query(`ALTER TABLE players ADD CONSTRAINT unique_player_team_season UNIQUE (name, team, season)`);
    } catch {
      // constraint already exists — that's fine
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        league VARCHAR(100) NOT NULL DEFAULT 'EFL League Two',
        position INTEGER NOT NULL DEFAULT 0,
        played INTEGER NOT NULL DEFAULT 0,
        won INTEGER NOT NULL DEFAULT 0,
        drawn INTEGER NOT NULL DEFAULT 0,
        lost INTEGER NOT NULL DEFAULT 0,
        goals_for INTEGER NOT NULL DEFAULT 0,
        goals_against INTEGER NOT NULL DEFAULT 0,
        goal_difference INTEGER NOT NULL DEFAULT 0,
        points INTEGER NOT NULL DEFAULT 0,
        avg_xg NUMERIC(5,2) DEFAULT 0,
        avg_possession NUMERIC(5,2) DEFAULT 0,
        form VARCHAR(20) DEFAULT '',
        season VARCHAR(10) NOT NULL DEFAULT '2025/26',
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_team_season UNIQUE (name, season)
      );
    `);

    // --- MIGRATION: Add any missing columns to an already-existing teams table ---
    const teamAlterStatements = [
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo TEXT`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS league VARCHAR(100) NOT NULL DEFAULT 'EFL League Two'`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS played INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS won INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS drawn INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS lost INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS goals_for INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS goals_against INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS goal_difference INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS avg_xg NUMERIC(5,2) DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS avg_possession NUMERIC(5,2) DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS form VARCHAR(20) DEFAULT ''`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS season VARCHAR(10) NOT NULL DEFAULT '2025/26'`,
      `ALTER TABLE teams ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    ];
    for (const stmt of teamAlterStatements) {
      try {
        await db.query(stmt);
      } catch (alterErr) {
        console.warn(`[DB] ALTER warning: ${alterErr instanceof Error ? alterErr.message : String(alterErr)}`);
      }
    }
    try {
      await db.query(`ALTER TABLE teams ADD CONSTRAINT unique_team_season UNIQUE (name, season)`);
    } catch {
      // constraint already exists
    }

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_players_team ON players(team)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_players_league ON players(league)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_players_season ON players(season)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_players_position ON players(position)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_teams_season ON teams(season)`);

    // Log final schema state
    const finalCols = await getTableColumns('players');
    console.log(`[DB] Players table now has ${finalCols.length} columns: ${finalCols.join(', ')}`);

    console.log('[DB] Database schema initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database schema:', error);
    throw error;
  }
}

/**
 * Expected columns for the players table.
 * This is the source-of-truth for schema validation at startup.
 */
export const EXPECTED_PLAYER_COLUMNS = [
  'id', 'api_player_id', 'name', 'team', 'position', 'age', 'nationality',
  'image_url', 'source', 'appearances', 'goals', 'assists', 'xg', 'xa',
  'passes_completed', 'pass_accuracy', 'tackles', 'interceptions', 'clearances',
  'minutes_played', 'rating', 'npxg', 'dribbles', 'key_passes', 'aerial_duels_won',
  'yellow_cards', 'red_cards', 'fouls_drawn', 'fouls_committed',
  'saves', 'clean_sheets', 'goals_conceded', 'penalties_saved',
  'season', 'league', 'notes', 'ai_summary', 'last_updated',
];

/**
 * Expected columns for the teams table.
 */
export const EXPECTED_TEAM_COLUMNS = [
  'id', 'name', 'logo', 'league', 'position', 'played', 'won', 'drawn', 'lost',
  'goals_for', 'goals_against', 'goal_difference', 'points',
  'avg_xg', 'avg_possession', 'form', 'season', 'last_updated',
];

/**
 * Query the actual column names for a table from information_schema.
 */
export async function getTableColumns(tableName: string): Promise<string[]> {
  const db = getPool();
  const result = await db.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = $1 AND table_schema = current_schema()
     ORDER BY ordinal_position`,
    [tableName]
  );
  return result.rows.map(r => r.column_name);
}

/**
 * Validate that the actual database schema matches the expected columns.
 * Logs warnings for mismatches but does not throw — allows the server to start.
 */
export async function validateSchema(): Promise<{
  players: { actual: string[]; missing: string[]; extra: string[]; match: boolean };
  teams: { actual: string[]; missing: string[]; extra: string[]; match: boolean };
}> {
  const playerCols = await getTableColumns('players');
  const teamCols = await getTableColumns('teams');

  const playerMissing = EXPECTED_PLAYER_COLUMNS.filter(c => !playerCols.includes(c));
  const playerExtra = playerCols.filter(c => !EXPECTED_PLAYER_COLUMNS.includes(c));
  const teamMissing = EXPECTED_TEAM_COLUMNS.filter(c => !teamCols.includes(c));
  const teamExtra = teamCols.filter(c => !EXPECTED_TEAM_COLUMNS.includes(c));

  const playersMatch = playerMissing.length === 0 && playerExtra.length === 0;
  const teamsMatch = teamMissing.length === 0 && teamExtra.length === 0;

  if (playersMatch) {
    console.log(`[Schema] ✅ players table columns match expected schema (${playerCols.length} columns)`);
  } else {
    console.warn(`[Schema] ⚠️ players table schema MISMATCH`);
    if (playerMissing.length > 0) console.warn(`[Schema]   Missing columns: ${playerMissing.join(', ')}`);
    if (playerExtra.length > 0) console.warn(`[Schema]   Extra columns: ${playerExtra.join(', ')}`);
  }

  if (teamsMatch) {
    console.log(`[Schema] ✅ teams table columns match expected schema (${teamCols.length} columns)`);
  } else {
    console.warn(`[Schema] ⚠️ teams table schema MISMATCH`);
    if (teamMissing.length > 0) console.warn(`[Schema]   Missing columns: ${teamMissing.join(', ')}`);
    if (teamExtra.length > 0) console.warn(`[Schema]   Extra columns: ${teamExtra.join(', ')}`);
  }

  // IMPORTANT: The players table uses `team VARCHAR(255)` (plain team name),
  // NOT `team_id`. There is no foreign-key relationship to the teams table.
  // Players are linked to teams by matching the `team` name string.
  if (playerCols.includes('team_id')) {
    console.error(`[Schema] ❌ UNEXPECTED: players table has a 'team_id' column — this is not in the expected schema`);
  }

  return {
    players: { actual: playerCols, missing: playerMissing, extra: playerExtra, match: playersMatch },
    teams: { actual: teamCols, missing: teamMissing, extra: teamExtra, match: teamsMatch },
  };
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
