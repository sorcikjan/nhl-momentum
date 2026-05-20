'use client';

import Link from 'next/link';
import { gameUrl } from '@/lib/urls';
import { ppmToHeat, heatBorderColor, heatColor } from '@/lib/heat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pred = any;

interface TopPlayer {
  name: string;
  heat: number;
  team: string;
}

function formatNightLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// ── Single result card ────────────────────────────────────────────────────────

function ResultCard({
  game,
  pred,
  topPlayer,
}: {
  game: Game;
  pred: Pred;
  topPlayer?: TopPlayer;
}) {
  const away = game.away_team?.abbrev ?? '???';
  const home = game.home_team?.abbrev ?? '???';
  const awayScore = game.away_score ?? 0;
  const homeScore = game.home_score ?? 0;
  const awayWon = awayScore > homeScore;
  const homeWon = homeScore > awayScore;

  // Prediction data
  const homeProb = pred?.home_win_probability ?? null;
  const predictedHomeWin = homeProb != null ? homeProb >= 0.5 : null;

  // Outcome — prediction_outcomes is an array from the join
  const outcome = Array.isArray(pred?.prediction_outcomes)
    ? pred.prediction_outcomes[0]
    : pred?.prediction_outcomes;
  const correct: boolean | null = outcome?.correct_winner ?? null;
  const pickedAbbrev = predictedHomeWin === true ? home : predictedHomeWin === false ? away : null;
  const pickedPct = homeProb != null
    ? predictedHomeWin ? Math.round(homeProb * 100) : Math.round((1 - homeProb) * 100)
    : null;

  return (
    <Link
      href={gameUrl(game.id, away, home, game.game_date ?? '')}
      className="block rounded-xl hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Top row: pick result label */}
      {pickedAbbrev && (
        <div
          className="flex items-center justify-between px-4 pt-3 pb-1.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {correct === true ? (
            <span className="text-xs font-bold" style={{ color: '#22c55e' }}>
              PICK HIT ✓
            </span>
          ) : correct === false ? (
            <span className="text-xs font-bold" style={{ color: 'var(--red)' }}>
              PICK MISS ✗
            </span>
          ) : (
            <span className="text-xs font-bold" style={{ color: 'var(--silver)', opacity: 0.4 }}>
              NO OUTCOME
            </span>
          )}
          <span className="text-xs font-mono" style={{ color: 'var(--silver)', opacity: 0.5 }}>
            {pickedAbbrev} {pickedPct != null ? `${pickedPct}%` : ''}
          </span>
        </div>
      )}

      {/* Score row */}
      <div className="flex items-center gap-3 px-4 py-3">

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

        {/* Centre: FINAL label */}
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xs font-mono font-semibold"
            style={{ color: 'var(--silver)', opacity: 0.4, letterSpacing: '0.05em' }}>
            FINAL
          </span>
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

      {/* Bottom: top Heat player from this game */}
      {topPlayer && (
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>TOP HEAT</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>
              {topPlayer.name}
            </span>
            <span
              className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
              style={{
                background: `rgba(255,90,36,0.15)`,
                color: heatColor(topPlayer.heat),
                border: `1px solid ${heatBorderColor(topPlayer.heat)}`,
              }}
            >
              {topPlayer.heat}
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--text)', opacity: 0.4 }}>
            {topPlayer.team}
          </span>
        </div>
      )}
    </Link>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function ResultsSection({
  games,
  predMap,
  topPlayers,
  hideHeader = false,
}: {
  games: Game[];
  predMap: Map<number, Pred>;
  topPlayers?: Map<number, TopPlayer>;
  hideHeader?: boolean;
}) {
  const completed = games.filter((g: Game) => ['FINAL', 'OFF'].includes(g.game_state));
  if (!completed.length) return null;

  // Show only the most recent night
  const lastNight = completed.reduce((max: string, g: Game) =>
    (g.game_date as string) > max ? (g.game_date as string) : max, '');
  const lastNightGames = completed.filter((g: Game) => g.game_date === lastNight);

  // Compute accuracy callout
  let hits = 0;
  let total = 0;
  for (const g of lastNightGames) {
    const pred = predMap.get(g.id);
    if (!pred) continue;
    const outcome = Array.isArray(pred.prediction_outcomes)
      ? pred.prediction_outcomes[0]
      : pred.prediction_outcomes;
    if (outcome?.correct_winner !== undefined && outcome?.correct_winner !== null) {
      total++;
      if (outcome.correct_winner) hits++;
    }
  }
  const pct = total > 0 ? Math.round((hits / total) * 100) : null;

  return (
    <section>
      {!hideHeader && (
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              <span style={{ color: 'var(--text-bright)' }}>Results &amp; </span>
              <span style={{ color: 'var(--heat)' }}>predictions.</span>
            </h2>
            <p style={{ color: 'var(--silver)', opacity: 0.55, fontSize: '0.78rem', marginTop: '0.25rem' }}>
              {formatNightLabel(lastNight)} · {lastNightGames.length} game{lastNightGames.length !== 1 ? 's' : ''}
            </p>
          </div>
          {pct !== null && (
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--neon)' }}>
              WE GOT {hits}/{total} right · {pct}%
            </span>
          )}
        </div>
      )}

      {/* Desktop: 4-col grid (or 2-col for fewer games). Mobile: 1-col */}
      <div className={`grid gap-2 grid-cols-1 ${lastNightGames.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        {lastNightGames.map((g: Game) => (
          <ResultCard
            key={g.id}
            game={g}
            pred={predMap.get(g.id) ?? null}
            topPlayer={topPlayers?.get(g.id)}
          />
        ))}
      </div>
    </section>
  );
}

