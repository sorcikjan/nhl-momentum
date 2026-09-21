export default function LiveStatsGrid({
  rows, awayAbbrev, homeAbbrev,
}: {
  rows: { label: string; away: string | number; home: string | number }[];
  awayAbbrev: string;
  homeAbbrev: string;
}) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--heat)', letterSpacing: '0.1em' }}>Live Stats</span>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span style={{ color: 'var(--silver)' }}>{awayAbbrev}</span>
          <span style={{ color: 'var(--heat)' }}>{homeAbbrev}</span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.label} className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold w-10 text-right" style={{ color: 'var(--silver)' }}>{r.away}</span>
            <div className="flex-1 text-center text-xs" style={{ color: 'var(--text)' }}>{r.label}</div>
            <span className="font-mono font-bold w-10 text-left" style={{ color: 'var(--heat)' }}>{r.home}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
