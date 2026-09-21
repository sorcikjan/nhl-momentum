function LineupRow({ abbrev, outCount }: { abbrev: string; outCount: number }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span style={{ color: 'var(--text)' }}>{abbrev} lineup</span>
      <span
        className="text-xs font-bold px-2 py-0.5 rounded"
        style={{
          background: outCount === 0 ? 'rgba(0,229,160,0.12)' : 'rgba(239,68,68,0.12)',
          color: outCount === 0 ? 'var(--rise)' : 'var(--red)',
        }}
      >
        {outCount === 0 ? 'Full roster' : `${outCount} out`}
      </span>
    </div>
  );
}

export default function LineupContextCard({
  homeAbbrev, awayAbbrev, homeOutCount, awayOutCount, restDays,
}: {
  homeAbbrev: string;
  awayAbbrev: string;
  homeOutCount: number;
  awayOutCount: number;
  restDays: { home: number | null; away: number | null };
}) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--heat)', letterSpacing: '0.1em' }}>Lineup & Context</div>
      <LineupRow abbrev={awayAbbrev} outCount={awayOutCount} />
      <LineupRow abbrev={homeAbbrev} outCount={homeOutCount} />
      {(restDays.home != null || restDays.away != null) && (
        <div className="flex items-center justify-between text-sm py-1.5 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <span style={{ color: 'var(--text)' }}>Rest days</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-bright)' }}>
            {restDays.away ?? '—'} / {restDays.home ?? '—'}
          </span>
        </div>
      )}
    </div>
  );
}
