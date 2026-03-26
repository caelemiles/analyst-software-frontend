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
