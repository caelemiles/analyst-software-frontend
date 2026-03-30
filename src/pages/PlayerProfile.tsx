import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatsTable from '../components/StatsTable';
import Per90MetricsTable from '../components/Per90MetricsTable';
import HighlightsSection from '../components/HighlightsSection';
import AIInsightsCard from '../components/AIInsightsCard';
import DefensiveRadar from '../components/DefensiveRadar';
import OffensiveRadar from '../components/OffensiveRadar';
import PerformanceTrends from '../components/PerformanceTrends';
import ShotHeatmap from '../components/ShotHeatmap';
import { fetchPlayer } from '../api/client';
import type { Player } from '../types';

type Tab = 'overview' | 'stats' | 'per90' | 'radar' | 'heatmap' | 'trends' | 'highlights' | 'ai';

function OverviewStatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-indigo-400">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    async function loadPlayer() {
      if (!id) return;
      try {
        const data = await fetchPlayer(parseInt(id));
        setPlayer(data);
      } catch (err) {
        console.error("Player data fetch failed", err);
        setError('Player not found. The backend may be unavailable.');
      } finally {
        setLoading(false);
      }
    }
    loadPlayer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-slate-400">Loading player profile...</div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error || 'Player not found'}</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const initials = player.name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
      activeTab === tab
        ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
    }`;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'stats', label: 'Stats', icon: '⚽' },
    { key: 'per90', label: 'Per-90 Metrics', icon: '📐' },
    { key: 'radar', label: 'Radar', icon: '🎯' },
    { key: 'heatmap', label: 'Heatmap', icon: '🗺️' },
    { key: 'trends', label: 'Trend Graphs', icon: '📈' },
    { key: 'highlights', label: 'Highlights', icon: '🎬' },
    { key: 'ai', label: 'AI Insights', icon: '✨' },
  ];

  return (
    <div>
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {player.image_url ? (
              <img
                src={player.image_url}
                alt={player.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{player.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {player.position}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                  {player.team}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50">
                  Age: {player.age}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50">
                  {player.nationality}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-1 text-lg font-semibold text-amber-400">
            <span>⭐</span>
            <span>{player.stats.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700/50 mb-6">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={tabClass(tab.key)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <OverviewStatBox label="Appearances" value={player.stats.appearances} />
            <OverviewStatBox label="Minutes" value={player.stats.minutes_played.toLocaleString()} />
            <OverviewStatBox label="Goals" value={player.stats.goals} />
            <OverviewStatBox label="Assists" value={player.stats.assists} />
            <OverviewStatBox label="Rating" value={player.stats.rating.toFixed(1)} />
            <OverviewStatBox label="xG" value={player.stats.xG.toFixed(1)} />
            <OverviewStatBox label="xA" value={player.stats.xA.toFixed(1)} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <OverviewStatBox label="Pass Accuracy" value={`${player.stats.pass_accuracy}%`} />
            <OverviewStatBox label="Passes" value={player.stats.passes_completed.toLocaleString()} />
            <OverviewStatBox label="Tackles" value={player.stats.tackles} />
            <OverviewStatBox label="Interceptions" value={player.stats.interceptions} />
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <StatsTable matchLogs={player.match_logs || []} />
      )}

      {/* Per-90 Metrics Tab */}
      {activeTab === 'per90' && (
        <Per90MetricsTable stats={player.stats} />
      )}

      {/* Radar Tab */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OffensiveRadar stats={player.stats} />
          <DefensiveRadar stats={player.stats} />
        </div>
      )}

      {/* Heatmap Tab */}
      {activeTab === 'heatmap' && (
        <ShotHeatmap stats={player.stats} position={player.position} />
      )}

      {/* Trend Graphs Tab */}
      {activeTab === 'trends' && (
        <PerformanceTrends matchLogs={player.match_logs || []} />
      )}

      {/* Highlights Tab */}
      {activeTab === 'highlights' && (
        <HighlightsSection highlights={player.highlights || []} />
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai' && (
        <AIInsightsCard
          aiSummary={player.ai_summary || ''}
          playerName={player.name}
          matchLogs={player.match_logs}
        />
      )}
    </div>
  );
}
