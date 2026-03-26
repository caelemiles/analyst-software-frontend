import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatsCharts from '../components/StatsCharts';
import HighlightsSection from '../components/HighlightsSection';
import NotesSection from '../components/NotesSection';
import AIInsightsCard from '../components/AIInsightsCard';
import DefensiveRadar from '../components/DefensiveRadar';
import DisciplinePanel from '../components/DisciplinePanel';
import PerformanceTrends from '../components/PerformanceTrends';
import ShotHeatmap from '../components/ShotHeatmap';
import { fetchPlayer } from '../api/client';
import { mockPlayers } from '../api/mockData';
import { getPlayerPer90Stats } from '../utils/per90';
import type { Player } from '../types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type Tab = 'overview' | 'attacking' | 'defensive' | 'trends' | 'heatmap' | 'notes';

function OverviewStatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <p className="text-2xl font-bold text-indigo-600">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
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
      } catch {
        const mock = mockPlayers.find((p) => p.id === parseInt(id));
        if (mock) {
          setPlayer(mock);
        } else {
          setError('Player not found');
        }
      } finally {
        setLoading(false);
      }
    }
    loadPlayer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-500">Loading player profile...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{error || 'Player not found'}</p>
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const per90 = getPlayerPer90Stats(player.stats);

  const initials = player.name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      activeTab === tab
        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

  const attackingRadarData = [
    { metric: 'Goals p90', value: per90.goalsPer90 },
    { metric: 'Assists p90', value: per90.assistsPer90 },
    { metric: 'xG p90', value: per90.xGPer90 },
    { metric: 'xA p90', value: per90.xAPer90 },
    { metric: 'Key Passes p90', value: per90.keyPassesPer90 },
    { metric: 'Dribbles p90', value: per90.dribblesPer90 },
  ];

  return (
    <div>
      <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {player.image_url ? (
              <img
                src={player.image_url}
                alt={player.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-indigo-200">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{player.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  {player.position}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {player.team}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  Age: {player.age}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  {player.nationality}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-1 text-lg font-semibold text-yellow-500">
            <span>⭐</span>
            <span>{player.stats.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-1">
          <button className={tabClass('overview')} onClick={() => setActiveTab('overview')}>
            📊 Overview
          </button>
          <button className={tabClass('attacking')} onClick={() => setActiveTab('attacking')}>
            ⚽ Attacking
          </button>
          <button className={tabClass('defensive')} onClick={() => setActiveTab('defensive')}>
            🛡️ Defensive
          </button>
          <button className={tabClass('trends')} onClick={() => setActiveTab('trends')}>
            📈 Trends
          </button>
          <button className={tabClass('heatmap')} onClick={() => setActiveTab('heatmap')}>
            🎯 Heatmap
          </button>
          <button className={tabClass('notes')} onClick={() => setActiveTab('notes')}>
            📝 Notes
          </button>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsightsCard aiSummary={player.ai_summary || ''} playerName={player.name} />
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Per 90 Minutes</h3>
              <div className="grid grid-cols-2 gap-4">
                <OverviewStatBox label="Goals p90" value={per90.goalsPer90} />
                <OverviewStatBox label="Assists p90" value={per90.assistsPer90} />
                <OverviewStatBox label="xG p90" value={per90.xGPer90} />
                <OverviewStatBox label="xA p90" value={per90.xAPer90} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attacking Tab */}
      {activeTab === 'attacking' && (
        <div className="space-y-6">
          <StatsCharts stats={player.stats} position={player.position} />
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Per 90 Attacking Radar
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={attackingRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                <Tooltip />
                <Radar
                  name="Attacking p90"
                  dataKey="value"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Defensive Tab */}
      {activeTab === 'defensive' && (
        <div className="space-y-6">
          <DefensiveRadar stats={player.stats} />
          <DisciplinePanel stats={player.stats} position={player.position} />
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <PerformanceTrends matchLogs={player.match_logs || []} />
      )}

      {/* Heatmap Tab */}
      {activeTab === 'heatmap' && (
        <ShotHeatmap stats={player.stats} position={player.position} />
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <NotesSection
            playerId={player.id}
            notes={player.notes || ''}
            aiSummary={player.ai_summary || ''}
            onNotesUpdated={(notes) => setPlayer({ ...player, notes })}
          />
          <HighlightsSection highlights={player.highlights || []} />
        </div>
      )}
    </div>
  );
}
