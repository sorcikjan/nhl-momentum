'use client';

import Link from 'next/link';
import { gameUrl } from '@/lib/urls';
import { heatBorderColor, heatColor } from '@/lib/heat';

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

export interface WatchPlayer {
  player_id: number;
  name: string;
  heat: number;
  team: string;
  headshot_url?: string | null;
  position_code?: string;
  season_points?: number;
  season_games?: number;
}

function logoUrl(abbrev: string) {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
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

// ── Probability band — the card header for featured games ──────────────────────
//
// Two flex children whose widths ARE the probabilities, with team colours.
// Favoured side is full saturation; other side is desaturated.

function ProbabilityBand({
  awayAbbrev,
  homeAbbrev,
  awayConf,
  homeConf,
  favoredAbbrev,
}: {
  awayAbbrev: string;
  homeAbbrev: string;
  awayConf: number;
  homeConf: number;
  favoredAbbrev: string | null;
}) {
  const awayColor = TEAM_COLORS[awayAbbrev] ?? '#1a1d26';
  const homeColor = TEAM_COLORS[homeAbbrev] ?? '#1a1d26';
  const awayFavored = favoredAbbrev === awayAbbrev;
  const homeFavored = favoredAbbrev === homeAbbrev;

  return (
    <div style={{ display: 'flex', height: '52px', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
      {/* Away side */}
      <div
        style={{
          flex: awayConf,
          background: awayFavored ? awayColor : `${awayColor}60`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 14,
          minWidth: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl(awayAbbrev)}
          alt={awayAbbrev}
          style={{
            width: 22,
            height: 22,
            flexShrink: 0,
            filter: awayFavored ? 'none' : 'saturate(0.4)',
            outline: awayFavored ? '2px solid var(--heat)' : 'none',
            outlineOffset: '2px',
            borderRadius: '50%',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.75rem', fontWeight: 700, color: awayFavored ? '#fff' : 'rgba(255,255,255,0.45)', lineHeight: 1.1 }}>
            {awayConf}%
          </span>
          {awayFavored && (
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.475rem', color: 'var(--heat)', fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>
              OUR PICK
            </span>
          )}
        </div>
      </div>

      {/* Home side */}
      <div
        style={{
          flex: homeConf,
          background: homeFavored ? homeColor : `${homeColor}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          paddingRight: 14,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.75rem', fontWeight: 700, color: homeFavored ? '#fff' : 'rgba(255,255,255,0.45)', lineHeight: 1.1 }}>
            {homeConf}%
          </span>
          {homeFavored && (
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.475rem', color: 'var(--heat)', fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>
              OUR PICK
            </span>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl(homeAbbrev)}
          alt={homeAbbrev}
          style={{
            width: 22,
            height: 22,
            flexShrink: 0,
            filter: homeFavored ? 'none' : 'saturate(0.4)',
            outline: homeFavored ? '2px solid var(--heat)' : 'none',
            outlineOffset: '2px',
            borderRadius: '50%',
          }}
        />
      </div>
    </div>
  );
}

// ── Single watch-player cell inside a featured card ───────────────────────────

function WatchPlayerCell({ p, alignRight }: { p: WatchPlayer; alignRight?: boolean }) {
  const pts = p.season_points ?? 0;
  const gp = p.season_games ?? 0;
  const credential = gp > 0 ? `${pts}pts · ${gp}GP` : p.position_code ?? '';

  return (
    <div
      className="flex items-center gap-2 rounded-lg"
      style={{
        background: 'rgba(255,255,255,0.04)',
        padding: '6px 8px',
        flexDirection: alignRight ? 'row-reverse' : 'row',
        textAlign: alignRight ? 'right' : 'left',
      }}
    >
      {/* Photo */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
        }}
      >
        {p.headshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.headshot_url}
            alt={p.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-raised)' }} />
        )}
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-bright)', lineHeight: 1.2 }} className="truncate">
          {p.name.split(' ').pop()}
        </div>
        <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--text)', opacity: 0.55, lineHeight: 1.2 }}>
          {p.position_code ? `${p.position_code} · ` : ''}{credential}
        </div>
      </div>
      {/* Heat pill */}
      <HeatBadge heat={p.heat} />
    </div>
  );
}

// ── Featured game card (top 2 watchable games) ────────────────────────────────

function FeaturedGameCard({
  game,
  pred,
  watchPlayers,
  watchability,
}: {
  game: Game;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pred: any;
  watchPlayers?: WatchPlayer[];
  watchability?: number;
}) {
  const away = game.awayTeam?.abbrev ?? '???';
  const home = game.homeTeam?.abbrev ?? '???';
  const isLive = ['LIVE', 'CRIT'].includes(game.gameState);
  const awayScore = game.awayTeam?.score ?? null;
  const homeScore = game.homeTeam?.score ?? null;
  const periodNum = game.periodDescriptor?.number as number | undefined;
  const period = periodLabel(periodNum);
  const clock = game.clock?.timeRemaining as string | undefined;

  const homeProb = pred?.home_win_probability ?? null;
  const awayConf = homeProb != null ? Math.round((1 - homeProb) * 100) : 50;
  const homeConf = homeProb != null ? Math.round(homeProb * 100) : 50;
  const favorHome = homeProb != null ? homeProb >= 0.5 : null;
  const favoredAbbrev = favorHome === true ? home : favorHome === false ? away : null;

  // Split watch players by team (max 3 per side)
  const awayPlayers = (watchPlayers ?? []).filter(p => p.team === away).slice(0, 3);
  const homePlayers = (watchPlayers ?? []).filter(p => p.team === home).slice(0, 3);

  return (
    <Link
      href={gameUrl(game.id, away, home, game.gameDate ?? '')}
      className="block hover:opacity-90 transition-opacity"
      style={{
        background: 'var(--bg-card)',
        border: isLive ? '1px solid rgba(255,68,68,0.35)' : '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Probability band header */}
      {homeProb != null ? (
        <ProbabilityBand
          awayAbbrev={away}
          homeAbbrev={home}
          awayConf={awayConf}
          homeConf={homeConf}
          favoredAbbrev={favoredAbbrev}
        />
      ) : (
        /* Fallback header when no prediction */
        <div
          style={{
            height: 52,
            background: `linear-gradient(90deg, ${TEAM_COLORS[away] ?? '#1a1d26'}80 0%, ${TEAM_COLORS[home] ?? '#1a1d26'}80 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl(away)} alt={away} style={{ width: 24, height: 24, marginRight: 8 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl(home)} alt={home} style={{ width: 24, height: 24 }} />
        </div>
      )}

      {/* Meta row: time, game info, watchability */}
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid var(--border-soft, var(--border))',
          flexWrap: 'wrap',
        }}
      >
        {/* Live indicator or time */}
        {isLive ? (
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.625rem', fontWeight: 700, color: '#ff4444' }}>
            ● LIVE{period ? ` · ${period}` : ''}{clock ? ` · ${clock}` : ''}
            {awayScore != null && homeScore != null && ` · ${away} ${awayScore}–${homeScore} ${home}`}
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            {formatTime(game.startTimeUTC)}
          </span>
        )}

        {/* Spacer */}
        <span style={{ flex: 1 }} />

        {/* Watchability badge */}
        {watchability != null && (
          <span
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.5625rem',
              color: 'var(--gold)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              background: 'rgba(255,181,71,0.1)',
              border: '1px solid rgba(255,181,71,0.25)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            WATCHABILITY {watchability}
          </span>
        )}
      </div>

      {/* Players: 2 columns — away left, home right */}
      {(awayPlayers.length > 0 || homePlayers.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            padding: '10px 12px 12px',
          }}
        >
          {/* Away team players */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5rem', color: 'var(--text)', opacity: 0.45, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>
              {away} · WATCH
            </div>
            {awayPlayers.map(p => (
              <WatchPlayerCell key={p.player_id} p={p} />
            ))}
          </div>
          {/* Home team players */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5rem', color: 'var(--text)', opacity: 0.45, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2, textAlign: 'right' }}>
              {home} · WATCH
            </div>
            {homePlayers.map(p => (
              <WatchPlayerCell key={p.player_id} p={p} alignRight />
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}

// ── Desktop game row (inside single container) ───────────────────────────────

function DesktopGameRow({
  game,
  pred,
  watchPlayers,
  isFirst,
}: {
  game: Game;
  pred: Game;
  watchPlayers?: WatchPlayer[];
  isFirst: boolean;
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

  const topWatchPlayer = watchPlayers?.[0] ?? null;

  return (
    <Link
      href={gameUrl(game.id, away, home, game.gameDate ?? '')}
      className="grid items-center hover:opacity-80 transition-opacity"
      style={{
        gridTemplateColumns: '80px 1fr 220px 180px 24px',
        gap: '16px',
        padding: '18px 24px',
        borderTop: isFirst ? 'none' : '1px solid var(--border)',
        textDecoration: 'none',
      }}
    >
      {/* Time / status */}
      <div className="flex-shrink-0">
        {isLive ? (
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.75rem', fontWeight: 700, color: '#ff4444' }}>● LIVE</span>
            {period && (
              <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--text)', opacity: 0.55 }}>{period}{clock ? ` · ${clock}` : ''}</span>
            )}
          </div>
        ) : (
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.8125rem', color: 'var(--text-bright)', fontWeight: 600 }}>
            {formatTime(game.startTimeUTC)}
          </span>
        )}
      </div>

      {/* Matchup */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`} alt={away} style={{ width: 32, height: 32, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>
          {away}
          {isLive && awayScore != null && <span style={{ fontFamily: 'var(--font-geist-mono), monospace', marginLeft: 6 }}>{awayScore}</span>}
        </span>
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--text)', opacity: 0.4, flexShrink: 0, margin: '0 4px' }}>at</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`} alt={home} style={{ width: 32, height: 32, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>
          {home}
          {isLive && homeScore != null && <span style={{ fontFamily: 'var(--font-geist-mono), monospace', marginLeft: 6 }}>{homeScore}</span>}
        </span>
      </div>

      {/* Probability bar */}
      {awayConf != null && homeConf != null ? (
        <div>
          <div className="flex justify-between mb-1">
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.625rem', color: 'var(--heat)', fontWeight: 700 }}>
              {favorHome === false ? away : home} {favorHome === false ? awayConf : homeConf}%
            </span>
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.625rem', color: 'var(--text)', opacity: 0.55, fontWeight: 600 }}>
              {favorHome === false ? home : away} {favorHome === false ? homeConf : awayConf}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
            <div style={{ flex: favorHome === false ? awayConf : homeConf, background: 'var(--heat)' }} />
            <div style={{ flex: favorHome === false ? homeConf : awayConf, background: 'var(--border)' }} />
          </div>
        </div>
      ) : <div />}

      {/* Watch for */}
      <div>
        <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--text)', opacity: 0.5, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>WATCH FOR</div>
        {topWatchPlayer && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-bright)', fontWeight: 600 }}>
            {topWatchPlayer.name.split(' ').pop()} · <span style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--heat)', fontWeight: 700 }}>{topWatchPlayer.heat}</span>
          </div>
        )}
      </div>

      <span style={{ color: 'var(--text)', opacity: 0.35, fontSize: '1.125rem' }}>›</span>
    </Link>
  );
}

// ── Mobile game card (compact, one per game) ──────────────────────────────────

function MobileGameCard({
  game,
  pred,
}: {
  game: Game;
  pred: Game;
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
      className="block rounded-[10px] hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '12px' }}
    >
      {/* Top row: time + prediction */}
      <div className="flex items-center gap-2 mb-2.5">
        {isLive ? (
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.625rem', fontWeight: 700, color: '#ff4444' }}>
            ● LIVE{period ? ` · ${period}` : ''}{clock ? ` · ${clock}` : ''}
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.625rem', color: 'var(--text)', opacity: 0.6, fontWeight: 600 }}>
            {formatTime(game.startTimeUTC)}
          </span>
        )}
        <span style={{ flex: 1 }} />
        {awayConf != null && homeConf != null && (
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color: 'var(--heat)', fontWeight: 700 }}>
            {favorHome === false ? away : home} {favorHome === false ? awayConf : homeConf}%
          </span>
        )}
      </div>
      {/* Matchup row */}
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`} alt={away} style={{ width: 26, height: 26, flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.8125rem', color: '#fff' }}>
          {away}{isLive && awayScore != null ? ` ${awayScore}` : ''}
        </span>
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.625rem', color: 'var(--text)', opacity: 0.35 }}>@</span>
        <span style={{ flex: 1, textAlign: 'right', fontWeight: 700, fontSize: '0.8125rem', color: '#fff' }}>
          {isLive && homeScore != null ? `${homeScore} ` : ''}{home}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`} alt={home} style={{ width: 26, height: 26, flexShrink: 0 }} />
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
  watchabilityMap,
  excludeGameId,
}: {
  games: Game[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predMap: Record<number, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oddsMap: Record<number, any[]>;
  watchPlayers?: Map<number, WatchPlayer[]>;
  watchabilityMap?: Map<number, number>;
  excludeGameId?: number;
}) {
  const upcoming = games
    .filter((g: Game) => ['FUT', 'PRE', 'LIVE', 'CRIT'].includes(g.gameState))
    .filter((g: Game) => g.id !== excludeGameId);
  if (!upcoming.length) return null;

  // Sort: live first, then by watchability desc, then by start time
  const sorted = [...upcoming].sort((a, b) => {
    const aLive = ['LIVE', 'CRIT'].includes(a.gameState) ? 1 : 0;
    const bLive = ['LIVE', 'CRIT'].includes(b.gameState) ? 1 : 0;
    if (bLive !== aLive) return bLive - aLive;
    // Sort non-live by watchability desc
    if (!aLive && !bLive) {
      const wa = watchabilityMap?.get(a.id) ?? 0;
      const wb = watchabilityMap?.get(b.id) ?? 0;
      if (wb !== wa) return wb - wa;
    }
    return (a.startTimeUTC ?? '').localeCompare(b.startTimeUTC ?? '');
  });

  // Top 2 non-live upcoming games get the featured card treatment.
  // Live games always use the compact row format.
  const upcomingOnly = sorted.filter(g => !['LIVE', 'CRIT'].includes(g.gameState));
  const liveGames = sorted.filter(g => ['LIVE', 'CRIT'].includes(g.gameState));
  const featuredGames = upcomingOnly.slice(0, 2);
  const featuredIds = new Set(featuredGames.map(g => g.id));
  const compactGames = [...liveGames, ...upcomingOnly.filter(g => !featuredIds.has(g.id))];

  return (
    <section>
      {/* Section header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--heat)', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: '6px' }}>
            TONIGHT · {upcoming.length} GAME{upcoming.length !== 1 ? 'S' : ''}
          </p>
          <h2 style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03125rem', lineHeight: 1.05, color: 'var(--text-bright)' }}>
            What&apos;s on tonight.
          </h2>
        </div>
        <Link href="/games" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--heat)', fontWeight: 600, flexShrink: 0 }}>
          FULL SCHEDULE →
        </Link>
      </div>

      {/* Desktop: featured cards + compact rows */}
      <div className="hidden md:flex flex-col gap-3">
        {/* Featured game cards (top 2 by watchability) */}
        {featuredGames.length > 0 && (
          <div className={`grid gap-3 ${featuredGames.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {featuredGames.map(g => (
              <FeaturedGameCard
                key={g.id}
                game={g}
                pred={predMap[g.id]}
                watchPlayers={watchPlayers?.get(g.id)}
                watchability={watchabilityMap?.get(g.id)}
              />
            ))}
          </div>
        )}

        {/* Rest of slate: compact rows */}
        {compactGames.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {compactGames.map((g, i) => (
              <DesktopGameRow
                key={g.id}
                game={g}
                pred={predMap[g.id]}
                watchPlayers={watchPlayers?.get(g.id)}
                isFirst={i === 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile: individual compact cards for all games */}
      <div className="md:hidden flex flex-col gap-2">
        {sorted.map(g => (
          <MobileGameCard
            key={g.id}
            game={g}
            pred={predMap[g.id]}
          />
        ))}
      </div>
    </section>
  );
}
