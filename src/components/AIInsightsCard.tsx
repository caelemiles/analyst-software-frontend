interface AIInsightsCardProps {
  aiSummary: string;
  playerName: string;
}

export default function AIInsightsCard({ aiSummary, playerName }: AIInsightsCardProps) {
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
    </div>
  );
}
