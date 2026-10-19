// Value over an uppercase label (design primitives.js Stat).
const SIZES = { sm: { v: 14, l: 9 }, md: { v: 18, l: 10 }, lg: { v: 24, l: 10 }, xl: { v: 32, l: 10 } } as const;

export function Stat({
  label,
  value,
  sub,
  color = 'var(--text-bright)',
  size = 'md',
  align = 'left',
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
  size?: keyof typeof SIZES;
  align?: 'left' | 'center' | 'right';
}) {
  const s = SIZES[size];
  return (
    <div className="flex flex-col gap-0.5" style={{ textAlign: align }}>
      <span
        className="font-semibold"
        style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', fontSize: s.v, color }}
      >
        {value}
      </span>
      <span
        className="font-medium uppercase"
        style={{ fontSize: s.l, letterSpacing: 0.8, color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      {sub && (
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}
