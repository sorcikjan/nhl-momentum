export default function WinProbabilityCard({
  homeAbbrev, awayAbbrev, homeWinPct, awayWinPct, title = 'Win Probability',
}: {
  homeAbbrev: string;
  awayAbbrev: string;
  homeWinPct: number;
  awayWinPct: number;
  title?: string;
}) {
  const homeFavored = homeWinPct >= awayWinPct;
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--heat)', letterSpacing: '0.1em' }}>{title}</div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-bold font-mono" style={{ color: homeFavored ? 'var(--silver)' : 'var(--heat)' }}>
          {awayAbbrev} {awayWinPct}%
        </span>
        <span className="text-2xl font-bold font-mono" style={{ color: homeFavored ? 'var(--heat)' : 'var(--silver)' }}>
          {homeAbbrev} {homeWinPct}%
        </span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden">
        <div style={{ flexGrow: Math.max(awayWinPct, 1), background: homeFavored ? 'var(--silver)' : 'var(--heat)' }} />
        <div style={{ flexGrow: Math.max(homeWinPct, 1), background: homeFavored ? 'var(--heat)' : 'var(--silver)' }} />
      </div>
    </div>
  );
}
