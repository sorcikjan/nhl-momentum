import Link from 'next/link';
import type { Topic } from '@/lib/nation-topics';
import type { Nation } from '@/lib/nations';

const CARD = { background: 'var(--bg-card)', borderColor: 'var(--border-soft)' } as const;

// The hub and the other topics, so every page leads to the rest.
export function TopicNav({ n, topics, current }: { n: Nation; topics: Topic[]; current?: string }) {
  if (!topics.length) return null;
  return (
    <nav aria-label={n.t.ui.name} className="flex flex-wrap gap-2">
      {current && <Pill href={n.path}>{n.t.ui.name}</Pill>}
      {topics.filter(t => t.key !== current).map(t => <Pill key={t.key} href={`${n.path}/${t.slug}`}>{t.nav}</Pill>)}
    </nav>
  );
}

function Pill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--bg-hover)]"
      style={{ ...CARD, color: 'var(--text-bright)' }}>{children}</Link>
  );
}

