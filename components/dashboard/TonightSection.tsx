'use client';

import Link from 'next/link';
import { gameUrl } from '@/lib/urls';
import { ppmToHeat, heatBorderColor, heatColor } from '@/lib/heat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;

// Dark split-background colors (for FeaturedGameCard upper half)
export const TEAM_COLORS: Record<string, string> = {
  ANA: '#b5895a', ARI: '#8c2633', UTA: '#1a5276',
  BOS: '#8b6914', BUF: '#003087', CGY: '#8c1c1c',
  CAR: '#7a0000', CHI: '#7a0618', COL: '#4a1726',
  CBJ: '#002654', DAL: '#004a30', DET: '#7a0a14',
  EDM: '#8b3000', FLA: '#041e42', LAK: '#111111',
  MIN: '#0f3022', MTL: '#6e1220', NSH: '#041e42',
  NJD: '#7a0a14', NYI: '#003a6b', NYR: '#00277a',
  OTT: '#7a5c1a', PHI: '#8b2e00', PIT: '#1a1a1a',
  SEA: '#001628', SJS: '#004a50', STL: '#001e6b',
  TBL: '#001a5c', TOR: '#001845', VAN: '#00421e',
  VGK: '#252f34', WSH: '#041e42', WPG: '#041e42',
};

// Bright badge colors for team pills
export const TEAM_BADGE_COLORS: Record<string, string> = {
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

interface WatchPlayer {
  name: string;
  heat: number;
  team: string;
}

function formatTime(utc: string): string {
  try {
    return new Date(utc).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
    });
  } catch { return ''; }
}

function periodLabel(num: number | undefined): string {
  if (num === 1) return '1st';
  if (num === 2) return '2nd';
  if (num === 3) return '3rd';
  if (num === 4) return 'OT';
  if (num === 5) return 'SO';
  return '';
}

// ── Heat badge pill ────────────────────────────────────────────────────────────

function HeatBadge({ heat }: { heat: number }) {
  return (
    <span
      className="text-xs font-mono font-bold px-1 py-0.5 rounded"
      style={{
        background: 'rgba(255,90,36,0.15)',
        color: heatColor(heat),
        border: `1px solid ${heatBorderColor(heat)}`,
        fontSize: '0.6rem',
      }}
    >
      {heat}
    </span>
  );
}

// ── Game row (unified format) ──────────────────────────────────────────────────

