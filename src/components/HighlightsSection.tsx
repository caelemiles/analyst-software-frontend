import { useState, useMemo } from 'react';
import type { Highlight } from '../types';

interface HighlightsSectionProps {
  highlights: Highlight[];
}

type EventFilter = 'goals_assists' | 'all';

const HIGHLIGHTS_PER_PAGE = 4;

const eventTypeConfig: Record<string, { label: string; icon: string; className: string }> = {
  goal: { label: 'Goal', icon: '⚽', className: 'bg-green-100 text-green-800' },
  assist: { label: 'Assist', icon: '🅰️', className: 'bg-blue-100 text-blue-800' },
  save: { label: 'Key Save', icon: '🧤', className: 'bg-yellow-100 text-yellow-800' },
  tackle: { label: 'Tackle', icon: '🛡️', className: 'bg-orange-100 text-orange-800' },
  other: { label: 'Highlight', icon: '🎯', className: 'bg-gray-100 text-gray-800' },
};

export default function HighlightsSection({ highlights }: HighlightsSectionProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<EventFilter>('goals_assists');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredHighlights = useMemo(() => {
    if (eventFilter === 'goals_assists') {
      return highlights.filter(
        (h) => h.event_type === 'goal' || h.event_type === 'assist'
      );
    }
    return highlights;
  }, [highlights, eventFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHighlights.length / HIGHLIGHTS_PER_PAGE));

  const paginatedHighlights = useMemo(() => {
    const start = (currentPage - 1) * HIGHLIGHTS_PER_PAGE;
    return filteredHighlights.slice(start, start + HIGHLIGHTS_PER_PAGE);
  }, [filteredHighlights, currentPage]);

  if (highlights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No highlights available for this player.
      </div>
    );
  }

  const handleFilterChange = (filter: EventFilter) => {
    setEventFilter(filter);
    setCurrentPage(1);
    setActiveVideo(null);
  };

  const exportCSV = () => {
    const headers = ['Title', 'Date', 'Event Type', 'Minute', 'URL'];
    const rows = filteredHighlights.map((h) => [
      h.title,
      h.date,
      h.event_type ?? '',
      h.minute ?? '',
      h.url,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'highlights.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Season 2025/26 Highlights</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden border border-gray-300">
            <button
              onClick={() => handleFilterChange('goals_assists')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                eventFilter === 'goals_assists'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⚽ Goals & Assists
            </button>
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                eventFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Events
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Event type badges row */}
      <div className="flex flex-wrap gap-2">
        {filteredHighlights.map((highlight) => {
          const config = eventTypeConfig[highlight.event_type ?? 'other'];
          return (
            <button
              key={highlight.id}
              onClick={() => setActiveVideo(activeVideo === highlight.id ? null : highlight.id)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:shadow-md ${config.className} ${activeVideo === highlight.id ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
              {highlight.minute != null && (
                <span className="font-bold">{highlight.minute}'</span>
              )}
            </button>
          );
        })}
      </div>

      {filteredHighlights.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No matching highlights found. Try selecting &quot;All Events&quot;.
        </div>
      ) : (
        <>
          {/* Video cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedHighlights.map((highlight) => {
              const config = eventTypeConfig[highlight.event_type ?? 'other'];
              return (
                <div key={highlight.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {activeVideo === highlight.id ? (
                    <div className="aspect-video">
                      <iframe
                        src={highlight.url}
                        title={highlight.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-scripts allow-presentation"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveVideo(highlight.id)}
                      className="w-full aspect-video bg-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                      <div className="text-center">
                        <span className="text-5xl">▶️</span>
                        <p className="text-white mt-2 text-sm">Click to play</p>
                      </div>
                    </button>
                  )}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{highlight.title}</h4>
                      <p className="text-sm text-gray-500">{highlight.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {highlight.minute != null && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {highlight.minute}'
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
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
