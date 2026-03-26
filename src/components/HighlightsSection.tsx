import type { Highlight } from '../types';

interface HighlightsSectionProps {
  highlights: Highlight[];
}

export default function HighlightsSection({ highlights }: HighlightsSectionProps) {
  if (highlights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No highlights available for this player.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {highlights.map((highlight) => (
        <div key={highlight.id} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="aspect-video">
            <iframe
              src={highlight.url}
              title={highlight.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>
          <div className="p-4">
            <h4 className="font-medium text-gray-900">{highlight.title}</h4>
            <p className="text-sm text-gray-500">{highlight.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
