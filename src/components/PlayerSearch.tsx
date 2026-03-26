import { useState, useRef, useEffect } from 'react';
import type { Player } from '../types';

interface PlayerSearchProps {
  players: Player[];
  onSelect: (player: Player) => void;
}

export default function PlayerSearch({ players, onSelect }: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? players
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function handleSelect(player: Player) {
    onSelect(player);
    setQuery('');
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md" onKeyDown={handleKeyDown}>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search players..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-80 overflow-y-auto">
          {filtered.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                onClick={() => handleSelect(player)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
              >
                <div>
                  <p className="font-medium text-gray-900">{player.name}</p>
                  <p className="text-xs text-gray-500">
                    {player.team} · {player.position}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.trim() !== '' && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg">
          No players found
        </div>
      )}
    </div>
  );
}
