import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import PlayerCard from '../components/PlayerCard';
import PlayerSearch from '../components/PlayerSearch';
import { fetchPlayers } from '../api/client';
import { mockPlayers } from '../api/mockData';
import type { Player, PlayerFilters } from '../types';

const PLAYERS_PER_PAGE = 10;

export default function Dashboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
        const data = await fetchPlayers();
        setPlayers(data);
      } catch {
        setPlayers(mockPlayers);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE));

  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * PLAYERS_PER_PAGE;
    return filteredPlayers.slice(start, start + PLAYERS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const handleFilterChange = (newFilters: PlayerFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-500">Loading players...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">EFL League Two Players</h1>
          <p className="text-gray-500 mt-1">
            Current Season 2025/26 &middot; Browse and scout {players.length} players across League Two
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
        <div className="text-center py-12 text-gray-500">
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
                className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredPlayers.length} players)
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
