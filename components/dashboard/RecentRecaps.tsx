import Link from 'next/link';
import { fetchRecentRecaps } from '@/lib/data';

export default async function RecentRecaps() {
  const recaps = await fetchRecentRecaps(3).catch(() => []);
  if (!recaps.length) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
          Latest Recaps
        </h2>
        <Link href="/recaps" className="text-xs hover:underline" style={{ color: 'var(--neon)' }}>
          All recaps →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {recaps.map((r: any) => {
          const dateLabel = new Date(r.date + 'T12:00:00Z').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          });
          const headline = r.title.replace(/^NHL Recap[^:]*:\s*/i, '');

          return (
            <Link key={r.date} href={`/recaps/${r.date}`}
              className="flex flex-col rounded-xl border overflow-hidden transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

              {/* Article image — branded gradient header */}
              <div className="relative h-28 flex items-end px-4 pb-3"
                style={{
                  background: 'linear-gradient(135deg, #0a0f1a 0%, #0d2137 60%, #001a2e 100%)',
                  borderBottom: '1px solid var(--border)',
                }}>
                {/* Decorative puck icon */}
                <span className="absolute top-3 right-4 text-2xl opacity-20 select-none">🏒</span>
                {/* Date badge */}
                <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--neon-glow)', color: 'var(--neon)', border: '1px solid var(--neon)', opacity: 0.9 }}>
                  {dateLabel}
                </span>
              </div>

              {/* Text content */}
              <div className="flex-1 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--neon)' }}>
                  NHL Recap
                </p>
                <h3 className="text-sm font-bold leading-snug mb-2"
                  style={{ color: 'var(--text-bright)' }}>
                  {headline}
                </h3>
                {r.summary && (
                  <p className="text-xs leading-relaxed line-clamp-3"
                    style={{ color: 'var(--text)' }}>
                    {r.summary}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pb-3 flex items-center justify-between">
                {r.games_count != null && (
                  <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                    {r.games_count} games
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--neon)' }}>Read recap →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
