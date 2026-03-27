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

/** Normalize a raw player object from the backend, handling firstname/lastname fields */
interface RawPlayer {
  [key: string]: unknown;
  name?: string;
  firstname?: string;
  lastname?: string;
}

export function normalizePlayer(raw: RawPlayer): Player {
  const name = raw.name || [raw.firstname, raw.lastname].filter(Boolean).join(' ') || 'Unknown';
  const result = { ...raw, name };
  delete result.firstname;
  delete result.lastname;
  return result as unknown as Player;
}

function normalizePlayers(data: RawPlayer[]): Player[] {
  return data.map(normalizePlayer);
}

export async function fetchPlayers(): Promise<Player[]> {
  const data = await request<RawPlayer[]>('/players');
  return normalizePlayers(data);
}

export async function fetchPlayersByLeagueAndSeason(
  league: string,
  season: string
): Promise<Player[]> {
  const data = await request<RawPlayer[]>(
    `/players?league=${encodeURIComponent(league)}&season=${encodeURIComponent(season)}`
  );
  return normalizePlayers(data);
}

export async function fetchPlayersPaginated(
  league: string,
  page: number,
  limit: number,
  season?: string
): Promise<PaginatedPlayersResponse> {
  let endpoint = `/api/players?league=${encodeURIComponent(league)}&page=${page}&limit=${limit}`;
  if (season) {
    endpoint += `&season=${encodeURIComponent(season)}`;
  }
  const data = await request<PaginatedPlayersResponse & { players: RawPlayer[] }>(endpoint);
  return { ...data, players: normalizePlayers(data.players) };
}

export async function fetchPlayer(id: number): Promise<Player> {
  const data = await request<RawPlayer>(`/player/${id}`);
  return normalizePlayer(data);
}

export async function fetchTeamPlayers(teamId: number): Promise<Player[]> {
  const data = await request<RawPlayer[]>(`/api/teams/${teamId}/players`);
  return normalizePlayers(data);
}

export async function fetchLeaguePlayers(leagueId: string): Promise<Player[]> {
  const data = await request<RawPlayer[]>(`/api/league/${encodeURIComponent(leagueId)}/players`);
  return normalizePlayers(data);
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
