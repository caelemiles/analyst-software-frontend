import { describe, it, expect } from 'vitest';
import { calculatePer90, getPlayerPer90Stats } from '../utils/per90';
import type { PlayerStats } from '../types';

describe('calculatePer90', () => {
  it('returns correct value', () => {
    // 10 goals in 900 minutes → (10/900)*90 = 1.0
    expect(calculatePer90(10, 900)).toBe(1);
  });

  it('returns 0 when minutes is 0', () => {
    expect(calculatePer90(5, 0)).toBe(0);
  });
});

describe('getPlayerPer90Stats', () => {
  it('returns all expected fields', () => {
    const stats: PlayerStats = {
      appearances: 30,
      goals: 10,
      assists: 5,
      xG: 9.0,
      xA: 4.5,
      passes_completed: 400,
      pass_accuracy: 80,
      tackles: 18,
      interceptions: 12,
      clearances: 6,
      minutes_played: 2700,
      rating: 7.2,
      npxG: 7.0,
      dribbles: 36,
      key_passes: 27,
      aerial_duels_won: 45,
      yellow_cards: 3,
      red_cards: 0,
      fouls_drawn: 30,
      fouls_committed: 20,
    };

    const result = getPlayerPer90Stats(stats);

    expect(result).toHaveProperty('goalsPer90');
    expect(result).toHaveProperty('assistsPer90');
    expect(result).toHaveProperty('xGPer90');
    expect(result).toHaveProperty('xAPer90');
    expect(result).toHaveProperty('npxGPer90');
    expect(result).toHaveProperty('tacklesPer90');
    expect(result).toHaveProperty('interceptionsPer90');
    expect(result).toHaveProperty('clearancesPer90');
    expect(result).toHaveProperty('dribblesPer90');
    expect(result).toHaveProperty('keyPassesPer90');
    expect(result).toHaveProperty('aerialDuelsPer90');

    // Verify a sample value: goals = 10, minutes = 2700 → (10/2700)*90 = 0.33
    expect(result.goalsPer90).toBe(0.33);
  });
});
