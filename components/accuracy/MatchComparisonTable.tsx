'use client';
import { useState, useMemo } from 'react';

interface PredictionOutcome {
  actual_home_score: number;
  actual_away_score: number;
  correct_winner: boolean;
}

interface Prediction {
  id: number;
  game_id: number;
  model_version: string;
  predicted_home_score: number;
  predicted_away_score: number;
  home_win_probability: number;
  away_win_probability: number;
  prediction_outcomes: PredictionOutcome[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  games: any;
}

interface GameRow {
  gameId: number;
  date: string;
  home: string;
  away: string;
  actualHome: number | null;
  actualAway: number | null;
  byVersion: Record<string, {
    predictedHome: number;
    predictedAway: number;
    homeWinPct: number;
    correct: boolean | null;
  }>;
}

// Only display these versions in the comparison table — legacy v1.0–v1.3 are excluded
const DISPLAY_VERSIONS = ['v1.4', 'v1.5', 'v1.6', 'v1.7'];

function teamAbbrev(games: unknown): { home: string; away: string } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = Array.isArray(games) ? games[0] : games;
  const home = g?.home_team?.abbrev ?? g?.home_team?.[0]?.abbrev ?? '?';
  const away = g?.away_team?.abbrev ?? g?.away_team?.[0]?.abbrev ?? '?';
  return { home, away };
}

export default function MatchComparisonTable({ predictions }: { predictions: Prediction[] }) {
  const [tab, setTab] = useState<'scored' | 'pending'>('scored');

  const { rows: allRows, versions } = useMemo(() => {
    const map = new Map<number, GameRow>();

    for (const p of predictions) {
      if (!DISPLAY_VERSIONS.includes(p.model_version)) continue;

      const outcome = p.prediction_outcomes?.[0] ?? null;
      const { home, away } = teamAbbrev(p.games);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = Array.isArray(p.games) ? p.games[0] : p.games;

      if (!map.has(p.game_id)) {
        map.set(p.game_id, {
          gameId: p.game_id,
          date: g?.game_date ?? '',
          home,
          away,
          actualHome: outcome?.actual_home_score ?? null,
          actualAway: outcome?.actual_away_score ?? null,
          byVersion: {},
        });
      }

      const row = map.get(p.game_id)!;
      if (outcome && row.actualHome === null) {
        row.actualHome = outcome.actual_home_score;
        row.actualAway = outcome.actual_away_score;
      }
      if (row.home === '?' && home !== '?') { row.home = home; row.away = away; }

      row.byVersion[p.model_version] = {
        predictedHome: p.predicted_home_score,
        predictedAway: p.predicted_away_score,
        homeWinPct: Math.round((p.home_win_probability ?? 0) * 100),
        correct: outcome ? outcome.correct_winner : null,
      };
    }

    const sorted = [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
    const presentVersions = DISPLAY_VERSIONS.filter(v => sorted.some(g => g.byVersion[v]));

    return { rows: sorted, versions: presentVersions };
  }, [predictions]);

  const scored = allRows.filter(g => g.actualHome !== null);
  const pending = allRows.filter(g => g.actualHome === null);
  const rows = tab === 'scored' ? scored : pending;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
          Match Predictions
        </span>
        <div className="flex gap-1">
          {([['scored', `Scored (${scored.length})`], ['pending', `Pending (${pending.length})`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="text-xs px-3 py-1 rounded font-semibold transition-all"
              style={{
                background: tab === key ? 'var(--neon)' : 'var(--border)',
                color: tab === key ? 'var(--bg)' : 'var(--text)',
                cursor: 'pointer',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm" style={{ color: 'var(--text)' }}>No games to show.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-card)' }}>
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase"
                  style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)', minWidth: 150 }}>
                  Match
                </th>
                {tab === 'scored' && (
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase"
                    style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    Result
                  </th>
                )}
                {versions.map(v => (
                  <th key={v} className="px-4 py-2.5 text-left text-xs font-semibold uppercase font-mono"
                    style={{ color: 'var(--neon)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', minWidth: 120 }}>
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((game, i) => {
                const correctCount = versions.filter(v => game.byVersion[v]?.correct === true).length;
                const scoredCount = versions.filter(v => game.byVersion[v]?.correct !== null && game.byVersion[v]?.correct !== undefined).length;
                const bg = i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)';

                return (
                  <tr key={game.gameId} className="border-t" style={{ borderColor: 'var(--border)', background: bg }}>
                    {/* Match */}
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: 'var(--text-bright)' }}>
                        {game.away} @ {game.home}
                      </div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text)' }}>
                        {game.date?.slice(5) ?? '—'}
                      </div>
                    </td>

                    {/* Actual result */}
                    {tab === 'scored' && (
                      <td className="px-4 py-3">
                        {game.actualHome !== null ? (
                          <>
                            <div className="font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
                              {game.actualHome} – {game.actualAway}
                            </div>
                            {scoredCount > 0 && (
                              <div className="text-xs mt-0.5 font-mono" style={{
                                color: correctCount / scoredCount >= 0.6 ? 'var(--green)'
                                  : correctCount / scoredCount >= 0.4 ? 'var(--amber)'
                                  : 'var(--red)',
                              }}>
                                {correctCount}/{scoredCount} correct
                              </div>
                            )}
                          </>
                        ) : <span style={{ color: 'var(--text)' }}>—</span>}
                      </td>
                    )}

                    {/* Per-version cells */}
                    {versions.map(v => {
                      const pred = game.byVersion[v];
                      if (!pred) {
                        return (
                          <td key={v} className="px-4 py-3 text-xs" style={{ color: 'var(--text)' }}>—</td>
                        );
                      }
                      const pickedHome = pred.homeWinPct > 50;
                      return (
                        <td key={v} className="px-4 py-3">
                          <div className="font-mono text-xs" style={{ color: 'var(--text-bright)' }}>
                            {pred.predictedHome.toFixed(1)} – {pred.predictedAway.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs font-mono" style={{ color: pickedHome ? 'var(--neon)' : 'var(--silver)' }}>
                              {pickedHome ? `${pred.homeWinPct}% home` : `${100 - pred.homeWinPct}% away`}
                            </span>
                            {pred.correct !== null && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                style={{
                                  background: pred.correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: pred.correct ? 'var(--green)' : 'var(--red)',
                                }}>
                                {pred.correct ? '✓' : '✗'}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
