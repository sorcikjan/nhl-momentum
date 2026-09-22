'use client';
// Last Night Hero — two-column desktop layout for season-start / regular phases.
// Hero recap card on the left (~60%), compact result rows + video highlights on the right (~40%).

import Link from 'next/link';
import { gameUrl, recapUrl } from '@/lib/urls';
import { heatBorderColor, heatColor } from '@/lib/heat';
import { TEAM_COLORS } from './TonightSection';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pred = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Recap = any;

interface TopPlayer {
  name: string;
  heat: number;
  team: string;
  headshot_url?: string | null;
  season_points?: number;
  season_games?: number;
}

interface Props {
  games: Game[];
  predMap: Map<number, Pred>;
  topPlayers: Map<number, TopPlayer>;
  recaps: Recap[];
  lastNight: string;
}

function formatNightLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function cleanTitle(title: string): string {
  return title
    .replace(/^NHL Recap[^:]*:\s*/i, '')
    .replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}:\s*/i, '');
}

function HeatBadge({ heat }: { heat: number }) {
  return (
    <span
      className="font-mono font-bold px-1.5 py-0.5 rounded"
      style={{
        fontSize: '0.6875rem',
        background: 'rgba(255,90,36,0.15)',
        color: heatColor(heat),
        border: `1px solid ${heatBorderColor(heat)}`,
      }}
    >
      {heat}
    </span>
  );
}

// ── Hero card (left column, ~60%) ─────────────────────────────────────────────

function HeroCard({
  game,
  pred,
  topPlayer,
  recap,
}: {
  game: Game;
  pred: Pred | null;
  topPlayer: TopPlayer | null;
  recap: Recap | null;
}) {
  const away = game.away_team?.abbrev ?? '???';
  const home = game.home_team?.abbrev ?? '???';
  const awayScore = game.away_score ?? 0;
  const homeScore = game.home_score ?? 0;
  const awayWon = awayScore > homeScore;
  const homeWon = homeScore > awayScore;
  const winnerAbbrev = awayWon ? away : home;

  // Prediction outcome
  const outcome = Array.isArray(pred?.prediction_outcomes)
    ? pred.prediction_outcomes[0]
    : pred?.prediction_outcomes;
  const correct: boolean | null = outcome?.correct_winner ?? null;
  const homeProb = pred?.home_win_probability ?? null;
  const predictedHomeWin = homeProb != null ? homeProb >= 0.5 : null;
  const pickedAbbrev = predictedHomeWin === true ? home : predictedHomeWin === false ? away : null;
  const pickedPct = homeProb != null
    ? predictedHomeWin ? Math.round(homeProb * 100) : Math.round((1 - homeProb) * 100)
    : null;

  const bgColor = TEAM_COLORS[winnerAbbrev] ?? '#1a1d26';
  const title = recap ? cleanTitle(recap.title ?? '') : null;
  const href = gameUrl(game.id, away, home, game.game_date ?? '');
  const recapHref = recap ? recapUrl(recap.date, recap.title ?? '') : href;

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{ background: bgColor, minHeight: '320px' }}
    >
      {/* Background: hero image or gradient */}
      {recap?.hero_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recap.hero_image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.35, mixBlendMode: 'luminosity' }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${bgColor} 0%, rgba(10,11,15,0.95) 100%)`,
          }}
        />
      )}

      {/* Dark scrim */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(8,8,12,0.98) 0%, rgba(8,8,12,0.6) 50%, rgba(8,8,12,0.15) 100%)'
      }} />

      {/* Pick badge — top right */}
      {pickedAbbrev && correct !== null && (
        <div className="absolute top-3 right-3 z-10">
          <span
            className="text-xs font-bold px-2 py-1 rounded"
            style={{
              background: correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
              border: `1px solid ${correct ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
              color: correct ? '#22c55e' : 'var(--red)',
              fontFamily: 'var(--font-geist-mono), monospace',
              letterSpacing: '0.05em',
              fontSize: '0.5625rem',
            }}
          >
            {correct ? '✓ PICK HIT' : '✗ PICK MISS'} · {pickedAbbrev} {pickedPct != null ? `${pickedPct}%` : ''}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end flex-1 p-5 gap-3" style={{ minHeight: '320px' }}>
        {/* Score display */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`}
            alt={away}
            style={{ width: 32, height: 32, opacity: homeWon ? 0.4 : 1 }}
          />
          <span
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '1.75rem',
              fontWeight: 900,
              color: awayWon ? '#fff' : 'rgba(255,255,255,0.4)',
              lineHeight: 1,
            }}
          >
            {awayScore}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: 'var(--font-geist-mono), monospace' }}>–</span>
          <span
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '1.75rem',
              fontWeight: 900,
              color: homeWon ? '#fff' : 'rgba(255,255,255,0.4)',
              lineHeight: 1,
            }}
          >
            {homeScore}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`}
            alt={home}
            style={{ width: 32, height: 32, opacity: awayWon ? 0.4 : 1 }}
          />
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>FINAL</span>
        </div>

        {/* Headline */}
        {title && (
          <h3
            style={{
              fontWeight: 800,
              fontSize: 'clamp(1rem, 3vw, 1.35rem)',
              color: '#fff',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            {title}
          </h3>
        )}

        {/* Recap summary */}
        {recap?.summary && (
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }} className="line-clamp-2">
            {recap.summary}
          </p>
        )}

        {/* Star of the night */}
        {topPlayer && (
          <div
            className="flex items-center gap-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '8px 10px',
              alignSelf: 'flex-start',
            }}
          >
            {/* Headshot */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg)' }}>
              {topPlayer.headshot_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={topPlayer.headshot_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--bg-raised)' }} />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.08em' }}>
                STAR OF THE NIGHT
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                {topPlayer.name}
              </span>
              {(topPlayer.season_points != null && topPlayer.season_games != null) && (
                <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)' }}>
                  {topPlayer.season_points}pts · {topPlayer.season_games}GP this season
                </span>
              )}
            </div>
            <HeatBadge heat={topPlayer.heat} />
          </div>
        )}

        {/* Full recap link */}
        <div className="flex items-center gap-3">
          <Link
            href={recapHref}
            className="text-sm font-semibold hover:underline"
            style={{ color: 'var(--heat)' }}
          >
            FULL RECAP + HIGHLIGHTS →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Compact result row (right column) ─────────────────────────────────────────

