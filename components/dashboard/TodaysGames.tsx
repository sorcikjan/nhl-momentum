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
  if (!games.length) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="text-2xl mb-2">🏒</div>
        <p className="text-sm" style={{ color: 'var(--text)' }}>No games scheduled today</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--silver)' }}>
        🏒 Today&apos;s Games
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {games.map((g) => {
          const time = new Date(g.startTimeUTC).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
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
              <div className="text-xs font-mono font-bold w-12 text-center flex-shrink-0"
                style={{ color }}>
                {isLive ? '● ' : ''}{label}
                {!isLive && !isFinal && <div className="font-normal" style={{ color: 'var(--text)' }}>{time}</div>}
              </div>

              {/* Matchup */}
              <div className="flex-1 flex flex-col gap-1">
                {[g.awayTeam, g.homeTeam].map((team, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={team.logo || `https://assets.nhle.com/logos/nhl/svg/${team.abbrev}_light.svg`}
                        alt={team.abbrev} className="w-5 h-5 object-contain flex-shrink-0" />
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
    </div>
  );
}
