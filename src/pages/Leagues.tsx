import { useState, useEffect, useMemo } from 'react';
import { fetchLeagueTable } from '../api/client';
import { mockLeagueTable } from '../api/mockData';
import { useCurrentSeason } from '../hooks/useCurrentSeason';
import type { LeagueEntry } from '../types';

type SortField = 'position' | 'team' | 'played' | 'won' | 'drawn' | 'lost' | 'goalsFor' | 'goalsAgainst' | 'goalDifference' | 'points';
type SortDirection = 'asc' | 'desc';

export default function Leagues() {
  const { season } = useCurrentSeason();
  const [table, setTable] = useState<LeagueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    async function loadTable() {
      try {
        const data = await fetchLeagueTable();
        setTable(data);
      } catch {
        setTable(mockLeagueTable);
      } finally {
        setLoading(false);
      }
    }
    loadTable();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'team' ? 'asc' : 'desc');
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const sortedTable = useMemo(() => {
    const copy = [...table];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return copy;
  }, [table, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-slate-400">Loading league table...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Season Banner */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 px-5 py-3 flex items-center gap-3">
        <span className="text-indigo-400 text-lg">📅</span>
        <span className="text-sm font-semibold text-indigo-300">Current Season {season}</span>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">League Table</h1>
          <p className="text-slate-400 mt-1">EFL League Two &middot; Current Season {season} &middot; {table.length} teams &middot; Click columns to sort</p>
        </div>

        {/* Quick Sort Presets */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          <button
            onClick={() => { setSortField('position'); setSortDirection('asc'); }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              sortField === 'position'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Standings
          </button>
          <button
            onClick={() => { setSortField('goalsFor'); setSortDirection('desc'); }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              sortField === 'goalsFor'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Top Scoring
          </button>
          <button
            onClick={() => { setSortField('goalsAgainst'); setSortDirection('asc'); }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              sortField === 'goalsAgainst'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Best Defense
          </button>
        </div>
      </div>

      {/* League Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {([
                  ['position', 'Pos', 'text-left'],
                  ['team', 'Team', 'text-left'],
                  ['played', 'P', 'text-center'],
                  ['won', 'W', 'text-center'],
                  ['drawn', 'D', 'text-center'],
                  ['lost', 'L', 'text-center'],
                  ['goalsFor', 'GF', 'text-center'],
                  ['goalsAgainst', 'GA', 'text-center'],
                  ['goalDifference', 'GD', 'text-center'],
                  ['points', 'Pts', 'text-center'],
                ] as [SortField, string, string][]).map(([field, label, align]) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`${align} py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-400 transition-colors select-none`}
                  >
                    {label}{sortIndicator(field)}
                  </th>
                ))}
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Form</th>
              </tr>
            </thead>
            <tbody>
              {sortedTable.map((entry, idx) => {
                const isPromotion = entry.position <= 3;
                const isPlayoff = entry.position >= 4 && entry.position <= 7;
                const isRelegation = entry.position >= 22;

                return (
                  <tr
                    key={entry.team}
                    className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 ${
                      idx % 2 === 0 ? '' : 'bg-slate-800/10'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1 h-6 rounded-full ${
                            isPromotion
                              ? 'bg-emerald-500'
                              : isPlayoff
                              ? 'bg-blue-500'
                              : isRelegation
                              ? 'bg-red-500'
                              : 'bg-transparent'
                          }`}
                        />
                        <span className="font-medium text-slate-300">{entry.position}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{entry.team}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{entry.played}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{entry.won}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{entry.drawn}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{entry.lost}</td>
                    <td className="py-3 px-4 text-center text-emerald-400">{entry.goalsFor}</td>
                    <td className="py-3 px-4 text-center text-red-400">{entry.goalsAgainst}</td>
                    <td className={`py-3 px-4 text-center font-medium ${entry.goalDifference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white">{entry.points}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {(entry.form ?? []).map((result, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              result === 'W'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : result === 'D'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-red-500/20 text-red-400 border border-red-500/40'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-slate-700/50 flex flex-wrap gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Promotion</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Playoffs</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Relegation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
