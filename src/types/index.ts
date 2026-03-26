export interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
  age: number;
  nationality: string;
  image_url?: string;
  stats: PlayerStats;
  highlights?: Highlight[];
  notes?: string;
  ai_summary?: string;
  match_logs?: MatchLog[];
}

export interface PlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  passes_completed: number;
  pass_accuracy: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  minutes_played: number;
  rating: number;
  npxG: number;
  dribbles: number;
  key_passes: number;
  aerial_duels_won: number;
  yellow_cards: number;
  red_cards: number;
  fouls_drawn: number;
  fouls_committed: number;
  saves?: number;
  clean_sheets?: number;
  goals_conceded?: number;
  penalties_saved?: number;
}

export interface Highlight {
  id: string;
  title: string;
  url: string;
  date: string;
}

export interface PlayerFilters {
  search: string;
  team: string;
  position: string;
  minAge: number | '';
  maxAge: number | '';
}

export interface PortfolioPlayer {
  id: number;
  name: string;
  team: string;
  position: string;
}

export interface MatchLog {
  match_date: string;
  opponent: string;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  minutes: number;
  rating: number;
  dribbles: number;
  key_passes: number;
  tackles: number;
  interceptions: number;
}
