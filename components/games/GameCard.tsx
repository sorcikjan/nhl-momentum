interface Prediction {
  predicted_home_score: number;
  predicted_away_score: number;
  home_win_probability: number;
  away_win_probability: number;
  ot_probability: number;
  home_energy_bar: number;
  away_energy_bar: number;
  prediction_outcomes?: {
    actual_home_score: number;
    actual_away_score: number;
    correct_winner: boolean;
  }[];
}

interface Game {
  id: number;
  startTimeUTC: string;
  gameState: string;
  venue: { default: string };
  homeTeam: { id: number; abbrev: string; score?: number };
  awayTeam: { id: number; abbrev: string; score?: number };
}

function WinBar({ home, away, ot }: { home: number; away: number; ot: number }) {
  const hp = Math.round(home * 100);
  const ap = Math.round(away * 100);
  const op = Math.round(ot * 100);
  return (
    <div className="mt-3">
      <div className="flex text-xs justify-between mb-1" style={{ color: 'var(--text)' }}>
        <span style={{ color: 'var(--neon)' }}>{hp}%</span>
        <span>OT {op}%</span>
        <span style={{ color: 'var(--amber)' }}>{ap}%</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div style={{ width: `${hp}%`, background: 'var(--neon)' }} />
        <div style={{ width: `${op}%`, background: 'var(--silver)' }} />
        <div style={{ width: `${ap}%`, background: 'var(--amber)' }} />
      </div>
    </div>
  );
}

export default function GameCard({ game, prediction }: { game: Game; prediction?: Prediction }) {
  const time = new Date(game.startTimeUTC).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
  });

  const isLive  = game.gameState === 'LIVE' || game.gameState === 'CRIT';
  const isFinal = game.gameState === 'FINAL' || game.gameState === 'OFF';
  const outcome = prediction?.prediction_outcomes?.[0];

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3 transition-all hover:border-blue-900"
      style={{
        background: 'var(--bg-card)',
        borderColor: isLive ? 'var(--red)' : 'var(--border)',
      }}>

      {/* Status + time */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-bold" style={{ color: isLive ? 'var(--red)' : isFinal ? 'var(--text)' : 'var(--neon)' }}>
          {isLive ? '● LIVE' : isFinal ? 'FINAL' : time}
        </span>
        <span style={{ color: 'var(--text)' }}>{game.venue?.default}</span>
      </div>

      {/* Teams + scores */}
      <div className="flex flex-col gap-2">
        {[game.awayTeam, game.homeTeam].map((team, idx) => {
          const isHome = idx === 1;
          const predScore = isHome ? prediction?.predicted_home_score : prediction?.predicted_away_score;
          return (
            <div key={team.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  {isHome ? 'H' : 'A'}
                </span>
                <span className="font-bold text-base" style={{ color: 'var(--text-bright)' }}>{team.abbrev}</span>
              </div>
              <div className="flex items-center gap-3">
                {prediction && !isFinal && (
                  <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                    xG {predScore?.toFixed(1)}
                  </span>
                )}
                {(isFinal || isLive) && team.score !== undefined && (
                  <span className="text-xl font-bold font-mono" style={{ color: 'var(--text-bright)' }}>
                    {team.score}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Win probability bar */}
      {prediction && (
        <WinBar
          home={prediction.home_win_probability}
          away={prediction.away_win_probability}
          ot={prediction.ot_probability}
        />
      )}

      {/* Outcome badge */}
      {isFinal && outcome && (
        <div className="flex items-center justify-between pt-1 border-t text-xs"
          style={{ borderColor: 'var(--border)' }}>
          <span style={{ color: 'var(--text)' }}>
            Predicted {prediction?.predicted_away_score?.toFixed(1)}–{prediction?.predicted_home_score?.toFixed(1)}
          </span>
          <span className="px-2 py-0.5 rounded font-semibold"
            style={{
              background: outcome.correct_winner ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: outcome.correct_winner ? 'var(--green)' : 'var(--red)',
            }}>
            {outcome.correct_winner ? '✓ Correct' : '✗ Wrong'}
          </span>
        </div>
      )}

      {/* No prediction yet */}
      {!prediction && (
        <div className="text-xs text-center pt-1" style={{ color: 'var(--text)' }}>
          Prediction pending
        </div>
      )}
    </div>
  );
}
