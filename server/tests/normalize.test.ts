import { describe, it, expect } from 'vitest';
import {
  normalizePlayerData,
  normalizeTeamData,
  playerRowToApiFormat,
  teamRowToApiFormat,
  teamRowToLeagueEntry,
} from '../src/scraper/normalize.js';

describe('normalizePlayerData', () => {
  it('normalizes a scraped player to upsert format', () => {
    const scraped = {
      name: 'James Collins',
      team: 'Crawley Town',
      position: 'Forward',
      age: 24,
      nationality: 'England',
      appearances: 32,
      goals: 14,
      assists: 6,
      xg: 12.3,
      xa: 5.1,
      minutes_played: 2680,
      rating: 7.3,
      yellow_cards: 4,
      red_cards: 0,
    };

    const result = normalizePlayerData(scraped, '2025/26', 'EFL League Two');

    expect(result.name).toBe('James Collins');
    expect(result.team).toBe('Crawley Town');
    expect(result.position).toBe('Forward');
    expect(result.age).toBe(24);
    expect(result.nationality).toBe('England');
    expect(result.goals).toBe(14);
    expect(result.assists).toBe(6);
    expect(result.xg).toBe(12.3);
    expect(result.xa).toBe(5.1);
    expect(result.minutes_played).toBe(2680);
    expect(result.season).toBe('2025/26');
    expect(result.league).toBe('EFL League Two');
    expect(result.source).toBe('scraper');
  });

  it('sets defaults for optional fields', () => {
    const scraped = {
      name: 'Test Player',
      team: 'Test Team',
      position: 'Midfielder',
      age: 20,
      nationality: 'England',
      appearances: 10,
      goals: 2,
      assists: 1,
      xg: 1.5,
      xa: 0.8,
      minutes_played: 900,
      rating: 6.5,
      yellow_cards: 1,
      red_cards: 0,
    };

    const result = normalizePlayerData(scraped, '2025/26', 'EFL League Two');

    expect(result.passes_completed).toBe(0);
    expect(result.pass_accuracy).toBe(0);
    expect(result.tackles).toBe(0);
    expect(result.interceptions).toBe(0);
    expect(result.clearances).toBe(0);
    expect(result.dribbles).toBe(0);
    expect(result.key_passes).toBe(0);
    expect(result.aerial_duels_won).toBe(0);
    expect(result.fouls_drawn).toBe(0);
    expect(result.fouls_committed).toBe(0);
  });
});

describe('normalizeTeamData', () => {
  it('normalizes a scraped team to upsert format', () => {
    const scraped = {
      name: 'Barrow',
      position: 1,
      played: 34,
      won: 20,
      drawn: 8,
      lost: 6,
      goals_for: 52,
      goals_against: 28,
      goal_difference: 24,
      points: 68,
    };

    const result = normalizeTeamData(scraped, '2025/26', 'EFL League Two');

    expect(result.name).toBe('Barrow');
    expect(result.league).toBe('EFL League Two');
    expect(result.position).toBe(1);
    expect(result.played).toBe(34);
    expect(result.won).toBe(20);
    expect(result.points).toBe(68);
    expect(result.season).toBe('2025/26');
  });
});

