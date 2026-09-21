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
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
          {mode === 'pregame' ? 'Our Pick' : 'Our Pick · How It Played'}
        </span>
        {mode === 'final' && correct != null && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: correct ? 'rgba(0,229,160,0.15)' : 'rgba(239,68,68,0.15)', color: correct ? 'var(--rise)' : 'var(--red)' }}
          >
            {correct ? '✓ HIT' : '✗ MISS'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl font-bold font-editorial" style={{ color: 'var(--heat)' }}>{favoredPct}%</span>
        <span className="text-sm" style={{ color: 'var(--text-bright)' }}>
          {favoredAbbrev} {mode === 'pregame' ? 'to win' : correct ? 'won — the model called it' : 'was favored'}
        </span>
      </div>

      {(accuracyYtd != null || accuracyRound != null) && (
        <div className="text-xs mb-3" style={{ color: 'var(--text)' }}>
          {accuracyYtd != null && <>YTD accuracy <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{accuracyYtd}%</span></>}
          {accuracyYtd != null && accuracyRound != null && ' · '}
          {accuracyRound != null && <>This round <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{accuracyRound}%</span></>}
        </div>
      )}

      {factors && factors.length > 0 && (
        <div className="mb-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
            Why {awayAbbrev && homeAbbrev ? `${awayAbbrev} @ ${homeAbbrev}` : ''}
          </div>
          {factors.map(f => {
            const awayBetter = (f.away.value ?? 0) > (f.home.value ?? 0);
            const homeBetter = (f.home.value ?? 0) > (f.away.value ?? 0);
            return (
              <div key={f.label} className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-mono font-semibold" style={{ color: awayBetter ? 'var(--heat)' : 'var(--text)' }}>
                  {f.away.name ? `${f.away.name} ` : ''}{f.away.value ?? '—'}
                </span>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text)', opacity: 0.6 }}>{f.label}</span>
                <span className="text-xs font-mono font-semibold" style={{ color: homeBetter ? 'var(--heat)' : 'var(--text)' }}>
                  {f.home.value ?? '—'}{f.home.name ? ` ${f.home.name}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(c => (
            <span key={c} className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
