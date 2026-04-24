'use client';

import Link from 'next/link';
import { gameUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;

// Dark split-background colors (for FeaturedGameCard upper half)
const TEAM_COLORS: Record<string, string> = {
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

const RIVALRY_PAIRS = new Set([
  'BOS-TOR','TOR-BOS','MTL-TOR','TOR-MTL','MTL-BOS','BOS-MTL',
  'NYR-NYI','NYI-NYR','PHI-PIT','PIT-PHI','EDM-CGY','CGY-EDM',
  'FLA-TBL','TBL-FLA','COL-DAL','DAL-COL','VGK-EDM','EDM-VGK',
  'WSH-PIT','PIT-WSH','DET-CHI','CHI-DET','BOS-FLA','FLA-BOS',
]);

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

// Small rounded team badge pill
function TeamBadge({ abbrev }: { abbrev: string }) {
  return (
    <span style={{
      background: TEAM_BADGE_COLORS[abbrev] ?? '#333',
      color: '#fff',
      padding: '2px 6px',
      fontSize: '0.65rem',
      fontWeight: 700,
      borderRadius: '4px',
      lineHeight: 1,
      flexShrink: 0,
      display: 'inline-block',
    }}>
      {abbrev}
    </span>
  );
}

// ── 1. LiveGameCard ────────────────────────────────────────────────────────────

function LiveGameCard({ game, pred }: { game: Game; pred: Game }) {
  const away = game.awayTeam?.abbrev ?? '???';
  const home = game.homeTeam?.abbrev ?? '???';
  const awayScore = game.awayTeam?.score ?? 0;
  const homeScore = game.homeTeam?.score ?? 0;
  const periodNum = game.periodDescriptor?.number as number | undefined;
  const period = periodLabel(periodNum);
  const clock = game.clock?.timeRemaining as string | undefined;
  const homeProb = pred?.home_win_probability ?? null;
  const awayConf = homeProb != null ? Math.round((1 - homeProb) * 100) : null;
  const homeConf = homeProb != null ? Math.round(homeProb * 100) : null;

  const leading = awayScore > homeScore ? away : home;
  const leadScore = Math.max(awayScore, homeScore);
  const trailScore = Math.min(awayScore, homeScore);
  const trailing = awayScore > homeScore ? home : away;

  let blurb = '';
  if (period) {
    if (awayScore === homeScore) {
      blurb = `Tied at ${awayScore} after ${period}.`;
    } else {
      blurb = `${leading} lead ${leadScore}–${trailScore} after ${period}.`;
    }
  }

  return (
    <Link
      href={gameUrl(game.id, away, home, game.gameDate ?? '')}
      className="block rounded-2xl hover:opacity-90 transition-opacity"
      style={{
        background: '#0a0a0f',
        border: '1px solid rgba(255,68,68,0.25)',
        borderRadius: '1rem',
        overflow: 'hidden',
      }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold animate-pulse" style={{ color: '#ff4444' }}>● LIVE</span>
          {period && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--silver)' }}>{period}</span>
            </>
          )}
          {clock && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>·</span>
              <span className="text-xs font-mono" style={{ color: 'var(--silver)' }}>{clock}</span>
            </>
          )}
        </div>
        {awayConf != null && homeConf != null && (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            was {awayConf}/{homeConf} pre-game
          </span>
        )}
      </div>

      {/* Score row */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Away */}
        <div className="flex items-center gap-2">
          <TeamBadge abbrev={away} />
          <span className="text-2xl font-black" style={{ color: '#fff' }}>{awayScore}</span>
        </div>

        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>at</span>

        {/* Home */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black" style={{ color: '#fff' }}>{homeScore}</span>
          <TeamBadge abbrev={home} />
        </div>
      </div>

      {/* Status blurb */}
      {blurb && (
        <div
          className="px-4 py-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs" style={{ color: 'var(--silver)' }}>{blurb}</span>
        </div>
      )}
    </Link>
  );
}

// ── 2. FeaturedGameCard ────────────────────────────────────────────────────────

function FeaturedGameCard({ game, pred }: { game: Game; pred: Game }) {
  const away = game.awayTeam?.abbrev ?? '???';
  const home = game.homeTeam?.abbrev ?? '???';
  const awayColor = TEAM_COLORS[away] ?? '#1a1f2e';
  const homeColor = TEAM_COLORS[home] ?? '#1a1f2e';
  const homeProb = pred?.home_win_probability ?? 0.5;
  const awayConf = Math.round((1 - homeProb) * 100);
  const homeConf = Math.round(homeProb * 100);
  const isRivalry = RIVALRY_PAIRS.has(`${home}-${away}`);
  const favorHome = homeProb >= 0.5;
  const pickAbbrev = favorHome ? home : away;
  const pickConf = favorHome ? homeConf : awayConf;

  return (
    <Link
      href={gameUrl(game.id, away, home, game.gameDate ?? '')}
      className="block rounded-2xl overflow-hidden hover:opacity-90 transition-opacity"
    >
      {/* Upper split section — 130px */}
      <div style={{ height: '130px', position: 'relative' }}>
        {/* Split background */}
        <div className="absolute inset-0 flex">
          <div className="flex-1" style={{ background: awayColor }} />
          <div className="flex-1" style={{ background: homeColor }} />
        </div>

        {/* Dark vignette centre */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.3) 100%)' }}
        />

        {/* Confidence bar at very bottom — heat orange for favored */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <div style={{ width: `${awayConf}%`, background: favorHome === false ? 'var(--heat)' : 'rgba(255,255,255,0.18)' }} />
          <div style={{ width: `${homeConf}%`, background: favorHome ? 'var(--heat)' : 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-between px-5">
          {/* Away team */}
          <div className="flex flex-col items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`}
              alt={away}
              className="w-8 h-8 mb-1 drop-shadow-lg"
            />
            <span className="text-xl font-black" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{away}</span>
            <span className="text-sm font-mono font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{awayConf}%</span>
          </div>

          {/* Centre info */}
          <div className="flex flex-col items-center gap-1">
            {isRivalry
              ? <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ background: 'rgba(249,115,22,0.3)', color: 'var(--heat)', border: '1px solid rgba(249,115,22,0.4)' }}
                >
                  RIVALRY
                </span>
              : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>tonight</span>
            }
            {game.startTimeUTC && (
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {formatTime(game.startTimeUTC)}
              </span>
            )}
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>vs</span>
          </div>

          {/* Home team */}
          <div className="flex flex-col items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`}
              alt={home}
              className="w-8 h-8 mb-1 drop-shadow-lg"
            />
            <span className="text-xl font-black" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{home}</span>
            <span className="text-sm font-mono font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{homeConf}%</span>
          </div>
        </div>
      </div>

      {/* Bottom dark panel */}
      <div
        className="px-4 py-3"
        style={{ background: '#0d0f14', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Row 1: rivalry badge + time */}
        <div className="flex items-center gap-2">
          {isRivalry && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{
                background: 'rgba(249,115,22,0.15)',
                color: 'var(--heat)',
                border: '1px solid rgba(249,115,22,0.3)',
              }}
            >
              🔥 RIVALRY
            </span>
          )}
          {game.startTimeUTC && (
            <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.6 }}>
              {formatTime(game.startTimeUTC)}
            </span>
          )}
        </div>

        {/* Row 2: our pick + confidence */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
              OUR PICK
            </span>
            <TeamBadge abbrev={pickAbbrev} />
            <span className="font-bold text-sm text-white">{pickAbbrev}</span>
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--heat)' }}>
            {pickConf}% confidence
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── 3. RegularGameCard ─────────────────────────────────────────────────────────

