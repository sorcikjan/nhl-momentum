'use client';

import { useState } from 'react';
import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import { gameUrl } from '@/lib/urls';

// Classic NHL rivalries — symmetric pairs
const RIVALRY_PAIRS = new Set([
  'BOS-TOR', 'TOR-BOS', 'MTL-TOR', 'TOR-MTL', 'MTL-BOS', 'BOS-MTL',
  'NYR-NYI', 'NYI-NYR', 'NYR-NJD', 'NJD-NYR', 'PHI-PIT', 'PIT-PHI',
  'EDM-CGY', 'CGY-EDM', 'VAN-CGY', 'CGY-VAN', 'VAN-EDM', 'EDM-VAN',
  'CHI-STL', 'STL-CHI', 'DET-CHI', 'CHI-DET', 'DET-BOS', 'BOS-DET',
  'WSH-PIT', 'PIT-WSH', 'WSH-NYR', 'NYR-WSH',
  'FLA-TBL', 'TBL-FLA', 'BOS-FLA', 'FLA-BOS', 'TBL-BOS', 'BOS-TBL',
  'COL-DAL', 'DAL-COL', 'VGK-EDM', 'EDM-VGK',
]);

const DIVISIONS: Record<string, string> = {
  BOS: 'Atlantic', BUF: 'Atlantic', DET: 'Atlantic', FLA: 'Atlantic',
  MTL: 'Atlantic', OTT: 'Atlantic', TBL: 'Atlantic', TOR: 'Atlantic',
  CAR: 'Metropolitan', CBJ: 'Metropolitan', NJD: 'Metropolitan', NYI: 'Metropolitan',
  NYR: 'Metropolitan', PHI: 'Metropolitan', PIT: 'Metropolitan', WSH: 'Metropolitan',
  CHI: 'Central', COL: 'Central', DAL: 'Central', MIN: 'Central',
  NSH: 'Central', STL: 'Central', UTA: 'Central', WPG: 'Central',
  ANA: 'Pacific', CGY: 'Pacific', EDM: 'Pacific', LAK: 'Pacific',
  SEA: 'Pacific', SJS: 'Pacific', VAN: 'Pacific', VGK: 'Pacific',
};

function gameScore(homeAbbrev: string, awayAbbrev: string): number {
  const key = `${homeAbbrev}-${awayAbbrev}`;
  if (RIVALRY_PAIRS.has(key)) return 3;
  if (DIVISIONS[homeAbbrev] && DIVISIONS[homeAbbrev] === DIVISIONS[awayAbbrev]) return 2;
  return 0;
}

function matchupLabel(homeAbbrev: string, awayAbbrev: string): string | null {
  const key = `${homeAbbrev}-${awayAbbrev}`;
  if (RIVALRY_PAIRS.has(key)) return '🔥 Rivalry';
  if (DIVISIONS[homeAbbrev] && DIVISIONS[homeAbbrev] === DIVISIONS[awayAbbrev]) return '🏒 Division Matchup';
  return null;
}

interface Game {
  id: number;
  startTimeUTC: string;
  gameDate?: string;
  gameState: string;
  venue: { default: string };
  homeTeam: { id: number; abbrev: string; score?: number; logo?: string };
  awayTeam: { id: number; abbrev: string; score?: number; logo?: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SpotlightGames({ games, predMap, oddsMap }: {
  games: Game[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predMap: Record<string | number, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oddsMap: Record<string | number, any[]>;
}) {
  const [expanded, setExpanded] = useState(false);

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

  // Sort by rivalry/division score desc, keeping game order as tiebreaker
  const sorted = [...games].sort((a, b) =>
    gameScore(b.homeTeam.abbrev, b.awayTeam.abbrev) -
    gameScore(a.homeTeam.abbrev, a.awayTeam.abbrev)
  );

  const spotlight = sorted.slice(0, 2);
  const remaining = sorted.slice(2);
  // Default: show 3 compact rows; expand to all
  const compactVisible = expanded ? remaining : remaining.slice(0, 3);
  const canExpand = remaining.length > 3;

  return (
    <div className="rounded-xl border p-4 flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
          🏒 Tonight&apos;s Games
        </h2>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          {games.length} games
        </span>
      </div>

      {/* Spotlight GameCards */}
      <div className={`grid gap-3 mb-3 ${spotlight.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {spotlight.map(g => {
          const label = matchupLabel(g.homeTeam.abbrev, g.awayTeam.abbrev);
          return (
            <div key={g.id} className="flex flex-col gap-1">
              {label && (
                <div className="text-xs font-semibold px-1" style={{ color: 'var(--amber)' }}>
                  {label}
                </div>
              )}
              <GameCard
                game={g}
                prediction={predMap[g.id]}
                odds={oddsMap[g.id]}
              />
            </div>
          );
        })}
      </div>

      {/* Remaining games — compact rows */}
      {remaining.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {compactVisible.map(g => {
            const isLive  = g.gameState === 'LIVE' || g.gameState === 'CRIT';
            const isFinal = g.gameState === 'FINAL' || g.gameState === 'OFF';
            const time = new Date(g.startTimeUTC).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
            });
            const date = g.gameDate ?? g.startTimeUTC?.slice(0, 10);
            const pred = predMap[g.id];
            const favAbbrev = pred
              ? (pred.home_win_probability >= pred.away_win_probability
                  ? g.homeTeam.abbrev
                  : g.awayTeam.abbrev)
              : null;
            const favPct = pred
              ? Math.round(Math.max(pred.home_win_probability, pred.away_win_probability) * 100)
              : null;

            return (
              <Link key={g.id}
                href={gameUrl(g.id, g.awayTeam.abbrev, g.homeTeam.abbrev, date)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg)', border: `1px solid ${isLive ? 'var(--red)' : 'var(--border)'}` }}>

                {/* Status / time */}
                <div className="text-xs font-mono w-16 text-center flex-shrink-0"
                  style={{ color: isLive ? 'var(--red)' : isFinal ? 'var(--text)' : 'var(--neon)' }}>
                  {isLive ? '● LIVE' : isFinal ? 'FINAL' : time + ' ET'}
                </div>

                {/* Teams */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1">
                    <img src={`https://assets.nhle.com/logos/nhl/svg/${g.awayTeam.abbrev}_light.svg`}
                      alt={g.awayTeam.abbrev} className="w-4 h-4 object-contain" loading="lazy" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                      {g.awayTeam.abbrev}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text)' }}>@</span>
                  <div className="flex items-center gap-1">
                    <img src={`https://assets.nhle.com/logos/nhl/svg/${g.homeTeam.abbrev}_light.svg`}
                      alt={g.homeTeam.abbrev} className="w-4 h-4 object-contain" loading="lazy" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                      {g.homeTeam.abbrev}
                    </span>
                  </div>
                </div>

                {/* Scores or prediction */}
                <div className="text-right flex-shrink-0">
                  {(isFinal || isLive) && g.awayTeam.score !== undefined && g.homeTeam.score !== undefined ? (
                    <span className="text-sm font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
                      {g.awayTeam.score}–{g.homeTeam.score}
                    </span>
                  ) : favAbbrev ? (
                    <span className="text-xs font-mono" style={{ color: 'var(--neon)' }}>
                      {favAbbrev} {favPct}%
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}

          {canExpand && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-1 w-full text-xs py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              {expanded ? '↑ Show less' : `↓ ${remaining.length - 3} more games`}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            {games.length} game{games.length !== 1 ? 's' : ''} tonight
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
