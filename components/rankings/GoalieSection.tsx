import Link from 'next/link';
import { playerUrl } from '@/lib/urls';

type GoalieRanking = {
  id: number;
  first_name: string;
  last_name: string;
  headshot_url: string | null;
  team_id: number | null;
  teams: { id: number; abbrev: string; name: string } | null;
  avgSavePct: number;
  avgGAA: number;
  decisions: string[];
  gamesPlayed: number;
};

function decisionDot(d: string) {
  const upper = d.toUpperCase();
  if (upper === 'W' || upper === 'SOW') return { bg: '#10b981', label: 'W' };
  if (upper === 'L' || upper === 'SOL') return { bg: '#ef4444', label: 'L' };
  return { bg: '#f59e0b', label: 'O' };
}

function formatSavePct(pct: number) {
  // e.g. 0.923 → ".923"
  return pct.toFixed(3).replace(/^0/, '');
}

export function GoalieSection({ goalies }: { goalies: GoalieRanking[] }) {
  const eligible = goalies.filter(g => g.gamesPlayed >= 3);
  if (!eligible.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-bright)' }}>
          🥅 Top Goalies
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
          Best save % over last 5 games
        </p>
      </div>

      <div className="space-y-1">
        {eligible.slice(0, 10).map((g, i) => (
          <Link
            key={g.id}
            href={playerUrl(g.id, g.first_name, g.last_name)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors border-l-2 border-blue-500/30"
            style={{ background: 'var(--bg-card)' }}
          >
            {/* Rank */}
            <span className="w-6 text-right font-bold text-lg shrink-0" style={{ color: 'var(--silver)' }}>
              {i + 1}
            </span>

            {/* Name + team */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-bright)' }}>
                  {g.first_name} {g.last_name}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono shrink-0"
                  style={{ background: 'var(--border)', color: 'var(--text)' }}>
                  {g.teams?.abbrev ?? '—'}
                </span>
              </div>

              {/* Decision dots */}
              {g.decisions.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  {g.decisions.map((d, di) => {
                    const { bg, label } = decisionDot(d);
                    return (
                      <span
                        key={di}
                        title={label}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: bg }}
                      >
                        {label}
                      </span>
                    );
                  })}
                  <span className="text-xs ml-1" style={{ color: 'var(--silver)' }}>
                    last {g.gamesPlayed}
                  </span>
                </div>
              )}
            </div>

            {/* Save % */}
            <div className="text-right shrink-0">
              <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--neon)' }}>
                {formatSavePct(g.avgSavePct)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text)' }}>sv%</div>
            </div>

            {/* GAA */}
            <div className="text-right shrink-0 min-w-[2.5rem]">
              <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                {g.avgGAA.toFixed(2)}
              </div>
              <div className="text-xs" style={{ color: 'var(--silver)' }}>gaa</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
