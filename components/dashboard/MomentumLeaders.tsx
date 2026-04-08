import Link from 'next/link';
import { playerUrl } from '@/lib/urls';

interface Player {
  player_id: number;
  momentum_ppm: number;
  momentum_rank: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    teams: { abbrev: string };
  };
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function MomentumLeaders({
  players,
  lastUpdated,
}: {
  players: Player[];
  lastUpdated?: string | null;
}) {
  return (
    <div className="rounded-xl border p-4 flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--neon)' }}>
          ⚡ Momentum Leaders
        </h2>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--neon-glow)', color: 'var(--neon)' }}>
          Last 5 Games
        </span>
      </div>
      <p className="text-xs mb-2" style={{ color: 'var(--text)' }}>
        Top skaters by PPM (Points Per Momentum) — a score of how much they&apos;ve produced in their last 5 games.
      </p>

      {lastUpdated && (
        <p className="text-xs mb-3" style={{ color: 'var(--text)', opacity: 0.7 }}>
          Updated {relativeTime(lastUpdated)}
        </p>
      )}

      <div className="flex flex-col gap-2 flex-1">
        {players.map((p, i) => {
          const name = `${p.players.first_name} ${p.players.last_name}`;
          const ppm = p.momentum_ppm?.toFixed(4) ?? '—';
          return (
            <Link key={p.player_id}
              href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className="text-xs w-5 text-center font-mono font-bold" style={{ color: 'var(--neon)' }}>
                {i + 1}
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                {p.players.headshot_url
                  ? <img src={p.players.headshot_url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                  : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text)' }}>
                      {p.players.first_name[0]}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-bright)' }}>{name}</div>
                <div className="text-xs" style={{ color: 'var(--text)' }}>
                  {p.players.teams.abbrev} · {p.players.position_code}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono font-semibold" style={{ color: 'var(--neon)' }}>{ppm}</div>
                <div className="text-xs" style={{ color: 'var(--text)' }}>PPM</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            Showing top {players.length}
          </span>
          <Link href="/rankings"
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--neon)' }}>
            View all rankings →
          </Link>
        </div>
      </div>
    </div>
  );
}
