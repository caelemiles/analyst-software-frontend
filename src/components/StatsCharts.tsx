import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { PlayerStats } from '../types';

interface StatsChartsProps {
  stats: PlayerStats;
  position: string;
}

export default function StatsCharts({ stats, position }: StatsChartsProps) {
  const attackingData = [
    { name: 'Goals', value: stats.goals, xValue: stats.xG },
    { name: 'Assists', value: stats.assists, xValue: stats.xA },
  ];

  const defensiveData = [
    { name: 'Tackles', value: stats.tackles },
    { name: 'Interceptions', value: stats.interceptions },
    { name: 'Clearances', value: stats.clearances },
  ];

  const radarData = [
    { metric: 'Goals', value: Math.min(stats.goals * 5, 100) },
    { metric: 'Assists', value: Math.min(stats.assists * 8, 100) },
    { metric: 'Pass Acc.', value: stats.pass_accuracy },
    { metric: 'Tackles', value: Math.min(stats.tackles * 1.5, 100) },
    { metric: 'Interceptions', value: Math.min(stats.interceptions * 2, 100) },
    { metric: 'Minutes', value: Math.min((stats.minutes_played / 3420) * 100, 100) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox label="Appearances" value={stats.appearances} />
        <StatBox label="Minutes Played" value={stats.minutes_played.toLocaleString()} />
        <StatBox label="Pass Accuracy" value={`${stats.pass_accuracy}%`} />
        <StatBox label="Passes Completed" value={stats.passes_completed.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Attacking Output vs Expected
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attackingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#4f46e5" name="Actual" />
              <Bar dataKey="xValue" fill="#a5b4fc" name="Expected (xG/xA)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {(position === 'Defender' || position === 'Midfielder') && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Defensive Actions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={defensiveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#059669" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Player"
                dataKey="value"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <p className="text-2xl font-bold text-indigo-600">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
