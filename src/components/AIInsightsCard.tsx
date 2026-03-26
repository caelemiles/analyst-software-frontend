import type { MatchLog } from '../types';

interface AIInsightsCardProps {
  aiSummary: string;
  playerName: string;
  matchLogs?: MatchLog[];
}

function generateTrendObservations(matchLogs: MatchLog[]): string[] {
  if (matchLogs.length < 2) return [];
  const observations: string[] = [];

  const totalGoals = matchLogs.reduce((sum, m) => sum + m.goals, 0);
  const totalAssists = matchLogs.reduce((sum, m) => sum + m.assists, 0);
  const avgRating = matchLogs.reduce((sum, m) => sum + m.rating, 0) / matchLogs.length;

  // Rating trend
  const firstHalf = matchLogs.slice(0, Math.floor(matchLogs.length / 2));
  const secondHalf = matchLogs.slice(Math.floor(matchLogs.length / 2));
  const avgFirst = firstHalf.reduce((s, m) => s + m.rating, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, m) => s + m.rating, 0) / secondHalf.length;

  if (avgSecond > avgFirst + 0.3) {
    observations.push('Performance trending upward in recent matches.');
  } else if (avgFirst > avgSecond + 0.3) {
    observations.push('Performance showing a slight dip in recent fixtures.');
  } else {
    observations.push('Consistent performance levels maintained across the season.');
  }

  // Goal involvement
  if (totalGoals + totalAssists > 0) {
    observations.push(
      `${totalGoals} goals and ${totalAssists} assists across last ${matchLogs.length} matches.`
    );
  }

  // Average rating
  observations.push(`Average rating: ${avgRating.toFixed(1)} across sampled matches.`);

  return observations;
}

export default function AIInsightsCard({ aiSummary, playerName, matchLogs }: AIInsightsCardProps) {
  const trendObservations = matchLogs ? generateTrendObservations(matchLogs) : [];

  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-xl">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <h3 className="text-lg font-semibold">AI Insight</h3>
      </div>

      <p className="mb-3 text-sm font-medium text-indigo-200">{playerName}</p>

      <p className="text-sm leading-relaxed text-white/90">
        {aiSummary || 'No AI insights available yet'}
      </p>

      {trendObservations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <h4 className="text-sm font-semibold text-indigo-200 mb-2">📊 Trend Observations</h4>
          <ul className="space-y-1">
            {trendObservations.map((obs, i) => (
              <li key={i} className="text-sm text-white/80 flex items-start gap-1.5">
                <span className="mt-0.5">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
