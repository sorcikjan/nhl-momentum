import { heatColor } from '@/lib/heat';

const MONO = 'var(--font-geist-mono), ui-monospace, monospace';

// Heat number in a tinted pill (design games-list HeatPill). `null` = no data.
export function HeatPill({ heat, size = 'md' }: { heat: number | null; size?: 'sm' | 'md' }) {
  if (heat == null) {
    return (
      <span className="font-extrabold" style={{ fontFamily: MONO, fontSize: size === 'sm' ? 11 : 13, color: 'var(--text-muted)' }}>
        —
      </span>
    );
  }
  const c = heatColor(heat);
  return (
    <span
      className="inline-block rounded font-extrabold"
      style={{
        fontFamily: MONO,
        fontSize: size === 'sm' ? 11 : 13,
        color: c,
        padding: '3px 8px',
        background: `${c}1c`,
        border: `1px solid ${c}55`,
      }}
    >
      {heat}
    </span>
  );
}

// Conic ring with the number (design player hero "HEAT · L5" dial).
export function HeatDial({ heat, size = 80 }: { heat: number | null; size?: number }) {
  const c = heat == null ? 'var(--text-muted)' : heatColor(heat);
  const pct = heat ?? 0;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `conic-gradient(${c} ${pct}%, var(--border-soft) 0)`,
      }}
    >
      <div
        className="absolute flex items-center justify-center"
        style={{ inset: Math.round(size * 0.075), borderRadius: size / 2, background: 'var(--bg-card)' }}
      >
        <span className="font-extrabold leading-none" style={{ fontFamily: MONO, fontSize: Math.round(size * 0.32), color: c }}>
          {heat == null ? '—' : heat}
        </span>
      </div>
    </div>
  );
}
