import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import PlayerCard from '../components/PlayerCard';
import PlayerSearch from '../components/PlayerSearch';
import { fetchApiPlayersWithDebug } from '../api/client';
import { useCurrentSeason } from '../hooks/useCurrentSeason';
import type { Player, PlayerFilters, DebugInfo } from '../types';

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
  const [selectedLeague, setSelectedLeague] = useState('EFL-League-Two');
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
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
      console.log(`➡️ Fetching players (debugMode: ${debugMode})...`);

      const { data, debug } = await fetchApiPlayersWithDebug(
        debugMode ? undefined : { league: selectedLeague, season },
        debugMode,
      );

      if (cancelled) return;

      setDebugInfo(debug);

      if (debug.error) {
        setPlayers([]);
        setError(`Backend error: ${debug.error}`);
      } else if (data.players.length === 0) {
        setPlayers([]);
        setError(null); // Not an error — backend returned an empty array honestly
      } else {
        console.log(`📊 Players received: ${data.players.length}`);
        setPlayers(data.players);
      }

      setLoading(false);
    }
    loadPlayers();
    return () => { cancelled = true; };
  }, [selectedLeague, season, debugMode]);

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
      {/* Debug Panel */}
      <div data-testid="debug-panel" className="mb-6 rounded-xl bg-slate-900 border border-yellow-500/40 px-5 py-4 font-mono text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-yellow-400 font-bold text-sm">🔍 Debug Panel</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-400">{debugMode ? 'Debug mode ON (/api/debug/players)' : 'Normal mode (/api/players)'}</span>
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="accent-yellow-500"
              aria-label="Toggle debug endpoint"
            />
          </label>
        </div>
        {debugInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-300">
            <div><span className="text-slate-500">URL:</span> {debugInfo.url}</div>
            <div><span className="text-slate-500">Status:</span> {debugInfo.status ?? 'N/A'} {debugInfo.statusText}</div>
            <div><span className="text-slate-500">Fetch time:</span> {debugInfo.fetchTime}</div>
            <div>
              <span className="text-slate-500">Players returned by backend:</span>{' '}
              <span className={debugInfo.playerCount === 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {debugInfo.playerCount}
              </span>
            </div>
            {debugInfo.rawBodyLength !== undefined && (
              <div>
                <span className="text-slate-500">Raw response body length:</span>{' '}
                <span className="text-amber-300">{debugInfo.rawBodyLength} chars</span>
              </div>
            )}
            {debugInfo.rawPlayerNames && debugInfo.rawPlayerNames.length > 0 && (
              <div>
                <span className="text-slate-500">First players:</span>{' '}
                <span className="text-cyan-300">{debugInfo.rawPlayerNames.join(', ')}</span>
              </div>
            )}
            {debugInfo.error && (
              <div className="col-span-full text-red-400"><span className="text-slate-500">Error:</span> {debugInfo.error}</div>
            )}
            {debugInfo.rawBodyPreview !== undefined && (
              <div className="col-span-full mt-2">
                <span className="text-slate-500">Raw response body (first 500 chars):</span>
                <pre
                  data-testid="raw-body-preview"
                  className="mt-1 p-3 rounded-lg bg-slate-950 border border-slate-700 text-green-300 text-xs whitespace-pre-wrap break-all max-h-60 overflow-auto"
                >{debugInfo.rawJsonObject != null
                  ? JSON.stringify(debugInfo.rawJsonObject, null, 2)
                  : debugInfo.rawBodyPreview}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Season Banner — hidden in debug mode */}
      {!debugMode && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 px-5 py-3 flex items-center gap-3">
          <span className="text-indigo-400 text-lg">📅</span>
          <span className="text-sm font-semibold text-indigo-300">Current Season {season}</span>
          <span className="text-slate-500 text-sm ml-2">• All stats from current season only</span>
        </div>
      )}

      {/* League Selector — hidden in debug mode */}
      {!debugMode && (
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
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-3 flex items-center gap-3">
          <span className="text-red-400 text-lg">⚠️</span>
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Season Highlights Summary — only when players exist and NOT in debug mode */}
      {!debugMode && players.length > 0 && (
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

      {debugMode ? (
        /* Debug mode: show raw rows with no filters, search, or derived logic */
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Debug Mode — Raw Player Rows</h1>
            <p className="text-slate-400 mt-1">
              Showing {players.length} unfiltered rows from /api/debug/players
            </p>
          </div>
          {players.length === 0 ? (
            <div className="text-center py-12 text-slate-400 glass rounded-xl">
              No rows returned from /api/debug/players. The backend database may be empty or unseeded.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
              <div className="mt-4 text-center text-sm text-slate-500">
                Showing {players.length} raw rows (debug)
              </div>
            </>
          )}
        </>
      ) : (
        /* Normal mode: filters, search, and derived calculations */
        <>
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
              <div className="mt-4 text-center text-sm text-slate-500">
                Showing {filteredPlayers.length} players
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
