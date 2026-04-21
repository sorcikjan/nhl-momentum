'use client';

import Link from 'next/link';
import { gameUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;

const RIVALRY_PAIRS = new Set([
  'BOS-TOR', 'TOR-BOS', 'MTL-TOR', 'TOR-MTL', 'MTL-BOS', 'BOS-MTL',
  'NYR-NYI', 'NYI-NYR', 'NYR-NJD', 'NJD-NYR', 'PHI-PIT', 'PIT-PHI',
  'EDM-CGY', 'CGY-EDM', 'VAN-CGY', 'CGY-VAN', 'VAN-EDM', 'EDM-VAN',
  'CHI-STL', 'STL-CHI', 'DET-CHI', 'CHI-DET',
  'WSH-PIT', 'PIT-WSH', 'FLA-TBL', 'TBL-FLA',
  'COL-DAL', 'DAL-COL', 'VGK-EDM', 'EDM-VGK',
]);

function formatTime(utc: string): string {
  if (!utc) return '';
  const d = new Date(utc);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/New_York' });
}

export default function UpcomingSlate({
  games,
  predMap,
  oddsMap,
}: {
  games: Game[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predMap: Record<number, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oddsMap: Record<number, any[]>;
}) {
  const upcoming = games.filter((g: Game) => ['FUT', 'PRE', 'LIVE', 'CRIT'].includes(g.gameState));

  if (!upcoming.length) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)', opacity: 0.5 }}>
          Tonight
        </h2>
        <span className="text-xs" style={{ color: 'var(--silver)' }}>{upcoming.length} game{upcoming.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col gap-1">
        {upcoming.map((g: Game) => {
          const pred = predMap[g.id];
          const homeProb = pred?.home_win_probability ?? null;
          const awayProb = homeProb != null ? 1 - homeProb : null;
          const isRivalry = RIVALRY_PAIRS.has(`${g.homeTeam?.abbrev}-${g.awayTeam?.abbrev}`);
          const isLive = ['LIVE', 'CRIT'].includes(g.gameState);

          const homeConf = homeProb != null ? Math.round(homeProb * 100) : null;
          const awayConf = awayProb != null ? Math.round(awayProb * 100) : null;
          const favorHome = homeProb != null ? homeProb >= 0.5 : null;

          return (
            <Link
              key={g.id}
              href={gameUrl(g.id, g.awayTeam?.abbrev ?? '', g.homeTeam?.abbrev ?? '', g.gameDate ?? '')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-card)', border: `1px solid ${isRivalry ? 'var(--heat)' : 'var(--border)'}` }}
            >
              {/* Live indicator */}
              {isLive && (
                <span className="text-xs font-bold flex-shrink-0 animate-pulse" style={{ color: 'var(--red)' }}>●</span>
              )}

              {/* Away team */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs font-mono" style={{
                  color: favorHome === false ? 'var(--text-bright)' : 'var(--text)',
                  fontWeight: favorHome === false ? 700 : 400,
                }}>
                  {g.awayTeam?.abbrev}
                </span>
                {awayConf != null && (
                  <span className="text-xs font-mono ml-0.5" style={{ color: favorHome === false ? 'var(--heat)' : 'var(--text)', opacity: favorHome === false ? 1 : 0.5 }}>
                    {awayConf}%
                  </span>
                )}
              </div>

              {/* @ divider + time */}
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.5 }}>@</span>
                {!isLive && g.startTimeUTC && (
                  <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.4, fontSize: '0.6rem' }}>
                    {formatTime(g.startTimeUTC)}
                  </span>
                )}
              </div>

              {/* Home team */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                {homeConf != null && (
                  <span className="text-xs font-mono mr-0.5" style={{ color: favorHome ? 'var(--heat)' : 'var(--text)', opacity: favorHome ? 1 : 0.5 }}>
                    {homeConf}%
                  </span>
                )}
                <span className="text-xs font-mono" style={{
                  color: favorHome ? 'var(--text-bright)' : 'var(--text)',
                  fontWeight: favorHome ? 700 : 400,
                }}>
                  {g.homeTeam?.abbrev}
                </span>
              </div>

              {/* Rivalry badge */}
              {isRivalry && (
                <span className="text-xs flex-shrink-0 ml-1" style={{ color: 'var(--heat)', opacity: 0.8 }}>⚡</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
