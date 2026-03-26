import { useState } from 'react';
import type { PlayerStats } from '../types';
import { getPlayerPer90Stats } from '../utils/per90';

interface Per90MetricsTableProps {
  stats: PlayerStats;
}

export default function Per90MetricsTable({ stats }: Per90MetricsTableProps) {
  const [viewMode, setViewMode] = useState<'per90' | 'total'>('per90');
  const per90 = getPlayerPer90Stats(stats);

  const metrics = [
    { label: 'Goals', total: stats.goals, per90: per90.goalsPer90 },
    { label: 'Assists', total: stats.assists, per90: per90.assistsPer90 },
    { label: 'xG', total: stats.xG, per90: per90.xGPer90 },
    { label: 'xA', total: stats.xA, per90: per90.xAPer90 },
    { label: 'npxG', total: stats.npxG, per90: per90.npxGPer90 },
    { label: 'Tackles', total: stats.tackles, per90: per90.tacklesPer90 },
    { label: 'Interceptions', total: stats.interceptions, per90: per90.interceptionsPer90 },
    { label: 'Clearances', total: stats.clearances, per90: per90.clearancesPer90 },
    { label: 'Dribbles', total: stats.dribbles, per90: per90.dribblesPer90 },
    { label: 'Key Passes', total: stats.key_passes, per90: per90.keyPassesPer90 },
    { label: 'Aerial Duels Won', total: stats.aerial_duels_won, per90: per90.aerialDuelsPer90 },
  ];

  const exportCSV = () => {
    const headers = ['Metric', viewMode === 'per90' ? 'Per 90' : 'Total'];
    const rows = metrics.map((m) => [m.label, viewMode === 'per90' ? m.per90 : m.total]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `per90_metrics_${viewMode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Per-90 Metrics</h3>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('per90')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'per90'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Per 90
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'total'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Per Match
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-gray-500 mb-3">
          {viewMode === 'per90'
            ? `Based on ${stats.minutes_played.toLocaleString()} minutes played`
            : `Season totals from ${stats.appearances} appearances`}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {viewMode === 'per90'
                  ? m.per90.toFixed(2)
                  : typeof m.total === 'number' && !Number.isInteger(m.total)
                    ? m.total.toFixed(1)
                    : m.total}
              </p>
              <p className="text-sm text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
