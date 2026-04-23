'use client';

import Link from 'next/link';
import { gameUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pred = any;

// Mirrors TonightSection's TEAM_BADGE_COLORS exactly
const TEAM_BADGE_COLORS: Record<string, string> = {
  ANA: '#F47A38', ARI: '#8C2633', UTA: '#71AFE5',
  BOS: '#FFB81C', BUF: '#003087', CGY: '#C8102E',
  CAR: '#CC0000', CHI: '#CF0A2C', COL: '#6F263D',
  CBJ: '#002654', DAL: '#006847', DET: '#CE1126',
  EDM: '#FF4C00', FLA: '#C8102E', LAK: '#A2AAAD',
  MIN: '#154734', MTL: '#AF1E2D', NSH: '#FFB81C',
  NJD: '#CE1126', NYI: '#003087', NYR: '#0038A8',
  OTT: '#C2912C', PHI: '#F74902', PIT: '#FCB514',
  SEA: '#99D9D9', SJS: '#006D75', STL: '#002F87',
  TBL: '#002868', TOR: '#003E7E', VAN: '#00843D',
  VGK: '#B4975A', WSH: '#C8102E', WPG: '#041E42',
};

function formatNightLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// ── Single result card — mirrors RegularGameCard anatomy ──────────────────────

function ResultCard({ game, pred }: { game: Game; pred: Pred }) {
  const away = game.away_team?.abbrev ?? '???';
  const home = game.home_team?.abbrev ?? '???';
  const awayScore = game.away_score ?? 0;
  const homeScore = game.home_score ?? 0;
  const awayWon = awayScore > homeScore;
  const homeWon = homeScore > awayScore;

  // Prediction data
  const homeProb = pred?.home_win_probability ?? null;
  const awayProb = pred?.away_win_probability ?? (homeProb != null ? 1 - homeProb : null);
  const awayConf = awayProb != null ? Math.round(awayProb * 100) : null;
  const homeConf = homeProb != null ? Math.round(homeProb * 100) : null;
  const predictedHomeWin = homeProb != null ? homeProb >= 0.5 : null;
  const xgAway: number | null = pred?.predicted_away_score ?? null;
  const xgHome: number | null = pred?.predicted_home_score ?? null;
  const modelVersion: string | null = pred?.model_version ?? null;

  // Outcome — prediction_outcomes is an array from the join (same as game page)
  const outcome = Array.isArray(pred?.prediction_outcomes)
    ? pred.prediction_outcomes[0]
    : pred?.prediction_outcomes;
  const correct: boolean | null = outcome?.correct_winner ?? null;
  const pickedAbbrev = predictedHomeWin === true ? home : predictedHomeWin === false ? away : null;

  return (
    <Link
      href={gameUrl(game.id, away, home, game.game_date ?? '')}
      className="block rounded-xl hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Score row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">

        {/* Away side */}
        <div className="flex items-center gap-2.5 flex-shrink-0" style={{ minWidth: '90px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`}
            alt={away}
            style={{ width: '36px', height: '36px', flexShrink: 0, opacity: homeWon ? 0.45 : 1 }}
          />
          <div className="flex flex-col">
            <span className="font-black text-sm leading-none"
              style={{ color: awayWon ? '#fff' : 'var(--silver)' }}>
              {away}
            </span>
            <span className="font-black text-xl font-mono leading-tight"
              style={{ color: awayWon ? '#fff' : 'var(--silver)', opacity: awayWon ? 1 : 0.5 }}>
              {awayScore}
            </span>
          </div>
        </div>

        {/* Centre: FINAL + correct/wrong */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-mono font-semibold"
            style={{ color: 'var(--silver)', opacity: 0.4, letterSpacing: '0.05em' }}>
            FINAL
          </span>
          {correct === true && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
              ✓ correct
            </span>
          )}
          {correct === false && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)' }}>
              ✗ wrong
            </span>
          )}
        </div>

        {/* Home side */}
        <div className="flex items-center gap-2.5 flex-shrink-0 justify-end" style={{ minWidth: '90px' }}>
          <div className="flex flex-col items-end">
            <span className="font-black text-sm leading-none"
              style={{ color: homeWon ? '#fff' : 'var(--silver)' }}>
              {home}
            </span>
            <span className="font-black text-xl font-mono leading-tight"
              style={{ color: homeWon ? '#fff' : 'var(--silver)', opacity: homeWon ? 1 : 0.5 }}>
              {homeScore}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`}
            alt={home}
            style={{ width: '36px', height: '36px', flexShrink: 0, opacity: awayWon ? 0.45 : 1 }}
          />
        </div>
      </div>

      {/* Prediction block */}
      {pred != null && (
        <div
          className="px-4 pb-4 pt-3 flex flex-col gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono" style={{ color: 'var(--silver)', opacity: 0.35 }}>
              prediction{modelVersion ? ` · ${modelVersion}` : ''}
            </span>
            {pickedAbbrev != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.5 }}>picked</span>
                <span style={{
                  background: TEAM_BADGE_COLORS[pickedAbbrev] ?? '#333',
                  color: '#fff', padding: '1px 6px', borderRadius: '3px',
                  fontSize: '0.6rem', fontWeight: 700, lineHeight: 1,
                }}>
                  {pickedAbbrev}
                </span>
              </div>
            )}
          </div>

          {/* xG scores */}
          {xgAway != null && xgHome != null && (
            <div className="flex items-center justify-between">
              <div className="text-center">
                <span className="text-base font-bold font-mono" style={{ color: 'var(--silver)' }}>
                  {xgAway.toFixed(1)}
                </span>
                <span className="text-xs block" style={{ color: 'var(--silver)', opacity: 0.4 }}>xG {away}</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.3 }}>Expected score</span>
              <div className="text-center">
                <span className="text-base font-bold font-mono" style={{ color: 'var(--text-bright)' }}>
                  {xgHome.toFixed(1)}
                </span>
                <span className="text-xs block" style={{ color: 'var(--silver)', opacity: 0.4 }}>xG {home}</span>
              </div>
            </div>
          )}

          {/* Win probability bar */}
          {awayConf != null && homeConf != null && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: predictedHomeWin === false ? 'var(--heat)' : 'var(--silver)', opacity: predictedHomeWin === false ? 1 : 0.5 }}>
                  {away} {awayConf}%
                </span>
                <span style={{ color: predictedHomeWin === true ? 'var(--heat)' : 'var(--silver)', opacity: predictedHomeWin === true ? 1 : 0.5 }}>
                  {home} {homeConf}%
                </span>
              </div>
              <div className="flex rounded-full overflow-hidden" style={{ height: '5px' }}>
                <div style={{
                  flexGrow: awayConf,
                  background: predictedHomeWin === false ? 'var(--heat)' : 'rgba(255,255,255,0.15)',
                }} />
                <div style={{
                  flexGrow: homeConf,
                  background: predictedHomeWin === true ? 'var(--heat)' : 'rgba(255,255,255,0.15)',
                }} />
              </div>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function ResultsSection({
  games,
  predMap,
}: {
  games: Game[];
  predMap: Map<number, Pred>;
}) {
  const completed = games.filter((g: Game) => ['FINAL', 'OFF'].includes(g.game_state));
  if (!completed.length) return null;

  // Show only the most recent night
  const lastNight = completed.reduce((max: string, g: Game) =>
    (g.game_date as string) > max ? (g.game_date as string) : max, '');
  const lastNightGames = completed.filter((g: Game) => g.game_date === lastNight);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text)', opacity: 0.5 }}>
            Last night
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--silver)', opacity: 0.35 }}>
            {formatNightLabel(lastNight)}
          </p>
        </div>
        <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.4 }}>
          {lastNightGames.length} game{lastNightGames.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {lastNightGames.map((g: Game) => (
          <ResultCard key={g.id} game={g} pred={predMap.get(g.id) ?? null} />
        ))}
      </div>
    </section>
  );
}
