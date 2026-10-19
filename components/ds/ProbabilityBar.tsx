// Two-sided win probability bar; our pick's side is heat-colored
// (design game-detail-final "Probability bar").
export function ProbabilityBar({
  home,
  away,
  pick,
}: {
  home: { abbrev: string; pct: number };
  away: { abbrev: string; pct: number };
  pick: 'home' | 'away';
}) {
  const mono = { fontFamily: 'var(--font-geist-mono), monospace' } as const;
  const left = away; // away listed first, as in "EDM @ COL"
  const right = home;
  const leftPicked = pick === 'away';
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[11px] font-bold" style={mono}>
        <span style={{ color: leftPicked ? 'var(--heat)' : 'var(--text)' }}>
          {left.abbrev} {Math.round(left.pct)}%
        </span>
        <span style={{ color: leftPicked ? 'var(--text)' : 'var(--heat)' }}>
          {right.abbrev} {Math.round(right.pct)}%
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-[5px]">
        <div style={{ flex: left.pct, background: leftPicked ? 'var(--heat)' : 'var(--border-soft)' }} />
        <div style={{ flex: right.pct, background: leftPicked ? 'var(--border-soft)' : 'var(--heat)' }} />
      </div>
    </div>
  );
}
