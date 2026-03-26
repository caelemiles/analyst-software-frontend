import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import PlayerCard from '../components/PlayerCard';
import PlayerSearch from '../components/PlayerSearch';
import { fetchPlayers, fetchPlayersPaginated } from '../api/client';
import { mockPlayers } from '../api/mockData';
import type { Player, PlayerFilters } from '../types';

const PLAYERS_PER_PAGE = 10;

export default function Dashboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [filters, setFilters] = useState<PlayerFilters>({
    search: '',
    team: '',
    position: '',
    minAge: '',
    maxAge: '',
  });

  useEffect(() => {
    async function loadPlayers() {
      try {
        // Try paginated API first
        const data = await fetchPlayersPaginated('EFL-League-Two', currentPage, PLAYERS_PER_PAGE);
        setPlayers(data.players);
        setTotalPlayers(data.total);
      } catch {
        try {
          // Fall back to unpaginated API
          const data = await fetchPlayers();
          setPlayers(data);
          setTotalPlayers(data.length);
        } catch {
          // Fall back to mock data
          setPlayers(mockPlayers);
          setTotalPlayers(mockPlayers.length);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, [currentPage]);

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
      return true;
    });
  }, [players, filters]);

  const totalPages = Math.max(1, Math.ceil(
    totalPlayers > players.length ? totalPlayers / PLAYERS_PER_PAGE : filteredPlayers.length / PLAYERS_PER_PAGE
  ));

  const paginatedPlayers = useMemo(() => {
    // If using server pagination (totalPlayers > current page), show all filtered
    if (totalPlayers > players.length) return filteredPlayers;
    const start = (currentPage - 1) * PLAYERS_PER_PAGE;
    return filteredPlayers.slice(start, start + PLAYERS_PER_PAGE);
  }, [filteredPlayers, currentPage, totalPlayers, players.length]);

  const handleFilterChange = (newFilters: PlayerFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-slate-400">Loading players...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Season Banner */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 px-5 py-3 flex items-center gap-3">
        <span className="text-indigo-400 text-lg">📅</span>
        <span className="text-sm font-semibold text-indigo-300">Season: Current (2025/26)</span>
        <span className="text-slate-500 text-sm ml-2">• All stats from current season only</span>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">EFL League Two Players</h1>
          <p className="text-slate-400 mt-1">
            Current Season 2025/26 &middot; Browse and scout {totalPlayers || players.length} players across League Two
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
          No players match your filters. Try adjusting your search criteria.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium rounded-lg glass text-slate-300 hover:text-white hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>
              <span className="text-sm text-slate-400">
                Page {currentPage} of {totalPages} ({totalPlayers || filteredPlayers.length} players)
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg glass text-slate-300 hover:text-white hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
