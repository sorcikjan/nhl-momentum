import { TeamChip } from './TeamChip';

// Compact away @ home row with scores and status (design primitives.js ScoreRow).
// `status` is the text shown on the right: a time, "● P2 12:04", or "FINAL".
export function ScoreRow({
  away,
  home,
  awayScore,
  homeScore,
  status,
  live = false,
  compact = false,
}: {
  away: string;
  home: string;
  awayScore?: number | null;
  homeScore?: number | null;
  status: string;
  live?: boolean;
  compact?: boolean;
}) {
  const chip = compact ? 18 : 22;
  const score = { fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-bright)' } as const;
  return (
    <div
      className="flex items-center gap-2.5 rounded-lg text-xs"
      style={{
        padding: compact ? '6px 10px' : '8px 12px',
        background: 'var(--bg-raised)',
        border: `1px solid ${live ? 'var(--heat)' : 'var(--border-soft)'}`,
      }}
    >
      <TeamChip abbrev={away} size={chip} />
      <span className="min-w-3.5 text-center font-semibold" style={score}>{awayScore ?? ''}</span>
      <span className="text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-muted)' }}>@</span>
      <TeamChip abbrev={home} size={chip} />
      <span className="min-w-3.5 text-center font-semibold" style={score}>{homeScore ?? ''}</span>
      <span className="flex-1" />
      <span
        className="text-[10px] font-semibold"
        style={{ fontFamily: 'var(--font-geist-mono), monospace', color: live ? 'var(--heat)' : 'var(--text)' }}
      >
        {status}
      </span>
    </div>
  );
}
