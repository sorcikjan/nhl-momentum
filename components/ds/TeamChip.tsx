import { teamColor } from '@/lib/team-colors';

// Team color block with the abbreviation (design primitives.js TeamChip; `ringed`
// is the games-list TeamBadge variant marking our pick).
export function TeamChip({
  abbrev,
  size = 28,
  ringed = false,
}: {
  abbrev: string;
  size?: number;
  ringed?: boolean;
}) {
  const c = teamColor(abbrev);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(4, Math.round(size / 4)),
        background: c.bg,
        color: c.fg,
        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
        fontSize: Math.round(size * 0.38),
        letterSpacing: 0.2,
        border: ringed ? '2px solid var(--heat)' : undefined,
      }}
      title={c.name}
    >
      {abbrev}
    </span>
  );
}