describe('playerRowToApiFormat', () => {
  it('converts a database row to frontend API format', () => {
    const row = {
      id: 1,
      name: 'James Collins',
      team: 'Crawley Town',
      position: 'Forward',
      age: 24,
      nationality: 'England',
      image_url: null,
      source: 'scraper',
      appearances: 32,
      goals: 14,
      assists: 6,
      xg: 12.3,
      xa: 5.1,
      passes_completed: 420,
      pass_accuracy: 78.5,
      tackles: 18,
      interceptions: 12,
      clearances: 8,
      minutes_played: 2680,
      rating: 7.3,
      npxg: 10.5,
      dribbles: 38,
      key_passes: 32,
      aerial_duels_won: 42,
      yellow_cards: 4,
      red_cards: 0,
      fouls_drawn: 35,
      fouls_committed: 22,
      saves: 0,
      clean_sheets: 0,
      goals_conceded: 0,
      penalties_saved: 0,
      notes: '',
      ai_summary: 'Clinical finisher',
    };

    const result = playerRowToApiFormat(row);

    expect(result.id).toBe(1);
    expect(result.name).toBe('James Collins');
    expect(result.stats.goals).toBe(14);
    expect(result.stats.assists).toBe(6);
    expect(result.stats.xG).toBe(12.3);
    expect(result.stats.xA).toBe(5.1);
    expect(result.stats.appearances).toBe(32);
    expect(result.stats.minutes_played).toBe(2680);
    expect(result.stats.rating).toBe(7.3);
    expect(result.stats.yellow_cards).toBe(4);
    // notes and ai_summary are intentionally stripped from the API response
    // to avoid referencing nonexistent production columns
    expect(result).not.toHaveProperty('notes');
    expect(result).not.toHaveProperty('ai_summary');
  });

  it('converts numeric strings from DB to numbers', () => {
    const row = {
      id: 2,
      name: 'Test Player',
      team: 'Test Team',
      position: 'Defender',
      age: 25,
      nationality: 'England',
      image_url: null,
      source: 'scraper',
      appearances: '10' as unknown as number,
      goals: '3' as unknown as number,
      assists: '2' as unknown as number,
      xg: '1.5' as unknown as number,
      xa: '0.8' as unknown as number,
      passes_completed: '100' as unknown as number,
      pass_accuracy: '75.0' as unknown as number,
      tackles: '20' as unknown as number,
      interceptions: '15' as unknown as number,
      clearances: '30' as unknown as number,
      minutes_played: '900' as unknown as number,
      rating: '6.5' as unknown as number,
      npxg: '1.0' as unknown as number,
      dribbles: '5' as unknown as number,
      key_passes: '8' as unknown as number,
      aerial_duels_won: '12' as unknown as number,
      yellow_cards: '1' as unknown as number,
      red_cards: '0' as unknown as number,
      fouls_drawn: '10' as unknown as number,
      fouls_committed: '8' as unknown as number,
      saves: '0' as unknown as number,
      clean_sheets: '0' as unknown as number,
      goals_conceded: '0' as unknown as number,
      penalties_saved: '0' as unknown as number,
      notes: '',
      ai_summary: '',
    };

    const result = playerRowToApiFormat(row);

    expect(typeof result.stats.goals).toBe('number');
    expect(result.stats.goals).toBe(3);
    expect(typeof result.stats.xG).toBe('number');
    expect(result.stats.xG).toBe(1.5);
  });
});

describe('teamRowToApiFormat', () => {
  it('converts a database team row to frontend format', () => {
    const row = {
      id: 1,
      name: 'Barrow',
      logo: null,
      league: 'EFL League Two',
      position: 1,
      played: 34,
      won: 20,
      drawn: 8,
      lost: 6,
      goals_for: 52,
      goals_against: 28,
      goal_difference: 24,
      points: 68,
      avg_xg: 1.42,
      avg_possession: 52.1,
      form: 'WWDWL',
    };

    const squad = [
      { id: 101, name: 'Billy Waters', position: 'Forward', age: 28, nationality: 'England', appearances: 33, goals: 12, assists: 5 },
    ];

    const result = teamRowToApiFormat(row, squad);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Barrow');
    expect(result.goalsFor).toBe(52);
    expect(result.goalsAgainst).toBe(28);
    expect(result.goalDifference).toBe(24);
    expect(result.points).toBe(68);
    expect(result.squad).toHaveLength(1);
    expect(result.squad[0].name).toBe('Billy Waters');
  });
});

describe('teamRowToLeagueEntry', () => {
  it('converts a team row to league table entry', () => {
    const row = {
      position: 1,
      name: 'Barrow',
      played: 34,
      won: 20,
      drawn: 8,
      lost: 6,
      goals_for: 52,
      goals_against: 28,
      goal_difference: 24,
      points: 68,
      form: 'WWDWL',
    };

    const result = teamRowToLeagueEntry(row);

    expect(result.position).toBe(1);
    expect(result.team).toBe('Barrow');
    expect(result.played).toBe(34);
    expect(result.points).toBe(68);
    expect(result.form).toEqual(['W', 'W', 'D', 'W', 'L']);
  });

  it('handles empty form string', () => {
    const row = {
      position: 5,
      name: 'Test Team',
      played: 10,
      won: 5,
      drawn: 3,
      lost: 2,
      goals_for: 15,
      goals_against: 10,
      goal_difference: 5,
      points: 18,
      form: '',
    };

    const result = teamRowToLeagueEntry(row);
    expect(result.form).toBeUndefined();
  });
});
