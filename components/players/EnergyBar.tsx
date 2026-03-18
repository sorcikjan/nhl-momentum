export default function EnergyBar({ value }: { value: number }) {
  const color = value >= 70 ? 'var(--green)' : value >= 40 ? 'var(--amber)' : 'var(--red)';
  const label = value >= 70 ? 'Fresh' : value >= 40 ? 'Fatigued' : 'Drained';

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
          Energy Bar
        </h3>
        <span className="text-xs px-2 py-0.5 rounded font-semibold"
          style={{ background: `${color}22`, color }}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-3 rounded-full transition-all duration-700"
            style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
        </div>
        <span className="text-xl font-bold font-mono w-12 text-right" style={{ color }}>{value}</span>
      </div>
      <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text)' }}>
        <span>0 — Drained</span>
        <span>70+ penalty-free</span>
        <span>100 — Peak</span>
      </div>
    </div>
  );
}
