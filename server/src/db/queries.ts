import { getPool, getTableColumns } from './connection.js';

export interface PlayerRow {
  id: number;
  api_player_id: number | null;
  name: string;
  team: string;
  position: string;
  age: number;
  nationality: string;
  image_url: string | null;
  source: string;
  appearances: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  passes_completed: number;
  pass_accuracy: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  minutes_played: number;
  rating: number;
  npxg: number;
  dribbles: number;
  key_passes: number;
  aerial_duels_won: number;
  yellow_cards: number;
  red_cards: number;
  fouls_drawn: number;
  fouls_committed: number;
  saves: number;
  clean_sheets: number;
  goals_conceded: number;
  penalties_saved: number;
  season: string;
  league: string;
  notes: string;
  ai_summary: string;
  last_updated: Date;
}

/**
 * Cached set of actual player column names from information_schema.
 * Refreshed on first access and on cache miss.
 */
let _playerColumnsCache: Set<string> | null = null;
let _playerColumnsCacheTime = 0;
const COLUMN_CACHE_TTL_MS = 60_000; // 1 minute

async function getPlayerColumnsSet(): Promise<Set<string>> {
  const now = Date.now();
  if (_playerColumnsCache && now - _playerColumnsCacheTime < COLUMN_CACHE_TTL_MS) {
    return _playerColumnsCache;
  }
  const cols = await getTableColumns('players');
  _playerColumnsCache = new Set(cols);
  _playerColumnsCacheTime = now;
  return _playerColumnsCache;
}

/**
 * Invalidate the cached column set (e.g. after running migrations).
 */
export function invalidatePlayerColumnsCache(): void {
  _playerColumnsCache = null;
  _playerColumnsCacheTime = 0;
}

/**
 * Get a safe, minimal SELECT of only columns that actually exist in the DB.
 * Falls back to SELECT * if the information_schema query itself fails.
 */
async function safeSelectClause(): Promise<string> {
  try {
    const existing = await getPlayerColumnsSet();
    // Always include id, name, team — the true minimal set
    const desired = [
      'id', 'api_player_id', 'name', 'team', 'position', 'age', 'nationality',
      'image_url', 'source', 'appearances', 'goals', 'assists', 'xg', 'xa',
      'passes_completed', 'pass_accuracy', 'tackles', 'interceptions', 'clearances',
      'minutes_played', 'rating', 'npxg', 'dribbles', 'key_passes', 'aerial_duels_won',
      'yellow_cards', 'red_cards', 'fouls_drawn', 'fouls_committed',
      'saves', 'clean_sheets', 'goals_conceded', 'penalties_saved',
      'season', 'league', 'notes', 'ai_summary', 'last_updated',
    ];
    const safe = desired.filter(c => existing.has(c));
    if (safe.length === 0) return '*';
    return safe.join(', ');
  } catch {
    return '*';
  }
}

/**
 * Check whether a column actually exists in the players table.
 */
async function playerColumnExists(col: string): Promise<boolean> {
  try {
    const existing = await getPlayerColumnsSet();
    return existing.has(col);
  } catch {
    return false;
  }
}

/**
 * Get players using only a truly minimal query that cannot fail
 * even if the table has very few columns. Returns raw rows.
 */
export async function getPlayersSafe(limitRows = 20): Promise<Record<string, unknown>[]> {
  const db = getPool();
  try {
    // First discover what columns actually exist
    const cols = await getTableColumns('players');
    if (cols.length === 0) {
      return [];
    }
    const selectCols = cols.join(', ');
    const result = await db.query(
      `SELECT ${selectCols} FROM players LIMIT $1`,
      [limitRows]
    );
    return result.rows;
  } catch {
    // Ultimate fallback: try SELECT * with LIMIT
    try {
      const result = await db.query('SELECT * FROM players LIMIT $1', [limitRows]);
      return result.rows;
    } catch {
      return [];
    }
  }
}

