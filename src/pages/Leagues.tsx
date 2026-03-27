import { useState, useEffect, useMemo } from 'react';
import { fetchLeagueTable } from '../api/client';
import { mockLeagueTable } from '../api/mockData';
import type { LeagueEntry } from '../types';

type SortFilter = 'default' | 'topScoring' | 'bestDefense';

export default function Leagues() {
  const [table, setTable] = useState<LeagueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortFilter, setSortFilter] = useState<SortFilter>('default');

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

  const sortedTable = useMemo(() => {
    const copy = [...table];
    if (sortFilter === 'topScoring') {
      copy.sort((a, b) => b.goalsFor - a.goalsFor);
    } else if (sortFilter === 'bestDefense') {
      copy.sort((a, b) => a.goalsAgainst - b.goalsAgainst);
    } else {
      copy.sort((a, b) => a.position - b.position);
    }
    return copy;
  }, [table, sortFilter]);

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
        <span className="text-sm font-semibold text-indigo-300">Current Season 2025/26</span>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">League Table</h1>
          <p className="text-slate-400 mt-1">EFL League Two &middot; Current Season 2025/26 &middot; {table.length} teams</p>
        </div>

        {/* Filters */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          <button
            onClick={() => setSortFilter('default')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              sortFilter === 'default'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Standings
          </button>
          <button
            onClick={() => setSortFilter('topScoring')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              sortFilter === 'topScoring'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Top Scoring
          </button>
          <button
            onClick={() => setSortFilter('bestDefense')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              sortFilter === 'bestDefense'
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
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pos</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Team</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">P</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">W</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">D</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">L</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">GF</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">GA</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">GD</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pts</th>
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
