import type { Player } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

  return response.json();
}

export async function fetchPlayers(): Promise<Player[]> {
  return request<Player[]>('/players');
}

export async function fetchPlayer(id: number): Promise<Player> {
  return request<Player>(`/player/${id}`);
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
