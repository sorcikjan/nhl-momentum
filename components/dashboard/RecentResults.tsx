import Link from 'next/link';
import { gameUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().slice(0, 10)) return 'Today';
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function RecentResults({
  games,
  predMap,
}: {
  games: Game[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predMap: Map<number, any>;
}) {
  if (!games.length) return null;

  // Group by date
  const byDate = new Map<string, Game[]>();
  for (const g of games) {
    const d = g.game_date as string;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(g);
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)', opacity: 0.5 }}>
          Last Night
        </h2>
      </div>

      <div className="flex flex-col gap-1">
        {[...byDate.entries()].map(([date, dayGames]) => (
          <div key={date}>
            {/* Date separator */}
            <p className="text-xs font-medium mt-3 mb-1.5 first:mt-0" style={{ color: 'var(--silver)' }}>
              {formatDate(date)}
            </p>

            {dayGames.map((g: Game) => {
              const pred = predMap.get(g.id);
              const homeWon = (g.home_score ?? 0) > (g.away_score ?? 0);
              const predHomeWin = pred ? (pred.home_win_probability ?? 0.5) >= 0.5 : null;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const outcome = pred?.prediction_outcomes?.[0] as any;
              const correct = outcome != null
                ? outcome.home_win === homeWon
                : pred != null ? predHomeWin === homeWon : null;

              return (
                <Link
                  key={g.id}
                  href={gameUrl(g.id, g.away_team?.abbrev ?? '', g.home_team?.abbrev ?? '', g.game_date ?? '')}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  {/* Away */}
                  <div className="flex items-center gap-1.5 w-[80px] flex-shrink-0">
                    <span className="text-xs font-mono" style={{ color: homeWon ? 'var(--text)' : 'var(--text-bright)', fontWeight: homeWon ? 400 : 700 }}>
                      {g.away_team?.abbrev}
                    </span>
                    <span className="text-sm font-mono font-bold ml-auto" style={{ color: homeWon ? 'var(--text)' : 'var(--text-bright)' }}>
                      {g.away_score ?? '—'}
                    </span>
                  </div>

                  {/* Separator */}
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--border)' }}>–</span>

                  {/* Home */}
                  <div className="flex items-center gap-1.5 w-[80px] flex-shrink-0">
                    <span className="text-sm font-mono font-bold" style={{ color: homeWon ? 'var(--text-bright)' : 'var(--text)' }}>
                      {g.home_score ?? '—'}
                    </span>
                    <span className="text-xs font-mono ml-1" style={{ color: homeWon ? 'var(--text-bright)' : 'var(--text)', fontWeight: homeWon ? 700 : 400 }}>
                      {g.home_team?.abbrev}
                    </span>
                  </div>

                  {/* Prediction result */}
                  {correct !== null && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                      style={{
                        background: correct ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: correct ? 'var(--green)' : 'var(--red)',
                      }}>
                      {correct ? '✓' : '✗'}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
