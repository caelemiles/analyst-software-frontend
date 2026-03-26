import type { PlayerStats } from '../types';

interface DisciplinePanelProps {
  stats: PlayerStats;
  position: string;
}

function StatBox({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg shadow p-4 text-center ${className ?? 'bg-white'}`}>
      {icon && <span className="text-2xl">{icon}</span>}
      <p className="text-2xl font-bold text-indigo-600">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default function DisciplinePanel({ stats, position }: DisciplinePanelProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Discipline &amp; Cards</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatBox
            label="Yellow Cards"
            value={stats.yellow_cards}
            icon="⚠️"
            className="bg-yellow-100"
          />
          <StatBox
            label="Red Cards"
            value={stats.red_cards}
            icon="🟥"
            className="bg-red-100"
          />
          <StatBox label="Fouls Drawn" value={stats.fouls_drawn} />
          <StatBox label="Fouls Committed" value={stats.fouls_committed} />
          <StatBox label="Rating" value={stats.rating.toFixed(1)} icon="⭐" />
        </div>
      </div>

      {position === 'Goalkeeper' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Goalkeeping</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Saves" value={stats.saves ?? 0} />
            <StatBox label="Clean Sheets" value={stats.clean_sheets ?? 0} />
            <StatBox label="Goals Conceded" value={stats.goals_conceded ?? 0} />
            <StatBox label="Penalties Saved" value={stats.penalties_saved ?? 0} />
          </div>
        </div>
      )}
    </div>
  );
}
