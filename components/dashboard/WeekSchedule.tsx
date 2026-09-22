'use client';
// Week schedule — 3-column grid showing the next 3 days of games.
// Only rendered during 'season-start' phase.

import Link from 'next/link';
import { gameUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pred = any;

interface DayColumn {
  date: string;
  label: string;
  games: Game[];
  preds: Record<number, Pred>;
}

function formatTime(utc: string): string {
  try {
    return new Date(utc).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
    });
  } catch { return ''; }
}

function formatDayHeader(dateStr: string, today: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  if (dateStr === today) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function DayGameRow({ game, pred, today }: { game: Game; pred: Pred | null; today: string }) {
  const away = game.awayTeam?.abbrev ?? '???';
  const home = game.homeTeam?.abbrev ?? '???';
  const isCompleted = ['FINAL', 'OFF'].includes(game.gameState);
  const isLive = ['LIVE', 'CRIT'].includes(game.gameState);
  const awayScore = game.awayTeam?.score ?? null;
  const homeScore = game.homeTeam?.score ?? null;

  const homeProb = pred?.home_win_probability ?? null;
  const awayConf = homeProb != null ? Math.round((1 - homeProb) * 100) : null;
  const homeConf = homeProb != null ? Math.round(homeProb * 100) : null;
  const favorHome = homeProb != null ? homeProb >= 0.5 : null;

  const href = gameUrl(game.id, away, home, game.gameDate ?? '');

  return (
    <Link
      href={href}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity py-2"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`} alt={away} style={{ width: 20, height: 20, flexShrink: 0 }} />
      <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-bright)', minWidth: 28 }}>{away}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.5625rem' }}>at</span>
      <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-bright)', minWidth: 28 }}>{home}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`} alt={home} style={{ width: 20, height: 20, flexShrink: 0 }} />
      <div className="flex-1" />
      {isLive && awayScore != null && homeScore != null ? (
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: '#ff4444', fontWeight: 700 }}>
          {awayScore}–{homeScore} LIVE
        </span>
      ) : isCompleted && awayScore != null && homeScore != null ? (
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
          {awayScore}–{homeScore}
        </span>
      ) : awayConf != null && homeConf != null ? (
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--heat)', fontWeight: 700 }}>
          {favorHome === false ? away : home} {favorHome === false ? awayConf : homeConf}%
        </span>
      ) : (
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
          {formatTime(game.startTimeUTC)}
        </span>
      )}
    </Link>
  );
}

function DayCard({ col, today }: { col: DayColumn; today: string }) {
  const isToday = col.date === today;

  return (
    <div
      className="flex flex-col"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {isToday && (
            <p style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5rem', color: 'var(--heat)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>
              TONIGHT
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', fontWeight: 700, color: isToday ? 'var(--heat)' : 'var(--text-bright)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {col.label}
          </p>
        </div>
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {col.games.length} GAME{col.games.length !== 1 ? 'S' : ''}
        </span>
      </div>

      {/* Games */}
      <div className="flex flex-col">
        {col.games.length > 0 ? (
          col.games.map((g: Game) => (
            <DayGameRow
              key={g.id}
              game={g}
              pred={col.preds[g.id] ?? null}
              today={today}
            />
          ))
        ) : (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 0' }}>No games scheduled</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  days: DayColumn[];
  today: string;
}

export default function WeekSchedule({ days, today }: Props) {
  if (!days.length) return null;

  return (
    <section>
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--heat)', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: '6px' }}>
            WEEK ONE
          </p>
          <h2 style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03125rem', lineHeight: 1.05, color: 'var(--text-bright)' }}>
            First week, every pick.
          </h2>
        </div>
        <Link href="/games" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--heat)', fontWeight: 600, flexShrink: 0 }}>
          FULL SCHEDULE →
        </Link>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-3">
        {days.map(col => (
          <DayCard key={col.date} col={col} today={today} />
        ))}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {days.map(col => (
          <div key={col.date} style={{ minWidth: 280, flexShrink: 0 }}>
            <DayCard col={col} today={today} />
          </div>
        ))}
      </div>
    </section>
  );
}
