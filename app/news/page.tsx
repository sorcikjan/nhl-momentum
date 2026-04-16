import type { Metadata } from 'next';
import { fetchNewsFeed } from '@/lib/data';

export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
  title: 'NHL News Feed',
  description: 'Latest NHL news and headlines aggregated from NHL.com and sports media.',
};

const SOURCE_LABEL: Record<string, string> = {
  rss_nhl: 'NHL.com',
  newsdata: 'News',
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function NewsPage() {
  const signals = await fetchNewsFeed(60).catch(() => []);

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>
          NHL News
        </h1>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          Latest headlines from NHL.com and sports media, updated every 30 minutes.
        </p>
      </div>

      {signals.length === 0 ? (
        <div className="rounded-xl border p-8 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text)' }}>No news yet — check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {signals.map((s: any) => (
            <div key={s.id}
              className="rounded-xl border p-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium leading-snug hover:underline"
                      style={{ color: 'var(--text-bright)' }}>
                      {s.title}
                    </a>
                  ) : (
                    <p className="text-sm font-medium leading-snug"
                      style={{ color: 'var(--text-bright)' }}>
                      {s.title}
                    </p>
                  )}
                  {s.content && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text)' }}>
                      {s.content}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs"
                  style={{ color: 'var(--text)' }}>
                  <span className="px-2 py-0.5 rounded font-mono"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    {SOURCE_LABEL[s.type] ?? s.source}
                  </span>
                  <span>{timeAgo(s.published_at ?? s.fetched_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