export interface TeamRow {
  id: number;
  name: string;
  logo: string | null;
  league: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  avg_xg: number;
  avg_possession: number;
  form: string;
  season: string;
  last_updated: Date;
}

export interface UpsertPlayerData {
  name: string;
  team: string;
  position: string;
  age: number;
  nationality: string;
  image_url?: string;
  source?: string;
  appearances: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  passes_completed?: number;
  pass_accuracy?: number;
  tackles?: number;
  interceptions?: number;
  clearances?: number;
  minutes_played: number;
  rating?: number;
  npxg?: number;
  dribbles?: number;
  key_passes?: number;
  aerial_duels_won?: number;
  yellow_cards?: number;
  red_cards?: number;
  fouls_drawn?: number;
  fouls_committed?: number;
  saves?: number;
  clean_sheets?: number;
  goals_conceded?: number;
  penalties_saved?: number;
  season: string;
  league: string;
}

export interface UpsertTeamData {
  name: string;
  logo?: string;
  league: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  avg_xg?: number;
  avg_possession?: number;
  form?: string;
  season: string;
}

/**
 * Upsert a player into the database. Uses (name, team, season) as the unique key.
 */
export async function upsertPlayer(data: UpsertPlayerData): Promise<PlayerRow> {
  const db = getPool();
  const result = await db.query<PlayerRow>(
    `INSERT INTO players (
      name, team, position, age, nationality, image_url, source,
      appearances, goals, assists, xg, xa,
      passes_completed, pass_accuracy, tackles, interceptions, clearances,
      minutes_played, rating, npxg, dribbles, key_passes, aerial_duels_won,
      yellow_cards, red_cards, fouls_drawn, fouls_committed,
      saves, clean_sheets, goals_conceded, penalties_saved,
      season, league, last_updated
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23,
      $24, $25, $26, $27,
      $28, $29, $30, $31,
      $32, $33, NOW()
    )
    ON CONFLICT (name, team, season) DO UPDATE SET
      position = EXCLUDED.position,
      age = EXCLUDED.age,
      nationality = EXCLUDED.nationality,
      image_url = COALESCE(EXCLUDED.image_url, players.image_url),
      source = EXCLUDED.source,
      appearances = EXCLUDED.appearances,
      goals = EXCLUDED.goals,
      assists = EXCLUDED.assists,
      xg = EXCLUDED.xg,
      xa = EXCLUDED.xa,
      passes_completed = EXCLUDED.passes_completed,
      pass_accuracy = EXCLUDED.pass_accuracy,
      tackles = EXCLUDED.tackles,
      interceptions = EXCLUDED.interceptions,
      clearances = EXCLUDED.clearances,
      minutes_played = EXCLUDED.minutes_played,
      rating = EXCLUDED.rating,
      npxg = EXCLUDED.npxg,
      dribbles = EXCLUDED.dribbles,
      key_passes = EXCLUDED.key_passes,
      aerial_duels_won = EXCLUDED.aerial_duels_won,
      yellow_cards = EXCLUDED.yellow_cards,
      red_cards = EXCLUDED.red_cards,
      fouls_drawn = EXCLUDED.fouls_drawn,
      fouls_committed = EXCLUDED.fouls_committed,
      saves = EXCLUDED.saves,
      clean_sheets = EXCLUDED.clean_sheets,
      goals_conceded = EXCLUDED.goals_conceded,
      penalties_saved = EXCLUDED.penalties_saved,
      last_updated = NOW()
    RETURNING *`,
    [
      data.name, data.team, data.position, data.age, data.nationality,
      data.image_url ?? null, data.source ?? 'scraper',
      data.appearances, data.goals, data.assists, data.xg, data.xa,
      data.passes_completed ?? 0, data.pass_accuracy ?? 0,
      data.tackles ?? 0, data.interceptions ?? 0, data.clearances ?? 0,
      data.minutes_played, data.rating ?? 0, data.npxg ?? 0,
      data.dribbles ?? 0, data.key_passes ?? 0, data.aerial_duels_won ?? 0,
      data.yellow_cards ?? 0, data.red_cards ?? 0,
      data.fouls_drawn ?? 0, data.fouls_committed ?? 0,
      data.saves ?? 0, data.clean_sheets ?? 0,
      data.goals_conceded ?? 0, data.penalties_saved ?? 0,
      data.season, data.league,
    ]
  );
  return result.rows[0];
}

