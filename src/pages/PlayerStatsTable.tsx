import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchPlayers, fetchApiPlayers } from '../api/client';
import { useCurrentSeason } from '../hooks/useCurrentSeason';
import type { Player } from '../types';

type SortField = 'name' | 'team' | 'position' | 'appearances' | 'goals' | 'assists' | 'minutes_played' | 'xG' | 'xA' | 'rating';
type SortDirection = 'asc' | 'desc';

export default function PlayerStatsTable() {
  const { season } = useCurrentSeason();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('goals');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    async function loadPlayers() {
      setError(null);
      try {
        console.log("➡️ Fetching players...");
        const response = await fetchApiPlayers({ league: 'EFL-League-Two', season });
        if (!response.players || response.players.length === 0) {
          throw new Error("No live players received");
        }
        console.log("📊 Players received:", response.players.length);
        setPlayers(response.players);
      } catch (err) {
        console.error("❌ FRONTEND ERROR:", err);
        try {
          const data = await fetchPlayers();
          if (!data || data.length === 0) {
            throw new Error("No live players received");
          }
          console.log("📊 Players received:", data.length);
          setPlayers(data);
        } catch (fallbackErr) {
          console.error("❌ FRONTEND ERROR:", fallbackErr);
          setPlayers([]);
          setError('Failed to fetch live player data. Please check the backend connection.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, [season]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' || field === 'team' || field === 'position' ? 'asc' : 'desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = players;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || p.position.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name': aVal = a.name; bVal = b.name; break;
        case 'team': aVal = a.team; bVal = b.team; break;
        case 'position': aVal = a.position; bVal = b.position; break;
        case 'appearances': aVal = a.stats.appearances; bVal = b.stats.appearances; break;
        case 'goals': aVal = a.stats.goals; bVal = b.stats.goals; break;
        case 'assists': aVal = a.stats.assists; bVal = b.stats.assists; break;
        case 'minutes_played': aVal = a.stats.minutes_played; bVal = b.stats.minutes_played; break;
        case 'xG': aVal = a.stats.xG; bVal = b.stats.xG; break;
        case 'xA': aVal = a.stats.xA; bVal = b.stats.xA; break;
        case 'rating': aVal = a.stats.rating; bVal = b.stats.rating; break;
        default: aVal = 0; bVal = 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [players, search, sortField, sortDirection]);

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-slate-400">Fetching live data…</div>
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

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-3 flex items-center gap-3">
          <span className="text-red-400 text-lg">⚠️</span>
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Player Stats Table</h1>
          <p className="text-slate-400 mt-1">
            Current Season {season} &middot; {filteredAndSorted.length} of {players.length} players &middot; Click columns to sort
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players, teams..."
            className="w-full sm:w-64 px-4 py-2 rounded-lg glass text-sm text-white placeholder-slate-500 border border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors"
            aria-label="Search players"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {([
                  ['name', 'Player', 'text-left'],
                  ['team', 'Team', 'text-left'],
                  ['position', 'Pos', 'text-center'],
                  ['appearances', 'Apps', 'text-center'],
                  ['goals', 'Goals', 'text-center'],
                  ['assists', 'Assists', 'text-center'],
                  ['minutes_played', 'Mins', 'text-center'],
                  ['xG', 'xG', 'text-center'],
                  ['xA', 'xA', 'text-center'],
                  ['rating', 'Rating', 'text-center'],
                ] as [SortField, string, string][]).map(([field, label, align]) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`${align} py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-400 transition-colors select-none`}
                  >
                    {label}{sortIndicator(field)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No players match your search.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((player, idx) => (
                  <tr
                    key={player.id}
                    className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 ${
                      idx % 2 === 0 ? '' : 'bg-slate-800/10'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <Link to={`/player/${player.id}`} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                        {player.image_url ? (
                          <img src={player.image_url} alt={player.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full gradient-accent flex items-center justify-center text-white text-[10px] font-bold">
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <span className="font-medium text-white">{player.name}</span>
                        {player.source === 'scraper' && (
                          <span title="Scraper-sourced data" className="text-amber-400 text-xs">⚡</span>
                        )}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{player.team}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">
                        {player.position}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">{player.stats.appearances}</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-400">{player.stats.goals}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-400">{player.stats.assists}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{player.stats.minutes_played.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center text-slate-300">{player.stats.xG.toFixed(1)}</td>
                    <td className="py-3 px-4 text-center text-slate-300">{player.stats.xA.toFixed(1)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${player.stats.rating >= 7.0 ? 'text-emerald-400' : player.stats.rating >= 6.5 ? 'text-amber-400' : 'text-red-400'}`}>
                        {player.stats.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
