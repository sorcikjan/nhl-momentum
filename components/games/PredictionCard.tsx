type PredictionFactor = { label: string; away: { name?: string; value: number | null }; home: { name?: string; value: number | null } };

export default function PredictionCard({
  mode, favoredAbbrev, favoredPct, correct, accuracyYtd, accuracyRound, chips,
  factors, awayAbbrev, homeAbbrev,
}: {
  mode: 'pregame' | 'final';
  favoredAbbrev: string;
  favoredPct: number;
  correct?: boolean | null;
  accuracyYtd?: number | null;
  accuracyRound?: number | null;
  chips: string[];
  factors?: PredictionFactor[];
  awayAbbrev?: string;
  homeAbbrev?: string;
}) {
  const border = mode === 'final' && correct ? '1px solid rgba(0,229,160,0.35)' : '1px solid var(--border)';

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border, padding: 24 }}>
      {/* Result badge + accuracy */}
      <div className="flex items-center gap-4 mb-4">
        {/* Confidence circle */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 80, height: 80, borderRadius: 40,
            background: `conic-gradient(var(--heat) ${favoredPct}%, var(--border) 0)`,
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', inset: 7, borderRadius: 40, background: 'var(--bg-card)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-mono font-extrabold leading-none" style={{ fontSize: 18, color: 'var(--heat)' }}>{favoredPct}%</span>
            <span className="font-mono font-bold" style={{ fontSize: 8, color: 'var(--text)', opacity: 0.6, letterSpacing: '0.06em', marginTop: 1 }}>{favoredAbbrev} WIN</span>
          </div>
        </div>
        <div className="flex-1">
          {mode === 'final' && correct != null && (
            <div
              className="text-[10px] font-mono font-bold inline-flex px-2 py-0.5 rounded mb-1.5"
              style={{
                background: correct ? 'rgba(0,229,160,0.15)' : 'rgba(239,68,68,0.15)',
                color: correct ? 'var(--rise)' : 'var(--red)',
                border: `1px solid ${correct ? 'rgba(0,229,160,0.35)' : 'rgba(239,68,68,0.35)'}`,
                letterSpacing: '0.06em',
              }}
            >
              {correct ? '✓ HIT' : '✗ MISS'}
            </div>
          )}
          {(accuracyYtd != null || accuracyRound != null) && (
            <div className="text-xs" style={{ color: 'var(--text)' }}>
              {accuracyYtd != null && <>YTD: <span style={{ color: 'var(--rise)', fontWeight: 600 }}>{accuracyYtd}%</span></>}
              {accuracyYtd != null && accuracyRound != null && ' · '}
              {accuracyRound != null && <>Round: <span style={{ color: 'var(--rise)', fontWeight: 600 }}>{accuracyRound}%</span></>}
            </div>
          )}
          <div className="text-sm mt-1" style={{ color: 'var(--text)', lineHeight: 1.5 }}>
            {favoredAbbrev} {mode === 'pregame' ? 'to win based on current momentum.' : correct ? 'won — the model called it.' : 'was favored but lost.'}
          </div>
        </div>
      </div>

      {/* Probability bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1.5 font-mono font-bold" style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--heat)' }}>{awayAbbrev ?? favoredAbbrev} {favoredAbbrev === awayAbbrev ? favoredPct : 100 - favoredPct}%</span>
          <span style={{ color: 'var(--text)', opacity: 0.7 }}>{homeAbbrev ?? ''} {favoredAbbrev === homeAbbrev ? favoredPct : 100 - favoredPct}%</span>
        </div>
        <div className="flex rounded-full overflow-hidden" style={{ height: 8 }}>
          <div style={{ flex: favoredAbbrev === awayAbbrev ? favoredPct : 100 - favoredPct, background: 'var(--heat)' }} />
          <div style={{ flex: favoredAbbrev === awayAbbrev ? 100 - favoredPct : favoredPct, background: 'var(--border)' }} />
        </div>
      </div>

      {/* Why factors */}
      {factors && factors.length > 0 && (
        <div className="mb-4">
          <div className="font-mono font-bold uppercase mb-2.5" style={{ fontSize: 10, color: 'var(--text)', opacity: 0.6, letterSpacing: '0.12em' }}>
            Why · Top Factors
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {factors.map((f, i) => {
              const awayBetter = (f.away.value ?? 0) > (f.home.value ?? 0);
              const homeBetter = (f.home.value ?? 0) > (f.away.value ?? 0);
              return (
                <div
                  key={f.label}
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                >
                  <span className="text-xs font-mono font-semibold" style={{ color: awayBetter ? 'var(--heat)' : 'var(--text)' }}>
                    {f.away.name ? `${f.away.name} ` : ''}{f.away.value ?? '—'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.6 }}>{f.label}</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: homeBetter ? 'var(--heat)' : 'var(--text)' }}>
                    {f.home.value ?? '—'}{f.home.name ? ` ${f.home.name}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(c => (
            <span
              key={c}
              className="font-mono font-bold"
              style={{
                fontSize: 10, padding: '4px 8px', borderRadius: 3,
                background: mode === 'final' && correct ? 'rgba(0,229,160,0.12)' : 'var(--bg)',
                border: `1px solid ${mode === 'final' && correct ? 'rgba(0,229,160,0.35)' : 'var(--border)'}`,
                color: mode === 'final' && correct ? 'var(--rise)' : 'var(--text)',
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