function CompactResultRow({
  game,
  pred,
  topPlayer,
}: {
  game: Game;
  pred: Pred | null;
  topPlayer: TopPlayer | null;
}) {
  const away = game.away_team?.abbrev ?? '???';
  const home = game.home_team?.abbrev ?? '???';
  const awayScore = game.away_score ?? 0;
  const homeScore = game.home_score ?? 0;
  const awayWon = awayScore > homeScore;
  const homeWon = homeScore > awayScore;

  const outcome = Array.isArray(pred?.prediction_outcomes)
    ? pred.prediction_outcomes[0]
    : pred?.prediction_outcomes;
  const correct: boolean | null = outcome?.correct_winner ?? null;
  const homeProb = pred?.home_win_probability ?? null;
  const predictedHomeWin = homeProb != null ? homeProb >= 0.5 : null;
  const pickedAbbrev = predictedHomeWin === true ? home : predictedHomeWin === false ? away : null;
  const pickedPct = homeProb != null
    ? predictedHomeWin ? Math.round(homeProb * 100) : Math.round((1 - homeProb) * 100)
    : null;

  return (
    <Link
      href={gameUrl(game.id, away, home, game.game_date ?? '')}
      className="flex items-center gap-2.5 rounded-xl hover:opacity-80 transition-opacity"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        padding: '10px 12px',
      }}
    >
      {/* Pick badge */}
      {correct !== null ? (
        <span
          className="font-bold rounded shrink-0"
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.5rem',
            padding: '2px 5px',
            background: correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: correct ? '#22c55e' : 'var(--red)',
            border: `1px solid ${correct ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            letterSpacing: '0.06em',
            minWidth: 36,
            textAlign: 'center',
          }}
        >
          {correct ? 'HIT' : 'MISS'}
        </span>
      ) : (
        <span style={{ minWidth: 36 }} />
      )}

      {/* Away team */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`} alt={away} style={{ width: 22, height: 22, opacity: homeWon ? 0.4 : 1, flexShrink: 0 }} />
      <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: awayWon ? 'var(--text-bright)' : 'var(--text)', fontFamily: 'var(--font-geist-mono), monospace' }}>
        {awayScore}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>–</span>
      <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: homeWon ? 'var(--text-bright)' : 'var(--text)', fontFamily: 'var(--font-geist-mono), monospace' }}>
        {homeScore}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`} alt={home} style={{ width: 22, height: 22, opacity: awayWon ? 0.4 : 1, flexShrink: 0 }} />

      {/* Picked / heat info */}
      <div className="flex-1 min-w-0 flex flex-col items-end gap-0.5">
        {pickedAbbrev && pickedPct != null && (
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            picked {pickedAbbrev} {pickedPct}%
          </span>
        )}
        {topPlayer && (
          <div className="flex items-center gap-1">
            <span style={{ fontSize: '0.5625rem', color: 'var(--text)', opacity: 0.6 }}>{topPlayer.name.split(' ').pop()}</span>
            <HeatBadge heat={topPlayer.heat} />
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Video highlight row ───────────────────────────────────────────────────────

function VideoRow({ game }: { game: Game }) {
  const videoId = game.youtube_highlight_id;
  if (!videoId) return null;
  const away = game.away_team?.abbrev ?? '???';
  const home = game.home_team?.abbrev ?? '???';
  const href = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl hover:opacity-80 transition-opacity"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        padding: '10px 12px',
      }}
    >
      {/* Play icon */}
      <div
        className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ width: 32, height: 32, background: 'rgba(255,90,36,0.15)', border: '1px solid rgba(255,90,36,0.3)' }}
      >
        <svg width="10" height="12" viewBox="0 0 10 12" fill="var(--heat)">
          <path d="M0 0L10 6L0 12V0Z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-bright)' }} className="truncate">
          {away} at {home} highlights
        </div>
        <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 1 }}>
          YouTube · NHL
        </div>
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  );
}

// ── Accuracy callout (top-right of header) ────────────────────────────────────

function AccuracyCallout({ hits, total }: { hits: number; total: number }) {
  if (!total) return null;
  const pct = Math.round((hits / total) * 100);

  return (
    <div
      className="flex items-center gap-2.5 rounded-[10px] shrink-0"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px 14px' }}
    >
      <div className="flex flex-col gap-0.5">
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
          OUR PICKS
        </span>
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '1.25rem', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {hits}/{total}
        </span>
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5rem', color: 'var(--text-muted)' }}>
          {pct}% · every pick graded
        </span>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LastNightHero({ games, predMap, topPlayers, recaps, lastNight }: Props) {
  const lastNightGames = games.filter(
    (g: Game) => ['FINAL', 'OFF'].includes(g.game_state) && g.game_date === lastNight
  );
  if (!lastNightGames.length) return null;

  // Compute accuracy
  let hits = 0, total = 0;
  for (const g of lastNightGames) {
    const pred = predMap.get(g.id);
    if (!pred) continue;
    const outcome = Array.isArray(pred.prediction_outcomes) ? pred.prediction_outcomes[0] : pred.prediction_outcomes;
    if (outcome?.correct_winner !== undefined && outcome?.correct_winner !== null) {
      total++;
      if (outcome.correct_winner) hits++;
    }
  }

  // Featured game = first one (could be highest-score game or just first)
  const featuredGame = lastNightGames[0];
  const otherGames = lastNightGames.slice(1);

  // Find the closest recap by date
  const recap = recaps.find((r: Recap) => r.date === lastNight) ?? recaps[0] ?? null;

  const videoGames = lastNightGames
    .filter((g: Game) => g.youtube_highlight_id)
    .slice(0, 3);

  const dateLabel = formatNightLabel(lastNight);
  const dayLabel = formatDayLabel(lastNight);

  return (
    <section>
      {/* Section header */}
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <p style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.6875rem',
            color: 'var(--heat)',
            fontWeight: 700,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            ● LAST NIGHT · {dateLabel} · {lastNightGames.length} GAME{lastNightGames.length !== 1 ? 'S' : ''}
          </p>
          <h2 style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03125rem', lineHeight: 1.05, color: 'var(--text-bright)' }}>
            Night one is in the books.
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: 4 }}>{dayLabel}</p>
        </div>
        <AccuracyCallout hits={hits} total={total} />
      </div>

      {/* Desktop: two-column layout */}
      <div className="hidden md:grid gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* Left: hero card */}
        <HeroCard
          game={featuredGame}
          pred={predMap.get(featuredGame.id) ?? null}
          topPlayer={topPlayers.get(featuredGame.id) ?? null}
          recap={recap}
        />

        {/* Right: compact results + highlights */}
        <div className="flex flex-col gap-3">
          {otherGames.length > 0 && (
            <div className="flex flex-col gap-2">
              {otherGames.map((g: Game) => (
                <CompactResultRow
                  key={g.id}
                  game={g}
                  pred={predMap.get(g.id) ?? null}
                  topPlayer={topPlayers.get(g.id) ?? null}
                />
              ))}
            </div>
          )}

          {videoGames.length > 0 && (
            <div className="flex flex-col gap-2">
              <p style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.5625rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 2,
              }}>
                HIGHLIGHTS · {videoGames.length} CLIP{videoGames.length !== 1 ? 'S' : ''}
              </p>
              {videoGames.map((g: Game) => (
                <VideoRow key={g.id} game={g} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden flex flex-col gap-3">
        <HeroCard
          game={featuredGame}
          pred={predMap.get(featuredGame.id) ?? null}
          topPlayer={topPlayers.get(featuredGame.id) ?? null}
          recap={recap}
        />
        {otherGames.map((g: Game) => (
          <CompactResultRow
            key={g.id}
            game={g}
            pred={predMap.get(g.id) ?? null}
            topPlayer={topPlayers.get(g.id) ?? null}
          />
        ))}
        {videoGames.length > 0 && (
          <div className="flex flex-col gap-2">
            <p style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              HIGHLIGHTS
            </p>
            {videoGames.map((g: Game) => (
              <VideoRow key={g.id} game={g} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
