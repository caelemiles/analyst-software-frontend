import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the fetch function before importing modules
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import {
  fetchLeagueStandings,
  fetchTeamSquad,
  fetchPlayerStats,
  scrapeLeague,
  type ScrapedTeam,
  type ScrapedPlayer,
} from '../src/scraper/fotmob.js';

let setTimeoutSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockFetch.mockReset();
  // Speed up tests by mocking setTimeout used by sleep()
  setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler) => {
    if (typeof fn === 'function') fn();
    return 0 as unknown as NodeJS.Timeout;
  });
});

afterEach(() => {
  setTimeoutSpy.mockRestore();
});

function jsonResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    statusText: 'OK',
  });
}

function errorResponse(status: number, statusText: string) {
  return Promise.resolve({
    ok: false,
    status,
    statusText,
  });
}

describe('fetchLeagueStandings', () => {
  it('parses standings data and includes fotmob_id', async () => {
    const fotmobResponse = {
      table: [{
        data: {
          table: {
            all: [
              {
                name: 'Barrow',
                id: 8570,
                idx: 1,
                played: 34,
                wins: 20,
                draws: 8,
                losses: 6,
                scoresStr: '52-28',
                goalConDiff: 24,
                pts: 68,
              },
              {
                name: 'Gillingham',
                id: 8453,
                idx: 2,
                played: 34,
                wins: 18,
                draws: 10,
                losses: 6,
                scoresStr: '45-25',
                goalConDiff: 20,
                pts: 64,
              },
            ],
          },
        },
      }],
    };

    mockFetch.mockReturnValueOnce(jsonResponse(fotmobResponse));

    const teams = await fetchLeagueStandings('EFL League Two');

    expect(teams).toHaveLength(2);
    expect(teams[0].name).toBe('Barrow');
    expect(teams[0].fotmob_id).toBe(8570);
    expect(teams[0].position).toBe(1);
    expect(teams[0].played).toBe(34);
    expect(teams[0].won).toBe(20);
    expect(teams[0].points).toBe(68);
    expect(teams[0].goals_for).toBe(52);
    expect(teams[0].goals_against).toBe(28);
    expect(teams[0].goal_difference).toBe(24);

    expect(teams[1].name).toBe('Gillingham');
    expect(teams[1].fotmob_id).toBe(8453);
  });

  it('returns empty array when no standings data', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ table: [] }));
    const teams = await fetchLeagueStandings('EFL League Two');
    expect(teams).toHaveLength(0);
  });

  it('throws for unknown league', async () => {
    await expect(fetchLeagueStandings('Unknown League')).rejects.toThrow('Unknown league');
  });
});

describe('fetchTeamSquad', () => {
  it('parses squad data with player IDs', async () => {
    const squadResponse = {
      squad: [
        [
          { id: 1001, name: 'John Smith', role: 'Goalkeeper', ccode: 'ENG' },
          { id: 1002, name: 'Jane Doe', role: 'Defender', ccode: 'SCO' },
        ],
        [
          { id: 1003, name: 'Bob Brown', role: 'Midfielder', ccode: 'WAL' },
        ],
      ],
    };

    mockFetch.mockReturnValueOnce(jsonResponse(squadResponse));
    const players = await fetchTeamSquad(8570, 'Barrow');

    expect(players).toHaveLength(3);
    expect(players[0]).toEqual({ id: 1001, name: 'John Smith', role: 'Goalkeeper', nationality: 'ENG' });
    expect(players[1]).toEqual({ id: 1002, name: 'Jane Doe', role: 'Defender', nationality: 'SCO' });
    expect(players[2]).toEqual({ id: 1003, name: 'Bob Brown', role: 'Midfielder', nationality: 'WAL' });
  });

  it('returns empty array when no squad data', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ squad: null }));
    const players = await fetchTeamSquad(8570, 'Barrow');
    expect(players).toHaveLength(0);
  });
});

describe('fetchPlayerStats', () => {
  it('parses player stats including position and age', async () => {
    const playerResponse = {
      name: 'James Collins',
      origin: { country: { text: 'England' } },
      primaryTeam: { teamName: 'Crawley Town' },
      positionDescription: { primaryPosition: { label: 'Striker' } },
      birthDate: { utcTime: '2000-06-15T00:00:00Z' },
      mainLeague: {
        stats: [
          { key: 'goals', value: 14 },
          { key: 'assists', value: 6 },
          { key: 'matches', value: 32 },
          { key: 'minutes_played', value: 2680 },
          { key: 'rating', value: 7.3 },
          { key: 'expected_goals', value: 12.3 },
          { key: 'expected_assists', value: 5.1 },
          { key: 'yellow_cards', value: 4 },
          { key: 'red_cards', value: 0 },
        ],
      },
    };

    mockFetch.mockReturnValueOnce(jsonResponse(playerResponse));
    const player = await fetchPlayerStats(12345);

    expect(player).not.toBeNull();
    expect(player!.name).toBe('James Collins');
    expect(player!.team).toBe('Crawley Town');
    expect(player!.position).toBe('Forward');
    expect(player!.goals).toBe(14);
    expect(player!.assists).toBe(6);
    expect(player!.appearances).toBe(32);
    expect(player!.xg).toBe(12.3);
    expect(player!.xa).toBe(5.1);
    expect(player!.minutes_played).toBe(2680);
    expect(player!.nationality).toBe('England');
  });

  it('returns null when player name is missing', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ name: null }));
    const player = await fetchPlayerStats(12345);
    expect(player).toBeNull();
  });

  it('returns null on network error', async () => {
    // All 3 retry attempts fail
    mockFetch.mockRejectedValue(new Error('Network error'));
    const player = await fetchPlayerStats(99999);
    expect(player).toBeNull();
  });
});

