import Link from 'next/link';
import { playerUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Player = any;

export function BreakoutSection({ players }: { players: Player[] }) {
  const eligible = players.filter((p: Player) => (p.momentum_games ?? 0) >= 3);
  if (!eligible.length) return null;

  const maxMomentum = Math.max(...eligible.map((p: Player) => p.momentum_ppm ?? 0), 0.001);

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-bright)' }}>
          ↑ Breaking Out
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
          Short-term momentum vs season average — biggest positive gap
        </p>
      </div>

      <div className="space-y-1">
        {eligible.slice(0, 10).map((p: Player, i: number) => {
          const momentumPpm = p.momentum_ppm ?? 0;
          const seasonPpm = p.season_ppm ?? 0;
          const delta = p.breakout_delta ?? (momentumPpm - seasonPpm);

          const seasonBarPct = maxMomentum > 0 ? (seasonPpm / maxMomentum) * 100 : 0;
          const momentumBarPct = maxMomentum > 0 ? (momentumPpm / maxMomentum) * 100 : 0;

          return (
            <Link
              key={p.player_id}
              href={playerUrl(p.player_id, p.players?.first_name, p.players?.last_name)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors border-l-2 border-emerald-500/40"
              style={{ background: 'var(--bg-card)' }}
            >
              {/* Rank */}
              <span className="w-6 text-right font-bold text-lg shrink-0" style={{ color: 'var(--silver)' }}>
                {i + 1}
              </span>

              {/* Player info + bars */}
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

                {/* Mini double bar: season (base) + momentum (surge) */}
                <div className="mt-2 flex items-end gap-0.5 h-3">
                  <div className="relative flex-1 flex items-end gap-0.5">
                    <div
                      className="rounded-sm transition-all"
                      style={{
                        width: `${Math.max(seasonBarPct, 4)}%`,
                        height: '8px',
                        background: 'var(--border)',
                        minWidth: 8,
                      }}
                    />
                    <div
                      className="rounded-sm transition-all"
                      style={{
                        width: `${Math.max(momentumBarPct, 4)}%`,
                        height: '12px',
                        background: '#10b981',
                        minWidth: 8,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0 space-y-0.5">
                <div className="text-sm font-bold tabular-nums" style={{ color: '#10b981' }}>
                  {momentumPpm.toFixed(4)}
                </div>
                <div className="text-xs tabular-nums" style={{ color: 'var(--text)' }}>
                  {seasonPpm.toFixed(4)} season
                </div>
              </div>

              {/* Delta */}
              <div className="text-right shrink-0 min-w-[3rem]">
                <div className="text-sm font-bold tabular-nums" style={{ color: '#34d399' }}>
                  ↑{delta > 0 ? '+' : ''}{delta.toFixed(4)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
