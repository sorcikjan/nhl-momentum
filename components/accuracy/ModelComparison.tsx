'use client';
import { useState } from 'react';

interface VersionPred {
  version: string;
  prediction: {
    predicted_home_score: number;
    predicted_away_score: number;
    home_win_probability: number;
    away_win_probability: number;
    ot_probability: number;
  } | null;
  correct: boolean | null;
}

interface GameComparison {
  game: {
    game_date: string;
    home_score: number | null;
    away_score: number | null;
    home_team: { abbrev: string } | null;
    away_team: { abbrev: string } | null;
  } | null;
  comparison: VersionPred[];
  outcome: {
    actual_home_score: number;
    actual_away_score: number;
  } | null;
}

export default function ModelComparison({ gameId, versions }: { gameId: number; versions: string[] }) {
  const [data, setData] = useState<GameComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/backtest?compare=${versions.join(',')}&game_id=${gameId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <button
        onClick={load}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded font-mono transition-all"
        style={{
          background: 'var(--border)',
          color: loading ? 'var(--text)' : 'var(--neon)',
          cursor: loading ? 'default' : 'pointer',
        }}>
        {loading ? 'Loading...' : `Compare ${versions.join(' vs ')}`}
      </button>
    );
  }

  if (error) return <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>;

  const { game, comparison, outcome } = data;
  const home = game?.home_team?.abbrev ?? '?';
  const away = game?.away_team?.abbrev ?? '?';

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
          {away} @ {home} · {game?.game_date?.slice(5)}
        </span>
        {outcome && (
          <span className="text-sm font-bold font-mono" style={{ color: 'var(--neon)' }}>
            Actual: {outcome.actual_home_score} – {outcome.actual_away_score}
          </span>
        )}
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {comparison.map(v => (
          <div key={v.version} className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--bg)' }}>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold" style={{ color: 'var(--neon)' }}>
                {v.version}
              </span>
              {v.prediction ? (
                <span className="font-mono text-sm" style={{ color: 'var(--text-bright)' }}>
                  xG: {v.prediction.predicted_home_score} – {v.prediction.predicted_away_score}
                  <span className="ml-2 text-xs" style={{ color: 'var(--text)' }}>
                    ({Math.round(v.prediction.home_win_probability * 100)}% home win)
                  </span>
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text)' }}>No prediction</span>
              )}
            </div>
            {v.correct !== null && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{
                  background: v.correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: v.correct ? 'var(--green)' : 'var(--red)',
                }}>
                {v.correct ? '✓ Correct' : '✗ Wrong'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Usage hint for the accuracy page — shows how to compare models per game
export function ComparisonExample() {
  const [gameId, setGameId] = useState('');
  const [versions] = useState(['v1.0']);

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
        Compare Model Versions Per Game
      </h3>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Game ID"
          value={gameId}
          onChange={e => setGameId(e.target.value)}
          className="flex-1 text-sm font-mono px-3 py-1.5 rounded border"
          style={{
            background: 'var(--bg)',
            borderColor: 'var(--border)',
            color: 'var(--text-bright)',
          }}
        />
        {gameId && (
          <ModelComparison
            gameId={Number(gameId)}
            versions={versions}
          />
        )}
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--text)' }}>
        Once v1.1 is backtested, compare with: v1.0,v1.1
      </p>
    </div>
  );
}
