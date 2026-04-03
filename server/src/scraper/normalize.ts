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
 */
export function playerRowToApiFormat(row: {
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
  notes: string;
  ai_summary: string;
}) {
  return {
    id: row.id,
    api_player_id: row.api_player_id,
    name: row.name,
    team: row.team,
    position: row.position,
    age: row.age,
    nationality: row.nationality,
    image_url: row.image_url,
    source: row.source,
    stats: {
      appearances: Number(row.appearances),
      goals: Number(row.goals),
      assists: Number(row.assists),
      xG: Number(row.xg),
      xA: Number(row.xa),
      passes_completed: Number(row.passes_completed),
      pass_accuracy: Number(row.pass_accuracy),
      tackles: Number(row.tackles),
      interceptions: Number(row.interceptions),
      clearances: Number(row.clearances),
      minutes_played: Number(row.minutes_played),
      rating: Number(row.rating),
      npxG: Number(row.npxg),
      dribbles: Number(row.dribbles),
      key_passes: Number(row.key_passes),
      aerial_duels_won: Number(row.aerial_duels_won),
      yellow_cards: Number(row.yellow_cards),
      red_cards: Number(row.red_cards),
      fouls_drawn: Number(row.fouls_drawn),
      fouls_committed: Number(row.fouls_committed),
      saves: Number(row.saves),
      clean_sheets: Number(row.clean_sheets),
      goals_conceded: Number(row.goals_conceded),
      penalties_saved: Number(row.penalties_saved),
    },
    notes: row.notes,
    ai_summary: row.ai_summary,
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
