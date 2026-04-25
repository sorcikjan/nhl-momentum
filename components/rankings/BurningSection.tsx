import Link from 'next/link';
import { ppmToHeat, heatColor } from '@/lib/heat';
import { playerUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Player = any;

const rankStyle = (rank: number): { number: string; accent: string } => {
  if (rank === 1) return { number: 'text-3xl font-black text-orange-500', accent: 'border-l-2 border-orange-500' };
  if (rank === 2) return { number: 'text-2xl font-black text-amber-400', accent: 'border-l-2 border-amber-400' };
  if (rank === 3) return { number: 'text-2xl font-bold text-yellow-300', accent: 'border-l-2 border-yellow-300' };
  return { number: 'text-xl font-bold text-slate-600', accent: 'border-l-2 border-transparent' };
};

export function BurningSection({ players }: { players: Player[] }) {
  const top10 = players.slice(0, 10);
  if (!top10.length) return null;

  const topHeat = ppmToHeat(top10[0]?.momentum_ppm ?? 0);

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>
          🔥 Who&apos;s Burning?
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
          Last 5 games, scored 0–100. Higher = hotter right now.
        </p>
      </div>

      <div className="space-y-1">
        {top10.map((p: Player, i: number) => {
          const rank = i + 1;
          const heat = ppmToHeat(p.momentum_ppm ?? 0);
          const color = heatColor(heat);
          const barWidth = topHeat > 0 ? Math.round((heat / topHeat) * 100) : 0;
          const { number: rankClass, accent } = rankStyle(rank);
          const vsAvg = p.season_ppm > 0
            ? Math.round(((p.momentum_ppm - p.season_ppm) / p.season_ppm) * 100)
            : 0;

          return (
            <Link
              key={p.player_id}
              href={playerUrl(p.player_id, p.players?.first_name, p.players?.last_name)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors ${accent}`}
              style={{ background: 'var(--bg-card)' }}
            >
              {/* Rank */}
              <span className={`w-8 text-right shrink-0 leading-none ${rankClass}`}>
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
                </div>

                {/* Heat bar + vs-avg label */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barWidth}%`, background: color }}
                    />
                  </div>
                  {vsAvg !== 0 && (
                    <span className="text-xs font-mono shrink-0" style={{ color: vsAvg > 0 ? color : 'var(--silver)' }}>
                      {vsAvg > 0 ? '+' : ''}{vsAvg}% vs avg
                    </span>
                  )}
                </div>
              </div>

              {/* Heat score */}
              <div className="text-right shrink-0">
                <div className="text-xl font-black tabular-nums" style={{ color }}>
                  {heat}
                </div>
                <div className="text-xs" style={{ color: 'var(--text)' }}>heat</div>
              </div>

              {/* Energy dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                title={`Energy: ${p.energy_bar ?? 0}`}
                style={{
                  background: (p.energy_bar ?? 0) >= 70 ? 'var(--heat)'
                    : (p.energy_bar ?? 0) >= 40 ? 'var(--amber)'
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
