import type { Player, PaginatedPlayersResponse, Team, LeagueEntry, SeasonInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cacheKey = endpoint;
  const isGet = !options?.method || options.method === 'GET';

  if (isGet) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data: T = await response.json();

  if (isGet) {
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return data;
}

export async function fetchPlayers(): Promise<Player[]> {
  return request<Player[]>('/players');
}

export async function fetchPlayersPaginated(
  league: string,
  page: number,
  limit: number
): Promise<PaginatedPlayersResponse> {
  return request<PaginatedPlayersResponse>(
    `/api/players?league=${encodeURIComponent(league)}&page=${page}&limit=${limit}`
  );
}

export async function fetchPlayer(id: number): Promise<Player> {
  return request<Player>(`/player/${id}`);
}

export async function fetchTeams(): Promise<Team[]> {
  return request<Team[]>('/api/teams');
}

export async function fetchLeagueTable(): Promise<LeagueEntry[]> {
  return request<LeagueEntry[]>('/api/league-table');
}

export async function fetchCurrentSeason(): Promise<SeasonInfo> {
  return request<SeasonInfo>('/api/season');
}

export async function fetchHighlights(playerId: number): Promise<{ highlights: Player['highlights'] }> {
  return request<{ highlights: Player['highlights'] }>(`/api/players/${playerId}/highlights`);
}

export async function updatePlayerNotes(id: number, notes: string): Promise<Player> {
  return request<Player>(`/player/${id}/update-notes`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function exportPortfolio(playerIds: number[]): Promise<Blob> {
  const url = `${API_BASE_URL}/portfolio/export`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_ids: playerIds }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.blob();
}
