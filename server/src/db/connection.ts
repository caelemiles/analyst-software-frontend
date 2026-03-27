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

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_players_team ON players(team)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_players_league ON players(league)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_players_season ON players(season)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_players_position ON players(position)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_teams_season ON teams(season)`);

    console.log('[DB] Database schema initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database schema:', error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
