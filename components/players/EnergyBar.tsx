export default function EnergyBar({ value, leagueAvg }: { value: number; leagueAvg?: number }) {
  const hex   = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444';
  const color = value >= 70 ? 'var(--green)' : value >= 40 ? 'var(--amber)' : 'var(--red)';
  const label = value >= 70 ? 'Fresh' : value >= 40 ? 'Fatigued' : 'Drained';
  const diff  = leagueAvg !== undefined ? value - leagueAvg : null;

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
          Energy Bar
        </h3>
        <div className="flex items-center gap-2">
          {diff !== null && (
            <span className="text-xs font-mono px-2 py-0.5 rounded"
              style={{
                background: diff >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: diff >= 0 ? 'var(--green)' : 'var(--red)',
              }}>
              {diff >= 0 ? '+' : ''}{diff.toFixed(0)} vs league avg
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded font-semibold"
            style={{ background: `${color}22`, color }}>
            {label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-3 rounded-full overflow-visible" style={{ background: 'var(--border)' }}>
          <div className="h-3 rounded-full transition-all duration-700"
            style={{ width: `${value}%`, background: `linear-gradient(90deg, ${hex}, ${hex}88)` }} />
          {/* League average tick mark */}
          {leagueAvg !== undefined && (
            <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
              style={{ left: `${leagueAvg}%`, background: 'var(--amber)', opacity: 0.9 }} />
          )}
        </div>
        <span className="text-xl font-bold font-mono w-12 text-right" style={{ color }}>{value}</span>
      </div>
      <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text)' }}>
        <span>0 — Drained</span>
        {leagueAvg !== undefined && (
          <span style={{ color: 'var(--amber)' }}>▲ league avg {leagueAvg}</span>
        )}
        <span>100 — Peak</span>
      </div>
    </div>
  );
}