describe('scrapeLeague', () => {
  it('fetches teams and iterates to get player data', async () => {
    // Call 1: fetchLeagueStandings
    const standingsResponse = {
      table: [{
        data: {
          table: {
            all: [
              {
                name: 'Barrow',
                id: 8570,
                idx: 1,
                played: 34,
                wins: 20,
                draws: 8,
                losses: 6,
                scoresStr: '52-28',
                goalConDiff: 24,
                pts: 68,
              },
            ],
          },
        },
      }],
    };

    // Call 2: fetchTeamSquad for Barrow
    const squadResponse = {
      squad: [
        [
          { id: 1001, name: 'John Smith', role: 'Forward', ccode: 'ENG' },
        ],
      ],
    };

    // Call 3: fetchPlayerStats for John Smith
    const playerResponse = {
      name: 'John Smith',
      origin: { country: { text: 'England' } },
      primaryTeam: { teamName: 'Barrow' },
      positionDescription: { primaryPosition: { label: 'Striker' } },
      birthDate: { utcTime: '1998-03-10T00:00:00Z' },
      mainLeague: {
        stats: [
          { key: 'goals', value: 10 },
          { key: 'assists', value: 3 },
          { key: 'matches', value: 28 },
          { key: 'minutes_played', value: 2100 },
          { key: 'rating', value: 7.0 },
          { key: 'expected_goals', value: 8.5 },
          { key: 'expected_assists', value: 2.4 },
          { key: 'yellow_cards', value: 2 },
          { key: 'red_cards', value: 0 },
        ],
      },
    };

    mockFetch
      .mockReturnValueOnce(jsonResponse(standingsResponse))
      .mockReturnValueOnce(jsonResponse(squadResponse))
      .mockReturnValueOnce(jsonResponse(playerResponse));

    const result = await scrapeLeague('EFL League Two');

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].name).toBe('Barrow');
    expect(result.teams[0].fotmob_id).toBe(8570);

    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBe('John Smith');
    expect(result.players[0].goals).toBe(10);
    expect(result.players[0].assists).toBe(3);
    expect(result.players[0].appearances).toBe(28);
  });

  it('returns empty arrays when no teams found', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ table: [] }));
    const result = await scrapeLeague('EFL League Two');
    expect(result.teams).toHaveLength(0);
    expect(result.players).toHaveLength(0);
  });

  it('skips teams without fotmob_id', async () => {
    const standingsResponse = {
      table: [{
        data: {
          table: {
            all: [
              {
                name: 'NoIdTeam',
                // No id field
                idx: 1,
                played: 10,
                wins: 5,
                draws: 3,
                losses: 2,
                scoresStr: '15-10',
                goalConDiff: 5,
                pts: 18,
              },
            ],
          },
        },
      }],
    };

    mockFetch.mockReturnValueOnce(jsonResponse(standingsResponse));
    const result = await scrapeLeague('EFL League Two');

    expect(result.teams).toHaveLength(1);
    expect(result.players).toHaveLength(0);
    // Only 1 fetch call (standings) since squad was skipped
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('handles player fetch failures gracefully', async () => {
    const standingsResponse = {
      table: [{
        data: {
          table: {
            all: [
              {
                name: 'TestTeam',
                id: 999,
                idx: 1,
                played: 10,
                wins: 5,
                draws: 3,
                losses: 2,
                scoresStr: '15-10',
                goalConDiff: 5,
                pts: 18,
              },
            ],
          },
        },
      }],
    };

    const squadResponse = {
      squad: [[
        { id: 2001, name: 'Fail Player', role: 'Forward', ccode: 'ENG' },
      ]],
    };

    mockFetch
      .mockReturnValueOnce(jsonResponse(standingsResponse))
      .mockReturnValueOnce(jsonResponse(squadResponse))
      // Player fetch fails all 3 retries
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Timeout'));

    const result = await scrapeLeague('EFL League Two');

    expect(result.teams).toHaveLength(1);
    expect(result.players).toHaveLength(0); // Player failed but didn't crash
  });
});
