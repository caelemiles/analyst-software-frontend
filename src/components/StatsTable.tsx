import { useState } from 'react';
import type { MatchLog } from '../types';

interface StatsTableProps {
  matchLogs: MatchLog[];
}

type SortKey = 'match_date' | 'opponent' | 'goals' | 'assists' | 'xG' | 'xA' | 'minutes' | 'rating' | 'tackles' | 'key_passes';

export default function StatsTable({ matchLogs }: StatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('match_date');
  const [sortAsc, setSortAsc] = useState(false);

  if (matchLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No match data available.
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...matchLogs].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const exportCSV = () => {
    const headers = ['Date', 'Opponent', 'Goals', 'Assists', 'xG', 'xA', 'Minutes', 'Rating', 'Tackles', 'Key Passes'];
    const rows = sorted.map((log) => [
      log.match_date,
      log.opponent,
      log.goals,
      log.assists,
      log.xG,
      log.xA,
      log.minutes,
      log.rating,
      log.tackles,
      log.key_passes,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'match_stats.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortAsc ? '↑' : '↓';
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: 'match_date', label: 'Date' },
    { key: 'opponent', label: 'Opponent' },
    { key: 'goals', label: 'Goals' },
    { key: 'assists', label: 'Assists' },
    { key: 'xG', label: 'xG' },
    { key: 'xA', label: 'xA' },
    { key: 'minutes', label: 'Min' },
    { key: 'rating', label: 'Rating' },
    { key: 'tackles', label: 'Tackles' },
    { key: 'key_passes', label: 'Key Passes' },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Match-by-Match Stats</h3>
        <button
          onClick={exportCSV}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          📥 Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:text-indigo-600 select-none whitespace-nowrap"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label} {sortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((log, i) => (
              <tr
                key={`${log.match_date}-${log.opponent}`}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                  {new Date(log.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 font-medium">{log.opponent}</td>
                <td className="px-3 py-2 text-gray-700">{log.goals}</td>
                <td className="px-3 py-2 text-gray-700">{log.assists}</td>
                <td className="px-3 py-2 text-gray-700">{log.xG.toFixed(1)}</td>
                <td className="px-3 py-2 text-gray-700">{log.xA.toFixed(1)}</td>
                <td className="px-3 py-2 text-gray-700">{log.minutes}</td>
                <td className="px-3 py-2 text-gray-700">{log.rating.toFixed(1)}</td>
                <td className="px-3 py-2 text-gray-700">{log.tackles}</td>
                <td className="px-3 py-2 text-gray-700">{log.key_passes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
