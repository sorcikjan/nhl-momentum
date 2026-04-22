'use client';

import Link from 'next/link';
import { gameUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;

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

// ── Split-color featured game card ────────────────────────────────────────────

function FeaturedGameCard({ game, pred }: { game: Game; pred: Game }) {
  const away = game.awayTeam?.abbrev ?? '???';
  const home = game.homeTeam?.abbrev ?? '???';
  const awayColor = TEAM_COLORS[away] ?? '#1a1f2e';
  const homeColor = TEAM_COLORS[home] ?? '#1a1f2e';
  const homeProb = pred?.home_win_probability ?? 0.5;
  const awayConf = Math.round((1 - homeProb) * 100);
  const homeConf = Math.round(homeProb * 100);
  const isRivalry = RIVALRY_PAIRS.has(`${home}-${away}`);
  const isLive = ['LIVE', 'CRIT'].includes(game.gameState);

  return (
    <Link href={gameUrl(game.id, away, home, game.gameDate ?? '')}
      className="block rounded-2xl overflow-hidden hover:opacity-90 transition-opacity"
      style={{ height: '130px', position: 'relative' }}>

      {/* Split background */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" style={{ background: awayColor }} />
        <div className="flex-1" style={{ background: homeColor }} />
      </div>

      {/* Dark vignette centre */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.3) 100%)' }} />

      {/* Confidence bars at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex">
        <div style={{ width: `${awayConf}%`, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ width: `${homeConf}%`, background: 'rgba(255,255,255,0.25)' }} />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-between px-5">
        {/* Away team */}
        <div className="flex flex-col items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://assets.nhle.com/logos/nhl/svg/${away}_light.svg`} alt={away}
            className="w-8 h-8 mb-1 drop-shadow-lg" />
          <span className="text-xl font-black" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{away}</span>
          <span className="text-sm font-mono font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{awayConf}%</span>
        </div>

        {/* Centre info */}
        <div className="flex flex-col items-center gap-1">
          {isLive
            ? <span className="text-xs font-bold animate-pulse" style={{ color: '#ff4444' }}>● LIVE</span>
            : isRivalry
              ? <span className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ background: 'rgba(249,115,22,0.3)', color: 'var(--heat)', border: '1px solid rgba(249,115,22,0.4)' }}>
                  RIVALRY
                </span>
              : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>tonight</span>
          }
          {!isLive && game.startTimeUTC && (
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {formatTime(game.startTimeUTC)}
            </span>
          )}
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>vs</span>
        </div>

        {/* Home team */}
        <div className="flex flex-col items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://assets.nhle.com/logos/nhl/svg/${home}_light.svg`} alt={home}
            className="w-8 h-8 mb-1 drop-shadow-lg" />
          <span className="text-xl font-black" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{home}</span>
          <span className="text-sm font-mono font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{homeConf}%</span>
        </div>
      </div>
    </Link>
  );
}

// ── Compact prediction row ────────────────────────────────────────────────────

function PredictionRow({ game, pred }: { game: Game; pred: Game }) {
  const away = game.awayTeam?.abbrev ?? '???';
  const home = game.homeTeam?.abbrev ?? '???';
  const homeProb = pred?.home_win_probability ?? null;
  const awayConf = homeProb != null ? Math.round((1 - homeProb) * 100) : null;
  const homeConf = homeProb != null ? Math.round(homeProb * 100) : null;
  const favorHome = homeProb != null ? homeProb >= 0.5 : null;
  const isLive = ['LIVE', 'CRIT'].includes(game.gameState);
  const isRivalry = RIVALRY_PAIRS.has(`${home}-${away}`);

  return (
    <Link href={gameUrl(game.id, away, home, game.gameDate ?? '')}
      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-card)', border: `1px solid ${isRivalry ? 'rgba(249,115,22,0.3)' : 'var(--border)'}` }}>

      {isLive && <span className="text-xs animate-pulse flex-shrink-0" style={{ color: 'var(--red)' }}>●</span>}

      {/* Away */}
      <span className="text-xs font-mono w-8 flex-shrink-0"
        style={{ color: favorHome === false ? 'var(--text-bright)' : 'var(--text)', fontWeight: favorHome === false ? 700 : 400 }}>
        {away}
      </span>

      {/* Confidence bar */}
      {homeConf != null && (
        <div className="flex-1 flex items-center h-1.5 rounded-full overflow-hidden mx-1"
          style={{ background: 'var(--border)' }}>
          <div style={{
            width: `${awayConf}%`,
            background: favorHome === false ? 'var(--heat)' : 'var(--silver)',
            height: '100%',
            opacity: favorHome === false ? 1 : 0.4,
          }} />
          <div style={{
            width: `${homeConf}%`,
            background: favorHome ? 'var(--heat)' : 'var(--silver)',
            height: '100%',
            opacity: favorHome ? 1 : 0.4,
          }} />
        </div>
      )}
      {homeConf == null && <div className="flex-1" />}

      {/* Home */}
      <span className="text-xs font-mono w-8 flex-shrink-0 text-right"
        style={{ color: favorHome ? 'var(--text-bright)' : 'var(--text)', fontWeight: favorHome ? 700 : 400 }}>
        {home}
      </span>

      {/* Win % of favoured */}
      {homeConf != null && (
        <span className="text-xs font-mono w-8 flex-shrink-0 text-right" style={{ color: 'var(--heat)' }}>
          {Math.max(awayConf ?? 0, homeConf)}%
        </span>
      )}

      {/* Time */}
      {!isLive && game.startTimeUTC && (
        <span className="text-xs flex-shrink-0 ml-1" style={{ color: 'var(--silver)', opacity: 0.5 }}>
          {formatTime(game.startTimeUTC)}
        </span>
      )}
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

  // Sort: live first, then by rivalry, then by confidence spread (most certain = least interesting)
  const sorted = [...upcoming].sort((a, b) => {
    const aLive = ['LIVE', 'CRIT'].includes(a.gameState) ? 1 : 0;
    const bLive = ['LIVE', 'CRIT'].includes(b.gameState) ? 1 : 0;
    if (bLive !== aLive) return bLive - aLive;
    const aRiv = RIVALRY_PAIRS.has(`${a.homeTeam?.abbrev}-${a.awayTeam?.abbrev}`) ? 1 : 0;
    const bRiv = RIVALRY_PAIRS.has(`${b.homeTeam?.abbrev}-${b.awayTeam?.abbrev}`) ? 1 : 0;
    return bRiv - aRiv;
  });

  const [featured, ...rest] = sorted;
  const featuredPred = predMap[featured?.id];

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)', opacity: 0.5 }}>
          Tonight&apos;s slate
        </h2>
        <span className="text-xs" style={{ color: 'var(--silver)' }}>
          {upcoming.length} game{upcoming.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {featured && <FeaturedGameCard game={featured} pred={featuredPred} />}
        {rest.map(g => (
          <PredictionRow key={g.id} game={g} pred={predMap[g.id]} />
        ))}
      </div>
    </section>
  );
}
