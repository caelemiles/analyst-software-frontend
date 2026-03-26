import { Link } from 'react-router-dom';
import type { Player } from '../types';

interface PlayerCardProps {
  player: Player;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Link
      to={`/player/${player.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
          <p className="text-sm text-gray-500">{player.team}</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {player.position}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{player.stats.goals}</p>
          <p className="text-xs text-gray-500">Goals</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{player.stats.assists}</p>
          <p className="text-xs text-gray-500">Assists</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{player.stats.appearances}</p>
          <p className="text-xs text-gray-500">Apps</p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-700">{player.stats.minutes_played.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Minutes</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-700">{player.stats.xG.toFixed(1)}</p>
          <p className="text-xs text-gray-500">xG</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-700">{player.stats.xA.toFixed(1)}</p>
          <p className="text-xs text-gray-500">xA</p>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-xs text-gray-400">
        <span>Age: {player.age}</span>
        <span>{player.nationality}</span>
      </div>
    </Link>
  );
}
