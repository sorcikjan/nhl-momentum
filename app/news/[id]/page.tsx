import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchSignalById } from '@/lib/data';

export const revalidate = 86400;

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const signal = await fetchSignalById(Number(id)).catch(() => null);
  if (!signal) return { title: 'NHL News' };
  return {
    title: signal.title,
    description: signal.content?.slice(0, 160) ?? undefined,
    openGraph: { title: signal.title, type: 'article' },
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = await fetchSignalById(Number(id)).catch(() => null);
  if (!signal) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = signal as any;

  const dateLabel = s.published_at
    ? new Date(s.published_at).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

  const paragraphs = (s.content ?? '')
    .split(/\n\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text)' }}>
        <Link href="/news" className="hover:underline" style={{ color: 'var(--neon)' }}>
          News
        </Link>
        <span style={{ opacity: 0.4 }}>›</span>
        <span className="truncate">{s.source}</span>
      </div>

      {/* Article header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--neon)' }}>
          NHL News · {s.source}
        </p>
        <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3"
          style={{ color: 'var(--text-bright)' }}>
          {s.title}
        </h1>
        {dateLabel && (
          <p className="text-xs" style={{ color: 'var(--text)' }}>{dateLabel}</p>
        )}
      </div>

      {/* Divider */}
      <div className="mb-6" style={{ borderTop: '1px solid var(--border)' }} />

      {/* Article body */}
      <article className="mb-10">
        {paragraphs.length > 0 ? paragraphs.map((para: string, i: number) => (
          <p key={i} className="text-sm leading-relaxed mb-4"
            style={{ color: i === 0 ? 'var(--text-bright)' : 'var(--text)', fontSize: i === 0 ? '1rem' : undefined }}>
            {para}
          </p>
        )) : (
          <p className="text-sm" style={{ color: 'var(--text)' }}>No content available.</p>
        )}
      </article>

      {/* Source link */}
      {s.url && (
        <div className="rounded-xl border p-4 mb-8"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text)' }}>Original source</p>
          <a href={s.url} target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--neon)' }}>
            Read on {s.source} →
          </a>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between pt-4"
        style={{ borderTop: '1px solid var(--border)' }}>
        <Link href="/news" className="text-xs hover:underline" style={{ color: 'var(--neon)' }}>
          ← All news
        </Link>
        <Link href="/" className="text-xs hover:underline" style={{ color: 'var(--text)' }}>
          Dashboard →
        </Link>
      </div>
    </div>
  );
}
