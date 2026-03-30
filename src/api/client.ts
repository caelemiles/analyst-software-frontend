import type { Player, PaginatedPlayersResponse, Team, LeagueEntry, SeasonInfo, ApiPlayersResponse, DebugInfo } from '../types';

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
  console.log(`[DEBUG] Requesting: ${url}`);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  console.log(`[DEBUG] Response status: ${response.status} ${response.statusText}`);

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

export async function fetchApiPlayers(params?: {
  league?: string;
  season?: string;
  search?: string;
  team?: string;
  position?: string;
  minAge?: number;
  maxAge?: number;
  minGoals?: number;
  minXG?: number;
}): Promise<ApiPlayersResponse> {
  const query = new URLSearchParams();
  if (params?.league) query.set('league', params.league);
  if (params?.season) query.set('season', params.season);
  if (params?.search) query.set('search', params.search);
  if (params?.team) query.set('team', params.team);
  if (params?.position) query.set('position', params.position);
  if (params?.minAge !== undefined) query.set('minAge', String(params.minAge));
  if (params?.maxAge !== undefined) query.set('maxAge', String(params.maxAge));
  if (params?.minGoals !== undefined) query.set('minGoals', String(params.minGoals));
  if (params?.minXG !== undefined) query.set('minXG', String(params.minXG));
  const qs = query.toString();
  const endpoint = `/api/players${qs ? `?${qs}` : ''}`;
  const raw = await request<{ players: RawPlayer[]; liveData: boolean; total: number }>(endpoint);
  console.log(`[DEBUG] fetchApiPlayers returned ${raw.players?.length ?? 0} players (liveData: ${raw.liveData})`);
  return {
    players: normalizePlayers(raw.players),
    liveData: raw.liveData,
    total: raw.total,
  };
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

/**
 * Fetch players from /api/players (or /api/debug/players in test mode)
 * and return both the data and full debug info for the debug panel.
 *
 * In debug mode, calls /api/debug/players with NO query params (no league,
 * season, or other filters). The debug endpoint returns a raw array of rows.
 */
export async function fetchApiPlayersWithDebug(
  params?: {
    league?: string;
    season?: string;
  },
  useDebugEndpoint = false,
): Promise<{ data: ApiPlayersResponse; debug: DebugInfo }> {
  let endpoint: string;
  if (useDebugEndpoint) {
    // Debug mode: call /api/debug/players with NO filters at all
    endpoint = '/api/debug/players';
  } else {
    const query = new URLSearchParams();
    if (params?.league) query.set('league', params.league);
    if (params?.season) query.set('season', params.season);
    const qs = query.toString();
    endpoint = `/api/players${qs ? `?${qs}` : ''}`;
  }
  const url = `${API_BASE_URL}${endpoint}`;

  const debug: DebugInfo = {
    url,
    status: null,
    statusText: '',
    fetchTime: new Date().toISOString(),
    playerCount: 0,
    error: null,
  };

  try {
    console.log(`[DEBUG] Fetching: ${url}`);
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    debug.status = response.status;
    debug.statusText = response.statusText;
    console.log(`[DEBUG] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      debug.error = `HTTP ${response.status} ${response.statusText}`;
      throw new Error(debug.error);
    }

    const text = await response.text();
    debug.rawBodyLength = text.length;

    const json = JSON.parse(text);

    if (useDebugEndpoint) {
      // /api/debug/players returns a raw array of player rows (not wrapped)
      const rows: RawPlayer[] = Array.isArray(json) ? json : (Array.isArray(json.players) ? json.players : []);
      debug.playerCount = rows.length;
      debug.rawPlayerNames = rows.slice(0, 2).map(
        (r) => (r.name || [r.firstname, r.lastname].filter(Boolean).join(' ') || 'Unknown') as string,
      );
      console.log(`[DEBUG] Debug endpoint returned ${rows.length} raw rows`);

      return {
        data: {
          players: normalizePlayers(rows),
          liveData: false,
          total: rows.length,
        },
        debug,
      };
    }

    // Normal mode: /api/players returns { players: [], liveData, total }
    const raw = json as { players: RawPlayer[]; liveData: boolean; total: number };
    const players = Array.isArray(raw.players) ? raw.players : [];
    debug.playerCount = players.length;
    debug.rawPlayerNames = players.slice(0, 2).map(
      (r) => (r.name || [r.firstname, r.lastname].filter(Boolean).join(' ') || 'Unknown') as string,
    );
    console.log(`[DEBUG] Parsed JSON payload: ${players.length} players (liveData: ${raw.liveData})`);

    return {
      data: {
        players: normalizePlayers(players),
        liveData: raw.liveData ?? false,
        total: raw.total ?? players.length,
      },
      debug,
    };
  } catch (err) {
    debug.error = debug.error ?? (err instanceof Error ? err.message : String(err));
    console.error(`[DEBUG] Fetch failed for ${url}:`, err);
    return {
      data: { players: [], liveData: false, total: 0 },
      debug,
    };
  }
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
