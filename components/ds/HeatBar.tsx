import { heatColor } from '@/lib/heat';

// Horizontal heat bar (design primitives.js HeatBar).
export function HeatBar({ heat, height = 4, showLabel = false }: { heat: number; height?: number; showLabel?: boolean }) {
  const c = heatColor(heat);
  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex-1 overflow-hidden" style={{ height, borderRadius: height, background: 'var(--border-soft)' }}>
        <div
          style={{
            width: `${Math.max(0, Math.min(100, heat))}%`,
            height: '100%',
            borderRadius: height,
            background: `linear-gradient(90deg, ${c}66 0%, ${c} 100%)`,
          }}
        />
      </div>
      {showLabel && (
        <span className="min-w-5 text-right text-[11px] font-semibold" style={{ fontFamily: 'var(--font-geist-mono), monospace', color: c }}>
          {heat}
        </span>
      )}
    </div>
  );
}