function GameRow({
  game,
  pred,
  watchPlayers,
}: {
  game: Game;
  pred: Game;
  watchPlayers?: WatchPlayer[];
}) {
  const away = game.awayTeam?.abbrev ?? '???';
  const home = game.homeTeam?.abbrev ?? '???';
  const isLive = ['LIVE', 'CRIT'].includes(game.gameState);
  const periodNum = game.periodDescriptor?.number as number | undefined;
  const period = periodLabel(periodNum);
  const clock = game.clock?.timeRemaining as string | undefined;
  const awayScore = game.awayTeam?.score ?? null;
  const homeScore = game.homeTeam?.score ?? null;

  const homeProb = pred?.home_win_probability ?? null;
  const awayConf = homeProb != null ? Math.round((1 - homeProb) * 100) : null;
  const homeConf = homeProb != null ? Math.round(homeProb * 100) : null;
  const favorHome = homeProb != null ? homeProb >= 0.5 : null;

  return (
    <Link
      href={gameUrl(game.id, away, home, game.gameDate ?? '')}
      className="block rounded-xl hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-card)', border: `1px solid ${isLive ? 'rgba(255,68,68,0.3)' : 'var(--border)'}` }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">

        {/* Time / status */}
        <div className="flex-shrink-0 w-16">
          {isLive ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold animate-pulse" style={{ color: '#ff4444' }}>● LIVE</span>
              {period && (
                <span className="text-xs font-mono" style={{ color: 'var(--silver)', opacity: 0.6 }}>{period}{clock ? ` · ${clock}` : ''}</span>
              )}
            </div>
          ) : game.startTimeUTC ? (
            <span className="text-xs font-mono" style={{ color: 'var(--silver)', opacity: 0.55 }}>
              {formatTime(game.startTimeUTC)}
            </span>
          ) : null}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`}
            alt={away}
            style={{ width: '28px', height: '28px', flexShrink: 0 }}
          />
          <span className="font-black text-sm" style={{ color: '#fff' }}>{away}</span>
          {isLive && awayScore != null && (
            <span className="font-black text-lg font-mono" style={{ color: '#fff' }}>{awayScore}</span>
          )}
        </div>

        <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>@</span>

        {/* Home team */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`}
            alt={home}
            style={{ width: '28px', height: '28px', flexShrink: 0 }}
          />
          <span className="font-black text-sm" style={{ color: '#fff' }}>{home}</span>
          {isLive && homeScore != null && (
            <span className="font-black text-lg font-mono" style={{ color: '#fff' }}>{homeScore}</span>
          )}
        </div>

        {/* Probability bar */}
        {awayConf != null && homeConf != null && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-mono font-semibold flex-shrink-0"
              style={{ color: favorHome === false ? 'var(--heat)' : 'var(--silver)', fontWeight: favorHome === false ? 700 : 400, minWidth: '32px', textAlign: 'right' }}>
              {awayConf}%
            </span>
            <div className="flex-1 flex rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--border)', minWidth: '60px' }}>
              <div style={{ width: `${awayConf}%`, background: favorHome === false ? 'var(--heat)' : 'rgba(255,255,255,0.18)', height: '100%' }} />
              <div style={{ width: `${homeConf}%`, background: favorHome ? 'var(--heat)' : 'rgba(255,255,255,0.18)', height: '100%' }} />
            </div>
            <span className="text-xs font-mono font-semibold flex-shrink-0"
              style={{ color: favorHome ? 'var(--heat)' : 'var(--silver)', fontWeight: favorHome ? 700 : 400, minWidth: '32px' }}>
              {homeConf}%
            </span>
          </div>
        )}

        {/* WATCH FOR players */}
        {watchPlayers && watchPlayers.length > 0 && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text)', opacity: 0.35 }}>WATCH FOR</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {watchPlayers.map((wp, i) => (
                <div key={i} className="flex items-center gap-1">
                  {i > 0 && <span style={{ color: 'var(--text)', opacity: 0.3 }}>·</span>}
                  <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.6 }}>{wp.name.split(' ').pop()}</span>
                  <HeatBadge heat={wp.heat} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Main Tonight section ──────────────────────────────────────────────────────

export default function TonightSection({
  games,
  predMap,
  oddsMap: _oddsMap,
  watchPlayers,
}: {
  games: Game[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predMap: Record<number, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oddsMap: Record<number, any[]>;
  watchPlayers?: Map<number, WatchPlayer[]>;
}) {
  const upcoming = games.filter((g: Game) => ['FUT', 'PRE', 'LIVE', 'CRIT'].includes(g.gameState));
  if (!upcoming.length) return null;

  // Sort: live first, then by start time
  const sorted = [...upcoming].sort((a, b) => {
    const aLive = ['LIVE', 'CRIT'].includes(a.gameState) ? 1 : 0;
    const bLive = ['LIVE', 'CRIT'].includes(b.gameState) ? 1 : 0;
    if (bLive !== aLive) return bLive - aLive;
    return (a.startTimeUTC ?? '').localeCompare(b.startTimeUTC ?? '');
  });

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            <span style={{ color: 'var(--text-bright)' }}>Tonight&apos;s </span>
            <span style={{ color: 'var(--heat)' }}>slate.</span>
          </h2>
          <p style={{ color: 'var(--silver)', opacity: 0.55, fontSize: '0.78rem', marginTop: '0.25rem' }}>
            {upcoming.length} game{upcoming.length !== 1 ? 's' : ''} on the ice.
          </p>
        </div>
        <a href="/games" className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--heat)' }}>
          FULL SCHEDULE →
        </a>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map(g => (
          <GameRow
            key={g.id}
            game={g}
            pred={predMap[g.id]}
            watchPlayers={watchPlayers?.get(g.id)}
          />
        ))}
      </div>
    </section>
  );
}