/**
 * Upsert a team into the database. Uses (name, season) as the unique key.
 */
export async function upsertTeam(data: UpsertTeamData): Promise<TeamRow> {
  const db = getPool();
  const result = await db.query<TeamRow>(
    `INSERT INTO teams (
      name, logo, league, position, played, won, drawn, lost,
      goals_for, goals_against, goal_difference, points,
      avg_xg, avg_possession, form, season, last_updated
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12,
      $13, $14, $15, $16, NOW()
    )
    ON CONFLICT (name, season) DO UPDATE SET
      logo = COALESCE(EXCLUDED.logo, teams.logo),
      league = EXCLUDED.league,
      position = EXCLUDED.position,
      played = EXCLUDED.played,
      won = EXCLUDED.won,
      drawn = EXCLUDED.drawn,
      lost = EXCLUDED.lost,
      goals_for = EXCLUDED.goals_for,
      goals_against = EXCLUDED.goals_against,
      goal_difference = EXCLUDED.goal_difference,
      points = EXCLUDED.points,
      avg_xg = EXCLUDED.avg_xg,
      avg_possession = EXCLUDED.avg_possession,
      form = EXCLUDED.form,
      last_updated = NOW()
    RETURNING *`,
    [
      data.name, data.logo ?? null, data.league, data.position,
      data.played, data.won, data.drawn, data.lost,
      data.goals_for, data.goals_against, data.goal_difference, data.points,
      data.avg_xg ?? 0, data.avg_possession ?? 0,
      data.form ?? '', data.season,
    ]
  );
  return result.rows[0];
}

/**
 * Get all players for a given league and season.
 * Uses schema-aware queries: only selects and filters on columns that
 * actually exist in the production database.
 */
