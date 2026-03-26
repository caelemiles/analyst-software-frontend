import type { PlayerStats } from '../types';

interface ShotHeatmapProps {
  stats: PlayerStats;
  position: string;
}

function getOpacity(value: number, max: number): number {
  if (max === 0) return 0.1;
  return Math.max(0.1, Math.min(value / max, 1));
}

function ZoneCircle({
  label,
  value,
  color,
  opacity,
  className,
}: {
  label: string;
  value: number;
  color: string;
  opacity: number;
  className: string;
}) {
  return (
    <div
      className={`absolute flex flex-col items-center justify-center rounded-full text-white text-xs font-bold ${className}`}
      style={{ backgroundColor: color, opacity }}
    >
      <span>{value}</span>
      <span className="text-[10px] font-normal">{label}</span>
    </div>
  );
}

function ForwardZones({ stats }: { stats: PlayerStats }) {
  const maxVal = Math.max(stats.goals, stats.xG, stats.dribbles, stats.key_passes, 1);
  return (
    <>
      <ZoneCircle
        label="Goals"
        value={stats.goals}
        color="#4f46e5"
        opacity={getOpacity(stats.goals, maxVal)}
        className="w-16 h-16 top-[15%] left-1/2 -translate-x-1/2"
      />
      <ZoneCircle
        label="xG"
        value={parseFloat(stats.xG.toFixed(1))}
        color="#6366f1"
        opacity={getOpacity(stats.xG, maxVal)}
        className="w-14 h-14 top-[35%] left-[30%]"
      />
      <ZoneCircle
        label="Dribbles"
        value={stats.dribbles}
        color="#10b981"
        opacity={getOpacity(stats.dribbles, maxVal)}
        className="w-14 h-14 top-[55%] left-[60%]"
      />
      <ZoneCircle
        label="Key Pass"
        value={stats.key_passes}
        color="#f59e0b"
        opacity={getOpacity(stats.key_passes, maxVal)}
        className="w-14 h-14 top-[65%] left-[25%]"
      />
    </>
  );
}

function DefenderZones({ stats }: { stats: PlayerStats }) {
  const maxVal = Math.max(stats.tackles, stats.interceptions, stats.clearances, stats.aerial_duels_won, 1);
  return (
    <>
      <ZoneCircle
        label="Tackles"
        value={stats.tackles}
        color="#dc2626"
        opacity={getOpacity(stats.tackles, maxVal)}
        className="w-16 h-16 top-[50%] left-1/2 -translate-x-1/2"
      />
      <ZoneCircle
        label="Intercept."
        value={stats.interceptions}
        color="#ea580c"
        opacity={getOpacity(stats.interceptions, maxVal)}
        className="w-14 h-14 top-[35%] left-[25%]"
      />
      <ZoneCircle
        label="Clearances"
        value={stats.clearances}
        color="#059669"
        opacity={getOpacity(stats.clearances, maxVal)}
        className="w-14 h-14 top-[20%] left-1/2 -translate-x-1/2"
      />
      <ZoneCircle
        label="Aerials"
        value={stats.aerial_duels_won}
        color="#7c3aed"
        opacity={getOpacity(stats.aerial_duels_won, maxVal)}
        className="w-14 h-14 top-[35%] left-[65%]"
      />
    </>
  );
}

function MidfielderZones({ stats }: { stats: PlayerStats }) {
  const maxVal = Math.max(stats.key_passes, stats.dribbles, stats.tackles, stats.interceptions, 1);
  return (
    <>
      <ZoneCircle
        label="Key Pass"
        value={stats.key_passes}
        color="#4f46e5"
        opacity={getOpacity(stats.key_passes, maxVal)}
        className="w-16 h-16 top-[30%] left-1/2 -translate-x-1/2"
      />
      <ZoneCircle
        label="Dribbles"
        value={stats.dribbles}
        color="#10b981"
        opacity={getOpacity(stats.dribbles, maxVal)}
        className="w-14 h-14 top-[50%] left-[30%]"
      />
      <ZoneCircle
        label="Tackles"
        value={stats.tackles}
        color="#dc2626"
        opacity={getOpacity(stats.tackles, maxVal)}
        className="w-14 h-14 top-[55%] left-[65%]"
      />
      <ZoneCircle
        label="Intercept."
        value={stats.interceptions}
        color="#ea580c"
        opacity={getOpacity(stats.interceptions, maxVal)}
        className="w-14 h-14 top-[70%] left-1/2 -translate-x-1/2"
      />
    </>
  );
}

function Legend() {
  const items = [
    { color: '#4f46e5', label: 'Attacking' },
    { color: '#10b981', label: 'Playmaking' },
    { color: '#dc2626', label: 'Defensive' },
    { color: '#f59e0b', label: 'Creativity' },
    { color: '#7c3aed', label: 'Aerial' },
  ];
  return (
    <div className="flex flex-wrap gap-3 mt-3 justify-center">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1 text-xs text-gray-600">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </div>
      ))}
      <div className="text-xs text-gray-400 ml-2">Opacity = intensity</div>
    </div>
  );
}

export default function ShotHeatmap({ stats, position }: ShotHeatmapProps) {
  const isForward = position === 'Forward';
  const isDefender = position === 'Defender';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Heatmap</h3>

      {/* Pitch */}
      <div className="relative mx-auto w-full max-w-md aspect-[3/4] bg-green-600 rounded-lg overflow-hidden border-2 border-white">
        {/* Halfway line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />

        {/* Center circle arc */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-14 border-2 border-white/70 rounded-t-full"
          style={{ borderBottom: 'none' }}
        />

        {/* Penalty box */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-[30%] border-2 border-white/70 border-t-0" />

        {/* Goal box */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/5 h-[14%] border-2 border-white/70 border-t-0" />

        {/* Penalty spot */}
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-2 h-2 bg-white/70 rounded-full" />

        {/* Goal line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/90" />

        {/* Zones */}
        {isForward && <ForwardZones stats={stats} />}
        {isDefender && <DefenderZones stats={stats} />}
        {!isForward && !isDefender && <MidfielderZones stats={stats} />}
      </div>

      <Legend />
    </div>
  );
}
