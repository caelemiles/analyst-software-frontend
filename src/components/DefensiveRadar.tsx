import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { PlayerStats } from '../types';
import { calculatePer90 } from '../utils/per90';

interface DefensiveRadarProps {
  stats: PlayerStats;
}

export default function DefensiveRadar({ stats }: DefensiveRadarProps) {
  const mp = stats.minutes_played;

  const tacklesPer90 = calculatePer90(stats.tackles, mp);
  const interceptionsPer90 = calculatePer90(stats.interceptions, mp);
  const clearancesPer90 = calculatePer90(stats.clearances, mp);
  const aerialDuelsPer90 = calculatePer90(stats.aerial_duels_won, mp);
  const foulsCommittedPer90 = calculatePer90(stats.fouls_committed, mp);

  // Per-90 caps used to normalize values to a 0-100 radar scale.
  // Based on typical top-league benchmarks for elite defensive players.
  const maxTackles = 5;       // ~5 tackles p90 is elite
  const maxInterceptions = 4; // ~4 interceptions p90 is elite
  const maxClearances = 8;    // ~8 clearances p90 is elite for CBs
  const maxAerialDuels = 6;   // ~6 aerial duels won p90 is elite
  const maxFouls = 3;         // ~3 fouls p90 is a high rate (inverted)

  const normalize = (value: number, max: number) =>
    Math.min(Math.round((value / max) * 100), 100);

  const radarData = [
    { metric: 'Tackles p90', value: normalize(tacklesPer90, maxTackles) },
    { metric: 'Interceptions p90', value: normalize(interceptionsPer90, maxInterceptions) },
    { metric: 'Clearances p90', value: normalize(clearancesPer90, maxClearances) },
    { metric: 'Aerial Duels p90', value: normalize(aerialDuelsPer90, maxAerialDuels) },
    {
      metric: 'Fouls p90 (inv.)',
      value: normalize(Math.max(maxFouls - foulsCommittedPer90, 0), maxFouls),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Defensive &amp; Physical Profile (Per 90)
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Tooltip />
          <Radar
            name="Defensive"
            dataKey="value"
            stroke="#059669"
            fill="#059669"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
