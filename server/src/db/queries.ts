import { getPool } from './connection.js';

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
  if (options?.team) {
    conditions.push(`team = $${paramIdx++}`);
    params.push(options.team);
  }
  if (options?.position) {
    conditions.push(`position = $${paramIdx++}`);
    params.push(options.position);
  }
  if (options?.search) {
    conditions.push(`(name ILIKE $${paramIdx} OR team ILIKE $${paramIdx})`);
    params.push(`%${options.search}%`);
    paramIdx++;
  }
  if (options?.minAge !== undefined) {
    conditions.push(`age >= $${paramIdx++}`);
    params.push(options.minAge);
  }
  if (options?.maxAge !== undefined) {
    conditions.push(`age <= $${paramIdx++}`);
    params.push(options.maxAge);
  }
  if (options?.minGoals !== undefined) {
    conditions.push(`goals >= $${paramIdx++}`);
    params.push(options.minGoals);
  }
  if (options?.minXG !== undefined) {
    conditions.push(`xg >= $${paramIdx++}`);
    params.push(options.minXG);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM players ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get paginated results
  let query = `SELECT * FROM players ${whereClause} ORDER BY goals DESC, assists DESC, name ASC`;
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

  if (season) {
    conditions.push('season = $2');
    params.push(season);
  }

  const result = await db.query<PlayerRow>(
    `SELECT * FROM players WHERE ${conditions.join(' AND ')} ORDER BY goals DESC, name ASC`,
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