function RegularGameCard({ game, pred }: { game: Game; pred: Game }) {
  const away = game.awayTeam?.abbrev ?? '???';
  const home = game.homeTeam?.abbrev ?? '???';
  const homeProb = pred?.home_win_probability ?? null;
  const awayConf = homeProb != null ? Math.round((1 - homeProb) * 100) : null;
  const homeConf = homeProb != null ? Math.round(homeProb * 100) : null;
  const favorHome = homeProb != null ? homeProb >= 0.5 : null;
  const isRivalry = RIVALRY_PAIRS.has(`${home}-${away}`);
  const venue = (game.venue?.default ?? '').slice(0, 28);
  const borderColor = isRivalry ? 'rgba(249,115,22,0.3)' : 'var(--border)';

  return (
    <Link
      href={gameUrl(game.id, away, home, game.gameDate ?? '')}
      className="block rounded-xl hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-card)', border: `1px solid ${borderColor}` }}
    >
      {/* Main row: logo + abbrev + % · bar · % + abbrev + logo */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">

        {/* Away side */}
        <div className="flex items-center gap-2.5 flex-shrink-0" style={{ minWidth: '90px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`}
            alt={away}
            style={{ width: '36px', height: '36px', flexShrink: 0 }}
          />
          <div className="flex flex-col">
            <span className="font-black text-sm leading-none" style={{ color: '#fff' }}>{away}</span>
            {awayConf != null && (
              <span
                className="font-mono text-xs mt-0.5"
                style={{ color: favorHome === false ? 'var(--heat)' : 'var(--silver)', fontWeight: favorHome === false ? 700 : 400 }}
              >
                {awayConf}%
              </span>
            )}
          </div>
        </div>

        {/* Confidence bar — centre */}
        {awayConf != null && homeConf != null ? (
          <div className="flex-1 flex rounded-full overflow-hidden" style={{ height: '5px', background: 'var(--border)' }}>
            <div style={{ width: `${awayConf}%`, background: favorHome === false ? 'var(--heat)' : 'rgba(255,255,255,0.18)', height: '100%', transition: 'width 0.3s' }} />
            <div style={{ width: `${homeConf}%`, background: favorHome ? 'var(--heat)' : 'rgba(255,255,255,0.18)', height: '100%', transition: 'width 0.3s' }} />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Home side */}
        <div className="flex items-center gap-2.5 flex-shrink-0 justify-end" style={{ minWidth: '90px' }}>
          <div className="flex flex-col items-end">
            <span className="font-black text-sm leading-none" style={{ color: '#fff' }}>{home}</span>
            {homeConf != null && (
              <span
                className="font-mono text-xs mt-0.5"
                style={{ color: favorHome ? 'var(--heat)' : 'var(--silver)', fontWeight: favorHome ? 700 : 400 }}
              >
                {homeConf}%
              </span>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`}
            alt={home}
            style={{ width: '36px', height: '36px', flexShrink: 0 }}
          />
        </div>
      </div>

      {/* Bottom row: time + rivalry tag + venue */}
      <div
        className="flex items-center justify-between px-4 pb-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2 pt-2">
          {game.startTimeUTC && (
            <span className="text-xs font-mono" style={{ color: 'var(--silver)', opacity: 0.55 }}>
              {formatTime(game.startTimeUTC)}
            </span>
          )}
          {isRivalry && (
            <span className="text-xs font-semibold" style={{ color: 'var(--heat)' }}>· rivalry</span>
          )}
        </div>
        {venue && (
          <span
            className="text-xs pt-2"
            style={{ color: 'var(--silver)', opacity: 0.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}
          >
            {venue}
          </span>
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
}: {
  games: Game[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predMap: Record<number, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oddsMap: Record<number, any[]>;
}) {
  const upcoming = games.filter((g: Game) => ['FUT', 'PRE', 'LIVE', 'CRIT'].includes(g.gameState));
  if (!upcoming.length) return null;

  // Sort: live first, then by rivalry, then rest
  const sorted = [...upcoming].sort((a, b) => {
    const aLive = ['LIVE', 'CRIT'].includes(a.gameState) ? 1 : 0;
    const bLive = ['LIVE', 'CRIT'].includes(b.gameState) ? 1 : 0;
    if (bLive !== aLive) return bLive - aLive;
    const aRiv = RIVALRY_PAIRS.has(`${a.homeTeam?.abbrev}-${a.awayTeam?.abbrev}`) ? 1 : 0;
    const bRiv = RIVALRY_PAIRS.has(`${b.homeTeam?.abbrev}-${b.awayTeam?.abbrev}`) ? 1 : 0;
    return bRiv - aRiv;
  });

  // Partition into live games and non-live games
  const liveGames = sorted.filter(g => ['LIVE', 'CRIT'].includes(g.gameState));
  const nonLiveGames = sorted.filter(g => !['LIVE', 'CRIT'].includes(g.gameState));
  const [featured, ...rest] = nonLiveGames;

  return (
    <section>
      <div className="mb-3">
        <h2 className="font-editorial" style={{ fontSize: '1.75rem', lineHeight: 1.1, fontWeight: 700 }}>
          <span style={{ color: 'var(--text-bright)' }}>Tonight&apos;s </span>
          <span style={{ color: 'var(--heat)' }}>slate.</span>
        </h2>
        <p style={{ color: 'var(--silver)', opacity: 0.55, fontSize: '0.78rem', marginTop: '0.25rem' }}>
          {upcoming.length} game{upcoming.length !== 1 ? 's' : ''} on the ice.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {liveGames.map(g => (
          <LiveGameCard key={g.id} game={g} pred={predMap[g.id]} />
        ))}
        {featured && <FeaturedGameCard game={featured} pred={predMap[featured.id]} />}
        {rest.map(g => (
          <RegularGameCard key={g.id} game={g} pred={predMap[g.id]} />
        ))}
      </div>
    </section>
  );
}
