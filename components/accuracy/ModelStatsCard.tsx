interface ModelStat {
  version: string;
  totalPredictions: number;
  withOutcome: number;
  winnerAccuracyPct: number | null;
  avgHomeError: number | null;
  avgAwayError: number | null;
}

export default function ModelStatsCard({ stat }: { stat: ModelStat }) {
  const hasData = stat.withOutcome > 0;

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold font-mono" style={{ color: 'var(--neon)' }}>
          {stat.version}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded font-mono"
          style={{ background: 'var(--border)', color: 'var(--text)' }}>
          {stat.totalPredictions} predictions
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: 'var(--text)' }}>Winner Acc.</span>
          <span className="text-xl font-bold font-mono" style={{
            color: hasData
              ? (stat.winnerAccuracyPct! >= 60 ? 'var(--green)' : stat.winnerAccuracyPct! >= 45 ? 'var(--amber)' : 'var(--red)')
              : 'var(--text)',
          }}>
            {hasData ? `${stat.winnerAccuracyPct}%` : '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: 'var(--text)' }}>Avg Home Err</span>
          <span className="text-xl font-bold font-mono" style={{ color: 'var(--text-bright)' }}>
            {hasData ? `±${stat.avgHomeError}` : '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: 'var(--text)' }}>Avg Away Err</span>
          <span className="text-xl font-bold font-mono" style={{ color: 'var(--text-bright)' }}>
            {hasData ? `±${stat.avgAwayError}` : '—'}
          </span>
        </div>
      </div>

      {hasData && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text)' }}>
            <span>Coverage</span>
            <span>{stat.withOutcome}/{stat.totalPredictions} resolved</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-1.5 rounded-full"
              style={{
                width: `${(stat.withOutcome / stat.totalPredictions) * 100}%`,
                background: 'var(--neon)',
              }} />
          </div>
        </div>
      )}
    </div>
  );
}
