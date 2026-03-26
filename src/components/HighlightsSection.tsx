import { useState, useMemo, useRef } from 'react';
import type { Highlight } from '../types';

interface HighlightsSectionProps {
  highlights: Highlight[];
}

type EventFilter = 'goals_assists' | 'all';

const eventTypeConfig: Record<string, { label: string; icon: string; className: string }> = {
  goal: { label: 'Goal', icon: '⚽', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  assist: { label: 'Assist', icon: '🎯', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  save: { label: 'Key Save', icon: '🧤', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  tackle: { label: 'Tackle', icon: '🛡️', className: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  other: { label: 'Highlight', icon: '🎯', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

function extractOpponent(title: string): string {
  const match = title.match(/vs\s+(.+?)(?:\s*\(|$)/i);
  return match ? match[1].trim() : 'Unknown';
}

interface MatchGroup {
  opponent: string;
  date: string;
  highlights: Highlight[];
}

export default function HighlightsSection({ highlights }: HighlightsSectionProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<EventFilter>('goals_assists');
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filteredHighlights = useMemo(() => {
    if (eventFilter === 'goals_assists') {
      return highlights.filter(
        (h) => h.event_type === 'goal' || h.event_type === 'assist'
      );
    }
    return highlights;
  }, [highlights, eventFilter]);

  // Group highlights by match (opponent + date)
  const matchGroups = useMemo(() => {
    const groups = new Map<string, MatchGroup>();
    for (const h of filteredHighlights) {
      const opponent = extractOpponent(h.title);
      const key = `${opponent}-${h.date}`;
      if (!groups.has(key)) {
        groups.set(key, { opponent, date: h.date, highlights: [] });
      }
      groups.get(key)!.highlights.push(h);
    }
    // Sort groups by date descending
    return [...groups.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredHighlights]);

  if (highlights.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center text-slate-400">
        No highlights available for this player.
      </div>
    );
  }

  const handleFilterChange = (filter: EventFilter) => {
    setEventFilter(filter);
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

  const scroll = (key: string, direction: 'left' | 'right') => {
    const el = scrollRefs.current[key];
    if (el) {
      el.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">Season 2025/26 Highlights</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              onClick={() => handleFilterChange('goals_assists')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                eventFilter === 'goals_assists'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ⚽ Goals & Assists
            </button>
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                eventFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Events
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {filteredHighlights.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center text-slate-400">
          No matching highlights found. Try selecting &quot;All Events&quot;.
        </div>
      ) : (
        <div className="space-y-4">
          {matchGroups.map((group) => {
            const groupKey = `${group.opponent}-${group.date}`;
            return (
              <div key={groupKey} className="glass rounded-xl overflow-hidden">
                {/* Match header */}
                <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏟️</span>
                    <h4 className="font-semibold text-white">Match vs {group.opponent}</h4>
                  </div>
                  <span className="text-xs text-slate-500">{group.date}</span>
                </div>

                {/* Scrollable highlights carousel */}
                <div className="relative">
                  {group.highlights.length > 2 && (
                    <>
                      <button
                        onClick={() => scroll(groupKey, 'left')}
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => scroll(groupKey, 'right')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
                      >
                        ›
                      </button>
                    </>
                  )}

                  <div
                    ref={(el) => { scrollRefs.current[groupKey] = el; }}
                    className="flex gap-3 p-4 overflow-x-auto scrollbar-hide"
                  >
                    {group.highlights.map((highlight) => {
                      const config = eventTypeConfig[highlight.event_type ?? 'other'];
                      return (
                        <div key={highlight.id} className="min-w-[260px] max-w-[300px] flex-shrink-0">
                          {activeVideo === highlight.id ? (
                            <div className="aspect-video rounded-lg overflow-hidden">
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
                              className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700/50"
                            >
                              <div className="text-center">
                                <span className="text-4xl">▶️</span>
                                <p className="text-slate-400 mt-1 text-xs">Click to play</p>
                              </div>
                            </button>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
                                {config.icon} {config.label}
                              </span>
                              {highlight.minute != null && (
                                <span className="text-xs font-bold text-slate-400">{highlight.minute}&apos;</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
