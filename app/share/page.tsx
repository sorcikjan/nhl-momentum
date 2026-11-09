import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ds';
import { CopyText } from '@/components/share/CopyText';
import { fetchShareData } from '@/lib/share-data';
import { SHARE_KINDS, SHARE_TITLES, sharePosts } from '@/lib/share-cards';

// Not for search: this is the posting desk.
export const metadata: Metadata = { title: 'Share cards', robots: { index: false, follow: false } };
// Rendered on every visit: only we open it, sometimes days apart, and a cached copy
// would hand out last week's numbers for a post. Rankings are cached a level below.
export const dynamic = 'force-dynamic';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// This morning's cards and the text to post with each — open, download, copy, post.
export default async function SharePage() {
  const d = await fetchShareData();
  return (
    <div className="flex flex-col gap-10 pb-20 lg:pb-0">
      <SectionHeading as="h1" size="page" kicker={`SHARE DESK · ${d.dateLabel}`} title="This morning's cards."
        sub="Download a card, copy its text, post. Links already carry where they were posted (utm), so GA4 shows what each channel brings." />
      {SHARE_KINDS.map(kind => {
        const posts = sharePosts(kind, d);
        if (!posts.length) return null;
        const src = `/share/card/${kind}`;
        return (
          <section key={kind} className="grid grid-cols-1 gap-6 border-t pt-8 lg:grid-cols-[360px_minmax(0,1fr)]" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>{SHARE_TITLES[kind].toUpperCase()}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={SHARE_TITLES[kind]} width={1080} height={1350} className="h-auto w-full rounded-xl border" style={{ borderColor: 'var(--border)' }} />
              <a href={src} download={`momentum-${kind}-${d.dateLabel.replace(/\W+/g, '-').toLowerCase()}.png`} className="text-xs font-bold" style={{ ...MONO, color: 'var(--heat)' }}>DOWNLOAD PNG ↓</a>
            </div>
            <div className="flex min-w-0 flex-col gap-6">
              {posts.map(p => (
                <div key={p.channel} className="flex flex-col gap-3 rounded-[14px] border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-sm font-extrabold" style={{ color: 'var(--text-bright)' }}>{p.channel}</span>
                  {p.title && <CopyText label="TITLE" text={p.title} />}
                  <CopyText label="POST" text={p.body} />
                  {p.comment && <CopyText label="FIRST COMMENT · THE LINK" text={p.comment} />}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
