import { useState, useEffect } from 'react';
import { fetchTeams } from '../api/client';
import { mockTeams } from '../api/mockData';
import type { Team } from '../types';

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);

  useEffect(() => {
    async function loadTeams() {
      try {
        const data = await fetchTeams();
        setTeams(data);
      } catch {
        setTeams(mockTeams);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-slate-400">Loading teams...</div>
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
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Teams</h1>
        <p className="text-slate-400 mt-1">EFL League Two &middot; {teams.length} teams</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teams.map((team) => (
          <div key={team.id}>
            <button
              onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
              className="w-full text-left glass rounded-xl p-5 card-hover cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm border border-indigo-500/30">
                    {team.position}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <p className="text-xs text-slate-500">{team.league}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/50 rounded-lg py-2">
                  <p className="text-lg font-bold text-white">{team.points}</p>
                  <p className="text-xs text-slate-500">Pts</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg py-2">
                  <p className="text-lg font-bold text-emerald-400">{team.goalsFor}</p>
                  <p className="text-xs text-slate-500">GF</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg py-2">
                  <p className="text-lg font-bold text-red-400">{team.goalsAgainst}</p>
                  <p className="text-xs text-slate-500">GA</p>
                </div>
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>W{team.won} D{team.drawn} L{team.lost}</span>
                <span className={team.goalDifference >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  GD: {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                </span>
              </div>
            </button>

            {/* Expanded team detail */}
            {expandedTeam === team.id && (
              <div className="mt-2 glass rounded-xl p-5 space-y-4">
                {/* Team Stats */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">Team Stats</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-indigo-400">{team.avgXG?.toFixed(2) ?? '—'}</p>
                      <p className="text-xs text-slate-500">Avg xG</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-purple-400">{team.avgPossession?.toFixed(1) ?? '—'}%</p>
                      <p className="text-xs text-slate-500">Possession</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">{team.played}</p>
                      <p className="text-xs text-slate-500">Played</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-amber-400">{team.won}</p>
                      <p className="text-xs text-slate-500">Wins</p>
                    </div>
                  </div>
                </div>

                {/* Squad */}
                {team.squad && team.squad.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Squad</h4>
                    <div className="space-y-1">
                      {team.squad.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                          <div>
                            <span className="text-sm text-white">{p.name}</span>
                            <span className="text-xs text-slate-500 ml-2">{p.position}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-slate-400">
                            <span>{p.appearances} apps</span>
                            <span className="text-emerald-400">{p.goals}G</span>
                            <span className="text-blue-400">{p.assists}A</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
