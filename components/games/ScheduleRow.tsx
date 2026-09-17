import Link from 'next/link';
import { gameUrl } from '@/lib/urls';
import HeatBadge from '@/components/ui/HeatBadge';

interface Team {
  id: number;
  abbrev: string;
  commonName?: { default: string };
  score?: number;
  logo?: string;
}

interface Game {
  id: number;
  startTimeUTC: string;
  gameDate?: string;
  gameState: string;
  homeTeam: Team;
  awayTeam: Team;
}

interface Prediction {
  home_win_probability: number;
  away_win_probability: number;
}

const logoUrl = (abbrev: string, logo?: string) => logo || `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;

export default function ScheduleRow({
  game, prediction, watchPlayer, watchability, recapHref,
}: {
  game: Game;
  prediction?: Prediction;
  watchPlayer?: { name: string; teamAbbrev: string; heat: number } | null;
  watchability?: number | null;
  recapHref?: string | null;
}) {
  const isLive  = game.gameState === 'LIVE' || game.gameState === 'CRIT';
  const isFinal = game.gameState === 'FINAL' || game.gameState === 'OFF';
  const date = game.gameDate ?? game.startTimeUTC?.slice(0, 10);
  const time = new Date(game.startTimeUTC).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

  const homeFavored = prediction ? prediction.home_win_probability >= prediction.away_win_probability : null;
  const pickAbbrev = prediction ? (homeFavored ? game.homeTeam.abbrev : game.awayTeam.abbrev) : null;
  const pickPct = prediction ? Math.round(Math.max(prediction.home_win_probability, prediction.away_win_probability) * 100) : null;

  return (
    <Link
      href={gameUrl(game.id, game.awayTeam.abbrev, game.homeTeam.abbrev, date)}
      className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-6 px-4 py-3.5 border-b hover:bg-[var(--bg-hover)] transition-colors"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Time / status */}
      <div className="w-16 flex-shrink-0 text-xs font-mono font-semibold" style={{ color: isLive ? 'var(--heat)' : isFinal ? 'var(--text)' : 'var(--text-bright)' }}>
        {isLive ? '● LIVE' : isFinal ? 'FINAL' : time}
      </div>

      {/* Matchup */}
      <div className="flex items-center gap-2 flex-1 min-w-0" style={{ minWidth: 180 }}>
        <img src={logoUrl(game.awayTeam.abbrev, game.awayTeam.logo)} alt={game.awayTeam.abbrev} className="w-6 h-6 object-contain flex-shrink-0" />
        <span className="font-semibold text-sm" style={{ color: 'var(--text-bright)' }}>{game.awayTeam.abbrev}</span>
        {isFinal || isLive ? (
          <span className="font-mono text-sm font-bold mx-1" style={{ color: 'var(--text-bright)' }}>
            {game.awayTeam.score} – {game.homeTeam.score}
          </span>
        ) : (
          <span className="text-xs mx-1" style={{ color: 'var(--text)', opacity: 0.6 }}>at</span>
        )}
        <span className="font-semibold text-sm" style={{ color: 'var(--text-bright)' }}>{game.homeTeam.abbrev}</span>
        <img src={logoUrl(game.homeTeam.abbrev, game.homeTeam.logo)} alt={game.homeTeam.abbrev} className="w-6 h-6 object-contain flex-shrink-0" />
      </div>

      {/* Our pick */}
      <div className="w-32 flex-shrink-0">
        {pickAbbrev && pickPct != null ? (
          <div>
            <div className="text-xs font-mono">
              <span style={{ color: 'var(--text)', opacity: 0.6 }}>PICK </span>
              <span className="font-bold" style={{ color: 'var(--heat)' }}>{pickAbbrev} {pickPct}%</span>
            </div>
            <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${pickPct}%`, background: 'var(--heat)' }} />
            </div>
          </div>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>No pick yet</span>
        )}
      </div>

      {/* Watch for */}
      <div className="w-40 flex-shrink-0 hidden sm:block">
        {watchPlayer ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: 'var(--text)', opacity: 0.6 }}>Watch</span>
            <span className="font-semibold truncate" style={{ color: 'var(--text-bright)' }}>{watchPlayer.name}</span>
            <HeatBadge heat={watchPlayer.heat} size="sm" />
          </div>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.3 }}>—</span>
        )}
      </div>

      {/* Watchability (upcoming) or Recap link (final) */}
      <div className="w-24 flex-shrink-0 text-right">
        {isFinal && recapHref ? (
          <span className="text-xs font-semibold" style={{ color: 'var(--heat)' }}>Recap →</span>
        ) : !isFinal && watchability != null ? (
          <div>
            <span className="text-lg font-bold font-mono" style={{ color: 'var(--heat)' }}>{watchability}</span>
            <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.5 }}>/100</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
