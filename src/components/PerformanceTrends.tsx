import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MatchLog } from '../types';

interface PerformanceTrendsProps {
  matchLogs: MatchLog[];
}

export default function PerformanceTrends({ matchLogs }: PerformanceTrendsProps) {
  if (matchLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Trends</h3>
        <p>No match logs available to display trends.</p>
      </div>
    );
  }

  const data = matchLogs.map((log) => ({
    label: `${log.opponent} (${new Date(log.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`,
    goals: log.goals,
    assists: log.assists,
    xG: log.xG,
    xA: log.xA,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip />
          <Legend verticalAlign="bottom" />
          <Line
            type="monotone"
            dataKey="goals"
            stroke="#4f46e5"
            name="Goals"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="assists"
            stroke="#10b981"
            name="Assists"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="xG"
            stroke="#a5b4fc"
            name="xG"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="xA"
            stroke="#6ee7b7"
            name="xA"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
