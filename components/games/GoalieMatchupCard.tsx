export interface GoalieSide {
  name: string;
  abbrev: string;
  savePct: number | null;
  gaa: number | null;
  gamesPlayed: number;
}

export default function GoalieMatchupCard({ away, home }: { away: GoalieSide; home: GoalieSide }) {
  // Edge: a simple, documented composite of save% and goals-against-average
  // differential — not an NHL-published figure, just a transparent way to
  // compare the two goalies' real season numbers at a glance.
  const edge = away.savePct != null && home.savePct != null
    ? Math.round((home.savePct - away.savePct) * 1000 + ((away.gaa ?? 0) - (home.gaa ?? 0)) * 10)
    : null;

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text)' }}>Goalie Matchup</div>
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{away.name}</div>
          <div className="text-xs font-mono mt-1" style={{ color: 'var(--text)' }}>
            {away.savePct != null ? away.savePct.toFixed(3).replace(/^0/, '') : '—'}
            {away.gaa != null ? ` · ${away.gaa.toFixed(2)}` : ''}
          </div>
        </div>
        <div className="text-center px-3 flex-shrink-0">
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text)', opacity: 0.6 }}>Edge</div>
          <div className="text-sm font-bold font-mono" style={{ color: edge == null ? 'var(--text)' : edge > 0 ? 'var(--heat)' : edge < 0 ? 'var(--cold)' : 'var(--text)' }}>
            {edge == null ? '—' : edge > 0 ? `+${edge}` : edge}
          </div>
        </div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{home.name}</div>
          <div className="text-xs font-mono mt-1" style={{ color: 'var(--text)' }}>
            {home.savePct != null ? home.savePct.toFixed(3).replace(/^0/, '') : '—'}
            {home.gaa != null ? ` · ${home.gaa.toFixed(2)}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
