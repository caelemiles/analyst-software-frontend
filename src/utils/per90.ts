import type { PlayerStats } from '../types';

export function calculatePer90(stat: number, minutesPlayed: number): number {
  if (minutesPlayed === 0) return 0;
  return parseFloat(((stat / minutesPlayed) * 90).toFixed(2));
}

export function getPlayerPer90Stats(stats: PlayerStats) {
  const mp = stats.minutes_played;
  return {
    goalsPer90: calculatePer90(stats.goals, mp),
    assistsPer90: calculatePer90(stats.assists, mp),
    xGPer90: calculatePer90(stats.xG, mp),
    xAPer90: calculatePer90(stats.xA, mp),
    npxGPer90: calculatePer90(stats.npxG, mp),
    tacklesPer90: calculatePer90(stats.tackles, mp),
    interceptionsPer90: calculatePer90(stats.interceptions, mp),
    clearancesPer90: calculatePer90(stats.clearances, mp),
    dribblesPer90: calculatePer90(stats.dribbles, mp),
    keyPassesPer90: calculatePer90(stats.key_passes, mp),
    aerialDuelsPer90: calculatePer90(stats.aerial_duels_won, mp),
  };
}
