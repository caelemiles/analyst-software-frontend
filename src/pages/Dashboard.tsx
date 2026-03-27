import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import PlayerCard from '../components/PlayerCard';
import PlayerSearch from '../components/PlayerSearch';
import { fetchPlayers, fetchPlayersPaginated, fetchLeaguePlayers, fetchPlayersByLeagueAndSeason, fetchApiPlayers } from '../api/client';
import { mockPlayers } from '../api/mockData';
import { useCurrentSeason } from '../hooks/useCurrentSeason';
import type { Player, PlayerFilters } from '../types';

const LEAGUES = [
  { id: 'EFL-League-Two', label: 'EFL League Two' },
  { id: 'EFL-League-One', label: 'EFL League One' },
  { id: 'EFL-Championship', label: 'EFL Championship' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { season } = useCurrentSeason();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastLoadedPage, setLastLoadedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('EFL-League-Two');
  const playersPerPage = 20;
  const [filters, setFilters] = useState<PlayerFilters>({
    search: '',
    team: '',
    position: '',
    minAge: '',
    maxAge: '',
    minGoals: '',
    minXG: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function loadPlayers() {
      setLoading(true);
      setError(null);
      setLastLoadedPage(1);
      try {
        const response = await fetchApiPlayers({ league: selectedLeague, season });
        if (!cancelled) {
          setPlayers(response.players);
          setHasMore(false);
          if (!response.liveData) {
            setError('Unable to fetch live player data. Showing cached results.');
          }
        }
      } catch {
        try {
          const data = await fetchPlayersByLeagueAndSeason(selectedLeague, season);
          if (!cancelled) {
            setPlayers(data);
            setHasMore(false);
          }
        } catch {
          try {
            const data = await fetchPlayersPaginated(selectedLeague, 1, playersPerPage, season);
            if (!cancelled) {
              setPlayers(data.players);
              setHasMore(data.page < data.totalPages);
            }
          } catch {
            console.error("Paginated player data fetch failed");
            try {
              const data = await fetchLeaguePlayers(selectedLeague);
              if (!cancelled) {
                setPlayers(data);
                setHasMore(false);
              }
            } catch {
              console.error("League player data fetch failed");
              try {
                const data = await fetchPlayers();
                if (!cancelled) {
                  setPlayers(data);
                  setHasMore(false);
                }
              } catch {
                console.error("All player data fetches failed");
                if (!cancelled) {
                  setPlayers(mockPlayers);
                  setHasMore(false);
                  setError('Unable to fetch live player data. Showing cached results.');
                }
              }
            }
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadPlayers();
    return () => { cancelled = true; };
  }, [selectedLeague, season]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = lastLoadedPage + 1;
      const data = await fetchPlayersPaginated(selectedLeague, nextPage, playersPerPage, season);
      setPlayers((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPlayers = data.players.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newPlayers];
      });
      setLastLoadedPage(nextPage);
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      console.error("Player data fetch failed", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const teams = useMemo(
    () => [...new Set(players.map((p) => p.team))].sort(),
    [players]
  );
  const positions = useMemo(
    () => [...new Set(players.map((p) => p.position))].sort(),
    [players]
  );

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (
        filters.search &&
        !player.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !player.team.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.team && player.team !== filters.team) return false;
      if (filters.position && player.position !== filters.position) return false;
      if (filters.minAge !== '' && player.age < filters.minAge) return false;
      if (filters.maxAge !== '' && player.age > filters.maxAge) return false;
      if (filters.minGoals !== '' && player.stats.goals < filters.minGoals) return false;
      if (filters.minXG !== '' && player.stats.xG < filters.minXG) return false;
      return true;
    });
  }, [players, filters]);

  // Compute season highlights summary
  const seasonHighlights = useMemo(() => {
    let totalGoals = 0;
    let totalAssists = 0;
    let topScorer: Player | undefined;
    let topAssister: Player | undefined;
    for (const p of players) {
      totalGoals += p.stats.goals;
      totalAssists += p.stats.assists;
      if (!topScorer || p.stats.goals > topScorer.stats.goals) topScorer = p;
      if (!topAssister || p.stats.assists > topAssister.stats.assists) topAssister = p;
    }
    return { totalGoals, totalAssists, topScorer, topAssister };
  }, [players]);

  const handleFilterChange = (newFilters: PlayerFilters) => {
    setFilters(newFilters);
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
        <span className="text-slate-500 text-sm ml-2">• All stats from current season only</span>
      </div>

      {/* League Selector */}
      <div className="mb-6 flex items-center gap-2">
        <label htmlFor="league-select" className="text-sm text-slate-400">League:</label>
        <select
          id="league-select"
          aria-label="League"
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="px-3 py-1.5 rounded-lg glass text-sm text-white bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors"
        >
          {LEAGUES.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-3 flex items-center gap-3">
          <span className="text-red-400 text-lg">⚠️</span>
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Season Highlights Summary */}
      {players.length > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{seasonHighlights.totalGoals}</p>
            <p className="text-xs text-slate-500 mt-1">Total Goals</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{seasonHighlights.totalAssists}</p>
            <p className="text-xs text-slate-500 mt-1">Total Assists</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            {seasonHighlights.topScorer && (
              <>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold">
                    {seasonHighlights.topScorer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <p className="text-sm font-bold text-white">{seasonHighlights.topScorer.name}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">⚽ Top Scorer ({seasonHighlights.topScorer.stats.goals} goals)</p>
              </>
            )}
          </div>
          <div className="glass rounded-xl p-4 text-center">
            {seasonHighlights.topAssister && (
              <>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold">
                    {seasonHighlights.topAssister.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <p className="text-sm font-bold text-white">{seasonHighlights.topAssister.name}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">🎯 Top Assists ({seasonHighlights.topAssister.stats.assists} assists)</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{LEAGUES.find(l => l.id === selectedLeague)?.label ?? selectedLeague} Players</h1>
          <p className="text-slate-400 mt-1">
            Current Season {season} &middot; Browse and scout {players.length} players across {LEAGUES.find(l => l.id === selectedLeague)?.label ?? selectedLeague}
          </p>
        </div>
        <PlayerSearch
          players={players}
          onSelect={(player) => navigate(`/player/${player.id}`)}
        />
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        teams={teams}
        positions={positions}
      />

      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 text-slate-400 glass rounded-xl">
          {players.length === 0
            ? 'No player data available. The server may be unavailable or returned no data for this league.'
            : 'No players match your filters. Try adjusting your search criteria.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-lg text-sm font-medium gradient-accent text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading more players...
                  </span>
                ) : (
                  'Load More Players'
                )}
              </button>
            </div>
          )}
          <div className="mt-4 text-center text-sm text-slate-500">
            Showing {filteredPlayers.length} players
          </div>
        </>
      )}
    </div>
  );
}
