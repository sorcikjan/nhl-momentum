import Link from 'next/link';
import { ppmToHeat, heatColor, heatLabel } from '@/lib/heat';
import { playerUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Player = any;

const rankColor = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent';
  if (rank <= 3) return 'text-amber-400';
  return 'text-slate-600';
};

const rankBorder = (rank: number) => {
  if (rank === 1) return 'border-l-2 border-orange-500';
  if (rank === 2) return 'border-l-2 border-amber-400';
  if (rank === 3) return 'border-l-2 border-yellow-300';
  return 'border-l-2 border-transparent';
};

export function BurningSection({ players }: { players: Player[] }) {
  if (!players.length) return null;

  const maxPpm = Math.max(...players.map((p: Player) => p.momentum_ppm ?? 0), 0.001);

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-bright)' }}>
          🔥 On Fire
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
          Highest momentum PPM right now
        </p>
      </div>

      <div className="space-y-1">
        {players.slice(0, 10).map((p: Player, i: number) => {
          const rank = i + 1;
          const ppm = p.momentum_ppm ?? 0;
          const heat = ppmToHeat(ppm);
          const color = heatColor(heat);
          const label = heatLabel(heat);
          const barWidth = maxPpm > 0 ? Math.round((ppm / maxPpm) * 100) : 0;

          return (
            <Link
              key={p.player_id}
              href={playerUrl(p.player_id, p.players?.first_name, p.players?.last_name)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors ${rankBorder(rank)}`}
              style={{ background: 'var(--bg-card)' }}
            >
              {/* Rank */}
              <span className={`w-8 text-right font-black text-3xl leading-none shrink-0 ${rankColor(rank)}`}>
                {rank}
              </span>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-bright)' }}>
                    {p.players?.first_name} {p.players?.last_name}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono shrink-0"
                    style={{ background: 'var(--border)', color: 'var(--text)' }}>
                    {p.players?.teams?.abbrev ?? '—'}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: 'var(--silver)' }}>
                    {p.players?.position_code}
                  </span>
                  {label && (
                    <span className="text-xs font-bold shrink-0" style={{ color }}>
                      {label}
                    </span>
                  )}
                </div>

                {/* Heat bar */}
                <div className="mt-1.5 h-1 rounded-full w-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barWidth}%`, background: color }}
                  />
                </div>
              </div>

              {/* PPM + energy */}
              <div className="text-right shrink-0">
                <div className="text-sm font-bold tabular-nums" style={{ color }}>
                  {ppm.toFixed(4)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                  ppm
                </div>
              </div>

              {/* Energy dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                title={`Energy: ${p.energy_bar ?? 0}`}
                style={{
                  background: (p.energy_bar ?? 0) >= 70
                    ? 'var(--heat)'
                    : (p.energy_bar ?? 0) >= 40
                    ? 'var(--amber)'
                    : 'var(--silver)',
                }}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
