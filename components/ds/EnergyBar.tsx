// Energy 0–100 (design player-profile-final.js EnergyBar): rise ≥80, gold ≥50, red below.
export function energyLabel(value: number): 'FRESH' | 'MODERATE' | 'DRAINED' {
  return value >= 80 ? 'FRESH' : value >= 50 ? 'MODERATE' : 'DRAINED';
}

export function energyColor(value: number) {
  return value >= 80 ? 'var(--rise)' : value >= 50 ? 'var(--gold)' : 'var(--red)';
}

export function EnergyBar({
  value,
  size = 'lg',
  showLabel = false,
}: {
  value: number;
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}) {
  const c = energyColor(value);
  const h = size === 'lg' ? 8 : 5;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 overflow-hidden" style={{ height: h, borderRadius: h / 2, background: 'var(--border-soft)' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', borderRadius: h / 2, background: c }} />
      </div>
      <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-geist-mono), monospace', color: c }}>
        {value}
      </span>
      {showLabel && (
        <span className="text-[9px] font-semibold" style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-muted)' }}>
          {energyLabel(value)}
        </span>
      )}
    </div>
  );
}
