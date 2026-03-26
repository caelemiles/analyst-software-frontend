import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatsCharts from '../components/StatsCharts';
import HighlightsSection from '../components/HighlightsSection';
import NotesSection from '../components/NotesSection';
import { fetchPlayer } from '../api/client';
import { mockPlayers } from '../api/mockData';
import type { Player } from '../types';

type Tab = 'stats' | 'highlights' | 'notes';

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('stats');

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

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      activeTab === tab
        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div>
      <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
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
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-2">
          <button className={tabClass('stats')} onClick={() => setActiveTab('stats')}>
            📊 Stats & Charts
          </button>
          <button className={tabClass('highlights')} onClick={() => setActiveTab('highlights')}>
            🎥 Highlights
          </button>
          <button className={tabClass('notes')} onClick={() => setActiveTab('notes')}>
            📝 Notes
          </button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <StatsCharts stats={player.stats} position={player.position} />
      )}

      {activeTab === 'highlights' && (
        <HighlightsSection highlights={player.highlights || []} />
      )}

      {activeTab === 'notes' && (
        <NotesSection
          playerId={player.id}
          notes={player.notes || ''}
          aiSummary={player.ai_summary || ''}
          onNotesUpdated={(notes) => setPlayer({ ...player, notes })}
        />
      )}
    </div>
  );
}