export async function getPlayers(options?: {
  league?: string;
  season?: string;
  team?: string;
  position?: string;
  search?: string;
  minAge?: number;
  maxAge?: number;
  minGoals?: number;
  minXG?: number;
  page?: number;
  limit?: number;
}): Promise<{ players: PlayerRow[]; total: number }> {
  const db = getPool();

  // Build a safe SELECT clause from only columns that exist
  const selectClause = await safeSelectClause();

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  // Only add filter conditions for columns that exist in the actual table
  if (options?.league && await playerColumnExists('league')) {
    conditions.push(`league = $${paramIdx++}`);
    params.push(options.league);
  }
  if (options?.season && await playerColumnExists('season')) {
    conditions.push(`season = $${paramIdx++}`);
    params.push(options.season);
  }
  if (options?.team && await playerColumnExists('team')) {
    conditions.push(`team = $${paramIdx++}`);
    params.push(options.team);
  }
  if (options?.position && await playerColumnExists('position')) {
    conditions.push(`position = $${paramIdx++}`);
    params.push(options.position);
  }
  if (options?.search) {
    const hasName = await playerColumnExists('name');
    const hasTeam = await playerColumnExists('team');
    if (hasName && hasTeam) {
      conditions.push(`(name ILIKE $${paramIdx} OR team ILIKE $${paramIdx})`);
      params.push(`%${options.search}%`);
      paramIdx++;
    } else if (hasName) {
      conditions.push(`name ILIKE $${paramIdx}`);
      params.push(`%${options.search}%`);
      paramIdx++;
    }
  }
  if (options?.minAge !== undefined && await playerColumnExists('age')) {
    conditions.push(`age >= $${paramIdx++}`);
    params.push(options.minAge);
  }
  if (options?.maxAge !== undefined && await playerColumnExists('age')) {
    conditions.push(`age <= $${paramIdx++}`);
    params.push(options.maxAge);
  }
  if (options?.minGoals !== undefined && await playerColumnExists('goals')) {
    conditions.push(`goals >= $${paramIdx++}`);
    params.push(options.minGoals);
  }
  if (options?.minXG !== undefined && await playerColumnExists('xg')) {
    conditions.push(`xg >= $${paramIdx++}`);
    params.push(options.minXG);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build safe ORDER BY — only use columns that exist
  const orderParts: string[] = [];
  if (await playerColumnExists('goals')) orderParts.push('goals DESC');
  if (await playerColumnExists('assists')) orderParts.push('assists DESC');
  if (await playerColumnExists('name')) orderParts.push('name ASC');
  const orderClause = orderParts.length > 0 ? `ORDER BY ${orderParts.join(', ')}` : '';

  // Get total count
  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM players ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get paginated results
  let query = `SELECT ${selectClause} FROM players ${whereClause} ${orderClause}`;
  const queryParams = [...params];

  if (options?.limit) {
    query += ` LIMIT $${paramIdx++}`;
    queryParams.push(options.limit);
  }
  if (options?.page && options?.limit) {
    const offset = (options.page - 1) * options.limit;
    query += ` OFFSET $${paramIdx++}`;
    queryParams.push(offset);
  }

  const result = await db.query<PlayerRow>(query, queryParams);
  return { players: result.rows, total };
}

/**
 * Get all teams for a given league and season.
 */
export async function getTeams(options?: {
  league?: string;
  season?: string;
}): Promise<TeamRow[]> {
  const db = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (options?.league) {
    conditions.push(`league = $${paramIdx++}`);
    params.push(options.league);
  }
  if (options?.season) {
    conditions.push(`season = $${paramIdx++}`);
    params.push(options.season);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query<TeamRow>(
    `SELECT * FROM teams ${whereClause} ORDER BY position ASC`,
    params
  );
  return result.rows;
}

/**
 * Get players for a specific team.
 */
export async function getTeamPlayers(teamId: number, season?: string): Promise<PlayerRow[]> {
  const db = getPool();
  const selectClause = await safeSelectClause();

  // First get the team name
  const teamResult = await db.query<TeamRow>(
    'SELECT name FROM teams WHERE id = $1',
    [teamId]
  );
  if (teamResult.rows.length === 0) {
    return [];
  }

  const teamName = teamResult.rows[0].name;
  const conditions = ['team = $1'];
  const params: unknown[] = [teamName];

  if (season && await playerColumnExists('season')) {
    conditions.push('season = $2');
    params.push(season);
  }

  // Build safe ORDER BY
  const orderParts: string[] = [];
  if (await playerColumnExists('goals')) orderParts.push('goals DESC');
  if (await playerColumnExists('name')) orderParts.push('name ASC');
  const orderClause = orderParts.length > 0 ? `ORDER BY ${orderParts.join(', ')}` : '';

  const result = await db.query<PlayerRow>(
    `SELECT ${selectClause} FROM players WHERE ${conditions.join(' AND ')} ${orderClause}`,
    params
  );
  return result.rows;
}

/**
 * Check if the database has any player data for the given season.
 */
export async function hasData(season: string): Promise<boolean> {
  const db = getPool();
  const result = await db.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM players WHERE season = $1',
    [season]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}

/**
 * Get the last update timestamp for player data.
 */
export async function getLastUpdateTime(season: string): Promise<Date | null> {
  const db = getPool();
  const result = await db.query<{ last_updated: Date }>(
    'SELECT MAX(last_updated) as last_updated FROM players WHERE season = $1',
    [season]
  );
  return result.rows[0]?.last_updated ?? null;
}
