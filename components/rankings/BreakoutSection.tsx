import Link from 'next/link';
import { playerUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Player = any;

// Exclude players who are already perennial top names (elite season pace).
// The story here is about players outside the usual spotlight.
const ELITE_SEASON_PPM_THRESHOLD = 0.038;

export function BreakoutSection({ players }: { players: Player[] }) {
  const underdogs = players
    .filter((p: Player) =>
      (p.momentum_games ?? 0) >= 3 &&
      (p.season_ppm ?? 0) < ELITE_SEASON_PPM_THRESHOLD &&
      (p.breakout_delta ?? 0) > 0
    )
    .slice(0, 10);

  if (!underdogs.length) return null;

  // Highest pct-above-average in the list, used to scale the surge bar
  const maxPct = Math.max(
    ...underdogs.map((p: Player) =>
      p.season_ppm > 0 ? ((p.momentum_ppm - p.season_ppm) / p.season_ppm) * 100 : 0
    ),
    1
  );

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>
          ↑ Breaking Out
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
          Not the usual names — players surging well above their season average in the last 5 games.
        </p>
      </div>

      <div className="space-y-1">
        {underdogs.map((p: Player, i: number) => {
          const pct = p.season_ppm > 0
            ? Math.round(((p.momentum_ppm - p.season_ppm) / p.season_ppm) * 100)
            : 0;
          const barWidth = maxPct > 0 ? Math.min(100, Math.round((pct / maxPct) * 100)) : 0;

          // Contextual label for the surge size
          const surgeLabel = pct >= 150 ? 'On fire'
            : pct >= 100 ? 'Huge stretch'
            : pct >= 60 ? 'Hot streak'
            : 'Trending up';

          return (
            <Link
              key={p.player_id}
              href={playerUrl(p.player_id, p.players?.first_name, p.players?.last_name)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors border-l-2 border-emerald-500/50"
              style={{ background: 'var(--bg-card)' }}
            >
              {/* Rank */}
              <span className="w-6 text-right font-bold text-lg shrink-0" style={{ color: 'var(--silver)' }}>
                {i + 1}
              </span>

              {/* Player info + surge bar */}
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

                {/* Surge bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barWidth}%`, background: '#10b981' }}
                    />
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#6ee7b7' }}>
                    {surgeLabel}
                  </span>
                </div>
              </div>

              {/* % above season pace — the headline number */}
              <div className="text-right shrink-0 min-w-[3.5rem]">
                <div className="text-lg font-black tabular-nums leading-none" style={{ color: '#10b981' }}>
                  +{pct}%
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--silver)' }}>
                  vs season
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
