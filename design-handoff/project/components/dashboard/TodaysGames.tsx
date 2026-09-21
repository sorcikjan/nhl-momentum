'use client';

import { useState } from 'react';
import Link from 'next/link';
import { gameUrl } from '@/lib/urls';

interface Game {
  id: number;
  startTimeUTC: string;
  gameState: string;
  gameDate?: string;
  homeTeam: { abbrev: string; score?: number; logo?: string };
  awayTeam: { abbrev: string; score?: number; logo?: string };
  venue: { default: string };
}

function stateLabel(state: string) {
  switch (state) {
    case 'LIVE':
    case 'CRIT': return { label: 'LIVE', color: 'var(--red)' };
    case 'FINAL':
    case 'OFF':  return { label: 'FINAL', color: 'var(--text)' };
    default:     return { label: 'SCHED', color: 'var(--neon)' };
  }
}

export default function TodaysGames({ games }: { games: Game[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = games.slice(0, expanded ? games.length : 5);
  const canExpand = games.length > 5;

  if (!games.length) {
    return (
      <div className="rounded-xl border p-8 text-center flex flex-col items-center gap-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="text-3xl">🏒</div>
        <p className="text-sm" style={{ color: 'var(--text)' }}>No games scheduled today</p>
        <Link href="/rankings"
          className="text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: 'var(--neon-glow)', color: 'var(--neon)', border: '1px solid var(--neon)' }}>
          Browse momentum rankings →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--silver)' }}>
        🏒 Today&apos;s Games
      </h2>
      <div className="flex flex-col gap-2 flex-1">
        {visible.map((g) => {
          const time = new Date(g.startTimeUTC).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
          });
          const { label, color } = stateLabel(g.gameState);
          const isFinal = g.gameState === 'FINAL' || g.gameState === 'OFF';
          const isLive  = g.gameState === 'LIVE'  || g.gameState === 'CRIT';
          const date = g.gameDate ?? g.startTimeUTC?.slice(0, 10);

          return (
            <Link key={g.id}
              href={gameUrl(g.id, g.awayTeam.abbrev, g.homeTeam.abbrev, date)}
              className="rounded-lg p-3 flex items-center gap-3 hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg)', border: `1px solid ${isLive ? 'var(--red)' : 'var(--border)'}` }}>

              {/* Status */}
              <div className="text-xs font-mono font-bold w-14 text-center flex-shrink-0"
                style={{ color }}>
                {isLive ? '● ' : ''}{label}
                {!isLive && !isFinal && (
                  <div className="font-normal mt-0.5" style={{ color: 'var(--text)' }}>
                    {time} <span style={{ color: 'var(--text)', opacity: 0.6 }}>ET</span>
                  </div>
                )}
              </div>

              {/* Matchup */}
              <div className="flex-1 flex flex-col gap-1">
                {[g.awayTeam, g.homeTeam].map((team, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={team.logo || `https://assets.nhle.com/logos/nhl/svg/${team.abbrev}_light.svg`}
                        alt={team.abbrev} className="w-5 h-5 object-contain flex-shrink-0" loading="lazy" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                        {team.abbrev}
                      </span>
                    </div>
                    {(isFinal || isLive) && team.score !== undefined && (
                      <span className="text-sm font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
                        {team.score}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {canExpand && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 w-full text-xs py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          {expanded ? '↑ Show less' : `↓ Show ${games.length - 5} more`}
        </button>
      )}

      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            {visible.length} of {games.length} games
          </span>
          <Link href="/games"
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--silver)' }}>
            View full schedule →
          </Link>
        </div>
      </div>
    </div>
  );
}
