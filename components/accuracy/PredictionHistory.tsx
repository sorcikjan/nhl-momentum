interface PredictionOutcome {
  actual_home_score: number;
  actual_away_score: number;
  home_score_error: number;
  away_score_error: number;
  correct_winner: boolean;
  recorded_at: string;
}

interface Prediction {
  id: number;
  game_id: number;
  model_version: string;
  predicted_home_score: number;
  predicted_away_score: number;
  home_win_probability: number;
  away_win_probability: number;
  ot_probability: number;
  home_energy_bar: number;
  away_energy_bar: number;
  created_at: string;
  prediction_outcomes: PredictionOutcome[] | null;
  games: {
    game_date: string;
    home_team: { abbrev: string } | null;
    away_team: { abbrev: string } | null;
  } | null;
}

function WinBar({ home, away, ot }: { home: number; away: number; ot: number }) {
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-24">
      <div style={{ width: `${home * 100}%`, background: 'var(--neon)' }} />
      <div style={{ width: `${ot * 100}%`, background: 'var(--amber)' }} />
      <div style={{ width: `${away * 100}%`, background: 'var(--silver)' }} />
    </div>
  );
}

export default function PredictionHistory({ predictions }: { predictions: Prediction[] }) {
  if (!predictions.length) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text)' }}>No predictions yet. Predictions are stored before each game.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg-card)' }}>
            <tr>
              {['Date', 'Match', 'Predicted', 'Actual', 'Win Prob', 'Winner', 'Version'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase"
                  style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {predictions.map((p, i) => {
              const outcome = p.prediction_outcomes?.[0] ?? null;
              const home = p.games?.home_team?.abbrev ?? '?';
              const away = p.games?.away_team?.abbrev ?? '?';
              const date = p.games?.game_date?.slice(5) ?? '—';

              return (
                <tr key={p.id} className="border-t"
                  style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
                  <td className="px-3 py-2 text-xs font-mono" style={{ color: 'var(--text)' }}>{date}</td>
                  <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text-bright)' }}>
                    {home} vs {away}
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: 'var(--text)' }}>
                    {p.predicted_home_score?.toFixed(1)} – {p.predicted_away_score?.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: outcome ? 'var(--text-bright)' : 'var(--text)' }}>
                    {outcome ? `${outcome.actual_home_score} – ${outcome.actual_away_score}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <WinBar
                      home={p.home_win_probability ?? 0}
                      away={p.away_win_probability ?? 0}
                      ot={p.ot_probability ?? 0}
                    />
                    <span className="text-xs font-mono" style={{ color: 'var(--neon)' }}>
                      {Math.round((p.home_win_probability ?? 0) * 100)}%
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {outcome ? (
                      <span className="text-xs px-2 py-0.5 rounded font-semibold"
                        style={{
                          background: outcome.correct_winner ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: outcome.correct_winner ? 'var(--green)' : 'var(--red)',
                        }}>
                        {outcome.correct_winner ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text)' }}>Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono" style={{ color: 'var(--text)' }}>
                    {p.model_version}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
