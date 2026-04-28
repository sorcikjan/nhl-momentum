import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchRecentRecaps } from '@/lib/data';
import { recapUrl } from '@/lib/urls';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Last Night — NHL Stories',
  description: 'Data-driven stories from every NHL game night — top performers, momentum analytics, and how our model did.',
  openGraph: {
    title: 'Last Night — Hockey Momentum',
    description: 'Data-driven stories from every NHL game night — top performers, momentum analytics, and prediction accuracy.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Last Night — Hockey Momentum',
    description: 'Data-driven stories from every NHL game night — top performers, predictions, and momentum analytics.',
  },
};

export default async function RecapsPage() {
  const recaps = await fetchRecentRecaps(30).catch(() => []);

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>
          Last Night.
        </h1>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          Data-driven stories from every NHL game night — top performers, momentum analytics, and how our model did.
        </p>
      </div>

      {recaps.length === 0 ? (
        <div className="rounded-xl border p-8 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text)' }}>No recaps yet — check back after tonight&apos;s games.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recaps.map((r) => {
            const dateLabel = new Date(r.date + 'T12:00:00Z').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            });
            return (
              <Link key={r.date} href={recapUrl(r.date, r.title ?? '')}
                className="rounded-xl border p-4 transition-opacity hover:opacity-80"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-1" style={{ color: 'var(--text)' }}>{dateLabel}</p>
                    <h2 className="text-sm font-semibold leading-snug"
                      style={{ color: 'var(--text-bright)' }}>
                      {r.title}
                    </h2>
                    {r.summary && (
                      <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text)' }}>
                        {r.summary}
                      </p>
                    )}
                  </div>
                  {r.games_count != null && (
                    <span className="text-xs px-2 py-1 rounded flex-shrink-0 font-mono"
                      style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                      {r.games_count}G
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
