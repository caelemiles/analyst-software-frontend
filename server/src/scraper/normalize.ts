import type { ScrapedPlayer, ScrapedTeam } from './fotmob.js';
import type { UpsertPlayerData, UpsertTeamData } from '../db/queries.js';

/**
 * Normalize a scraped player into the database upsert format.
 */
export function normalizePlayerData(
  player: ScrapedPlayer,
  season: string,
  league: string
): UpsertPlayerData {
  return {
    name: player.name,
    team: player.team,
    position: player.position,
    age: player.age,
    nationality: player.nationality,
    image_url: player.image_url,
    source: 'scraper',
    appearances: player.appearances,
    goals: player.goals,
    assists: player.assists,
    xg: player.xg,
    xa: player.xa,
    passes_completed: 0,
    pass_accuracy: 0,
    tackles: 0,
    interceptions: 0,
    clearances: 0,
    minutes_played: player.minutes_played,
    rating: player.rating,
    npxg: 0,
    dribbles: 0,
    key_passes: 0,
    aerial_duels_won: 0,
    yellow_cards: player.yellow_cards,
    red_cards: player.red_cards,
    fouls_drawn: 0,
    fouls_committed: 0,
    season,
    league,
  };
}

/**
 * Normalize a scraped team into the database upsert format.
 */
export function normalizeTeamData(
  team: ScrapedTeam,
  season: string,
  league: string
): UpsertTeamData {
  return {
    name: team.name,
    logo: team.logo,
    league,
    position: team.position,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goals_for: team.goals_for,
    goals_against: team.goals_against,
    goal_difference: team.goal_difference,
    points: team.points,
    form: team.form,
    season,
  };
}

/**
 * Convert a database player row to the API response format expected by the frontend.
 * Tolerates missing columns — any field not present in the row gets a safe default.
 * This is critical because the production players table may not have all columns.
 *
 * IMPORTANT: Only returns fields that are confirmed to exist in the base players table.
 * Does NOT include computed fields (goals_per90, match_id) or optional fields
 * (ai_summary, notes) that may not exist in production. This keeps the route safe.
 */
export function playerRowToApiFormat(row: Record<string, unknown>) {
  return {
    id: row.id ?? 0,
    api_player_id: row.api_player_id ?? null,
    name: row.name ?? 'Unknown',
    team: row.team ?? 'Unknown',
    position: row.position ?? 'Unknown',
    age: row.age ?? 0,
    nationality: row.nationality ?? 'Unknown',
    image_url: row.image_url ?? null,
    source: row.source ?? 'scraper',
    season: row.season ?? '',
    league: row.league ?? '',
    stats: {
      appearances: Number(row.appearances ?? 0),
      goals: Number(row.goals ?? 0),
      assists: Number(row.assists ?? 0),
      xG: Number(row.xg ?? 0),
      xA: Number(row.xa ?? 0),
      passes_completed: Number(row.passes_completed ?? 0),
      pass_accuracy: Number(row.pass_accuracy ?? 0),
      tackles: Number(row.tackles ?? 0),
      interceptions: Number(row.interceptions ?? 0),
      clearances: Number(row.clearances ?? 0),
      minutes_played: Number(row.minutes_played ?? 0),
      rating: Number(row.rating ?? 0),
      npxG: Number(row.npxg ?? 0),
      dribbles: Number(row.dribbles ?? 0),
      key_passes: Number(row.key_passes ?? 0),
      aerial_duels_won: Number(row.aerial_duels_won ?? 0),
      yellow_cards: Number(row.yellow_cards ?? 0),
      red_cards: Number(row.red_cards ?? 0),
      fouls_drawn: Number(row.fouls_drawn ?? 0),
      fouls_committed: Number(row.fouls_committed ?? 0),
      saves: Number(row.saves ?? 0),
      clean_sheets: Number(row.clean_sheets ?? 0),
      goals_conceded: Number(row.goals_conceded ?? 0),
      penalties_saved: Number(row.penalties_saved ?? 0),
    },
  };
}

/**
 * Convert a database team row to the API response format expected by the frontend.
 */
export function teamRowToApiFormat(
  row: {
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
  },
  squad?: Array<{
    id: number;
    name: string;
    position: string;
    age: number;
    nationality: string;
    appearances: number;
    goals: number;
    assists: number;
  }>
) {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    league: row.league,
    position: Number(row.position),
    played: Number(row.played),
    won: Number(row.won),
    drawn: Number(row.drawn),
    lost: Number(row.lost),
    goalsFor: Number(row.goals_for),
    goalsAgainst: Number(row.goals_against),
    goalDifference: Number(row.goal_difference),
    points: Number(row.points),
    avgXG: Number(row.avg_xg),
    avgPossession: Number(row.avg_possession),
    squad: squad ?? [],
  };
}

/**
 * Convert a team row to a league table entry for the frontend.
 */
export function teamRowToLeagueEntry(row: {
  position: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string;
}) {
  const formStr = row.form ?? '';
  const formArr = formStr
    .split('')
    .filter((c): c is 'W' | 'D' | 'L' => ['W', 'D', 'L'].includes(c));

  return {
    position: Number(row.position),
    team: row.name,
    played: Number(row.played),
    won: Number(row.won),
    drawn: Number(row.drawn),
    lost: Number(row.lost),
    goalsFor: Number(row.goals_for),
    goalsAgainst: Number(row.goals_against),
    goalDifference: Number(row.goal_difference),
    points: Number(row.points),
    form: formArr.length > 0 ? formArr : undefined,
  };
}
