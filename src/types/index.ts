export interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
  age: number;
  nationality: string;
  image_url?: string;
  source?: 'api' | 'scraper';
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
  event_type?: 'goal' | 'assist' | 'save' | 'tackle' | 'other';
  minute?: number;
}

export interface PlayerFilters {
  search: string;
  team: string;
  position: string;
  minAge: number | '';
  maxAge: number | '';
  minGoals: number | '';
  minXG: number | '';
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

export interface PaginatedPlayersResponse {
  players: Player[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Team {
  id: number;
  name: string;
  logo?: string;
  league: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  avgXG?: number;
  avgPossession?: number;
  squad?: TeamPlayer[];
}

export interface TeamPlayer {
  id: number;
  name: string;
  position: string;
  age: number;
  nationality: string;
  appearances: number;
  goals: number;
  assists: number;
}

export interface LeagueEntry {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
}

export interface SeasonInfo {
  currentSeason: string;
  league: string;
}

export interface ApiPlayersResponse {
  players: Player[];
  liveData: boolean;
  total: number;
}

export interface DebugInfo {
  url: string;
  status: number | null;
  statusText: string;
  fetchTime: string;
  playerCount: number;
  error: string | null;
  rawBodyLength?: number;
  rawPlayerNames?: string[];
}
