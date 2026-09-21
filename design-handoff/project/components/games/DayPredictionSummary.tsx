interface Prediction {
  game_id: number;
  home_win_probability: number;
  away_win_probability: number;
  predicted_home_score?: number;
  predicted_away_score?: number;
  prediction_outcomes?: {
    correct_winner: boolean;
    actual_home_score: number;
    actual_away_score: number;
  }[];
}

export default function DayPredictionSummary({ predictions }: { predictions: Prediction[] }) {
  const withOutcome = predictions.filter(p => p.prediction_outcomes?.[0] != null);
  if (withOutcome.length === 0) return null;

  const correct = withOutcome.filter(p => p.prediction_outcomes![0].correct_winner).length;
  const total   = withOutcome.length;
  const pct     = Math.round((correct / total) * 100);

  const color   = pct >= 60 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';
  const bg      = pct >= 60 ? 'rgba(34,197,94,0.08)' : pct >= 40 ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)';

  // High-confidence picks — favoured team had ≥65% predicted win prob
  const highConf = withOutcome.filter(p => {
    const maxProb = Math.max(p.home_win_probability, p.away_win_probability);
    return maxProb >= 0.65;
  });
  const highConfCorrect = highConf.filter(p => p.prediction_outcomes![0].correct_winner).length;

  return (
    <div
      className="rounded-xl border px-4 py-3 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2"
      style={{ background: bg, borderColor: color + '40' }}
    >
      {/* Main score */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl font-bold font-mono" style={{ color }}>
          {correct}/{total}
        </span>
        <div>
          <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-bright)' }}>
            predictions correct
          </div>
          <div className="text-xs" style={{ color: 'var(--text)' }}>
            {pct}% accuracy today
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-8 self-center" style={{ background: 'var(--border)' }} />

      {/* Per-game dots */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {withOutcome.map(p => {
          const ok = p.prediction_outcomes![0].correct_winner;
          return (
            <span
              key={p.game_id}
              title={ok ? 'Correct' : 'Wrong'}
              className="w-3 h-3 rounded-full"
              style={{ background: ok ? 'var(--green)' : 'var(--red)', opacity: 0.85 }}
            />
          );
        })}
      </div>

      {/* High-confidence stat */}
      {highConf.length > 0 && (
        <>
          <div className="hidden sm:block w-px h-8 self-center" style={{ background: 'var(--border)' }} />
          <div className="text-xs" style={{ color: 'var(--text)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-bright)' }}>
              {highConfCorrect}/{highConf.length}
            </span>
            {' '}high-confidence picks correct
          </div>
        </>
      )}
    </div>
  );
}
