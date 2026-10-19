import Link from 'next/link';
import { SectionHeading } from '@/components/ds';
import { MONO } from './format';

// Quick links (design ExploreStrip). Only pages that exist; counts are real.
export function ExploreStrip({ rankedCount }: { rankedCount: number | null }) {
  const items = [
    { k: 'HEAT MAP', t: rankedCount ? `All ${rankedCount} skaters` : 'Every skater', s: 'Who is burning and who is cooling, right now.', c: 'var(--heat)', href: '/hot' },
    { k: 'RANKINGS', t: 'Full table', s: 'Sort by Heat, points, goals. Filter by position.', c: 'var(--cold)', href: '/rankings' },
    { k: 'SCHEDULE', t: 'This week', s: 'Every game, our pick, and who to watch.', c: 'var(--story)', href: '/games?range=week' },
    { k: 'ACCURACY', t: "How we're doing", s: 'Pick history, model versions, calibration.', c: 'var(--rise)', href: '/accuracy' },
  ];
  return (
    <section data-section="explore">
      <SectionHeading kicker="EXPLORE" title="More ways to dig in." size="feature" />
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4 lg:gap-3">
        {items.map(it => (
          <Link key={it.k} href={it.href} className="flex flex-col gap-1 rounded-lg border px-3.5 py-3 lg:gap-2 lg:rounded-xl lg:px-[22px] lg:py-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
            <span className="text-[9px] font-bold" style={{ ...MONO, color: it.c, letterSpacing: 1.4 }}>{it.k}</span>
            <span className="text-[13px] font-bold lg:text-xl lg:font-extrabold" style={{ color: 'var(--text-bright)', letterSpacing: -0.4 }}>{it.t}</span>
            <span className="hidden text-xs leading-normal lg:block" style={{ color: 'var(--text)' }}>{it.s}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
