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

interface OffensiveRadarProps {
  stats: PlayerStats;
}

export default function OffensiveRadar({ stats }: OffensiveRadarProps) {
  const mp = stats.minutes_played;

  const goalsPer90 = calculatePer90(stats.goals, mp);
  const assistsPer90 = calculatePer90(stats.assists, mp);
  const xGPer90 = calculatePer90(stats.xG, mp);
  const keyPassesPer90 = calculatePer90(stats.key_passes, mp);
  const dribblesPer90 = calculatePer90(stats.dribbles, mp);
  const aerialDuelsPer90 = calculatePer90(stats.aerial_duels_won, mp);

  // Per-90 caps used to normalize values to a 0-100 radar scale.
  const maxGoals = 1;
  const maxAssists = 0.6;
  const maxXG = 0.8;
  const maxKeyPasses = 3;
  const maxDribbles = 4;
  const maxAerialDuels = 6;

  const normalize = (value: number, max: number) =>
    Math.min(Math.round((value / max) * 100), 100);

  const radarData = [
    { metric: 'Goals p90', value: normalize(goalsPer90, maxGoals) },
    { metric: 'Assists p90', value: normalize(assistsPer90, maxAssists) },
    { metric: 'xG p90', value: normalize(xGPer90, maxXG) },
    { metric: 'Key Passes p90', value: normalize(keyPassesPer90, maxKeyPasses) },
    { metric: 'Dribbles p90', value: normalize(dribblesPer90, maxDribbles) },
    { metric: 'Aerial Duels p90', value: normalize(aerialDuelsPer90, maxAerialDuels) },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Attacking Profile (Per 90)
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Tooltip />
          <Radar
            name="Attacking"
            dataKey="value"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
