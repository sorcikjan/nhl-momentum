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

export default function MomentumLeaders({ players }: { players: Player[] }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--neon)' }}>
          ⚡ Momentum Leaders
        </h2>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--neon-glow)', color: 'var(--neon)' }}>
          Last 5 Games
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {players.map((p, i) => {
          const name = `${p.players.first_name} ${p.players.last_name}`;
          const ppm = p.momentum_ppm?.toFixed(4) ?? '—';
          return (
            <Link key={p.player_id}
              href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className="text-xs w-5 text-center font-mono" style={{ color: 'var(--text)' }}>
                {i + 1}
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                {p.players.headshot_url
                  ? <img src={p.players.headshot_url} alt={name} className="w-full h-full object-cover" />
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
    </div>
  );
}
