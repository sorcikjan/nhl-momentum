import type { Metadata } from 'next';
import { HEAT_FAQ, HotBody } from '@/components/hot/HotBody';
import { JsonLd } from '@/components/seo/JsonLd';
import { SHARE_IMAGE, itemListLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { fetchRankings } from '@/lib/data';
import { hotView } from '@/lib/hot-view';
import { assertDatabaseUp } from '@/lib/supabase';

// Free-tier database: data changes only when the pipeline runs, and pipeline
// runs call /api/revalidate — so a longer interval costs no freshness.
export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: 'NHL Heat Index — The Hottest Players Right Now (Last 5 Games) | momentum.' },
  description: "Who's hot in the NHL right now: every skater's form from 0 to 100 over his last five games, who's heating up, who's going cold, and the hottest player on every team.",
  alternates: { canonical: `${SITE_URL}/hot` },
  openGraph: {
    title: 'NHL Heat Index — momentum.',
    description: "Who's hot in the NHL right now: every skater's form from 0 to 100 over his last five games.",
  },
  twitter: { card: 'summary_large_image', title: 'NHL Heat Index — momentum.', images: [SHARE_IMAGE.url] },
};

// Heat page per docs/design/redesign-2026 DesktopHotPlayers / MobileHotPlayers.
export default async function HotPage() {
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const rankings = await fetchRankings().catch(() => null);
  const view = hotView(rankings);
  const updated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).toUpperCase();
  const list = view.leader ? [{ name: `${view.leader.first} ${view.leader.last}`, url: `${SITE_URL}${view.leader.href}` }, ...[...view.top, ...view.more].map(r => ({ name: r.name, url: `${SITE_URL}${r.href}` }))] : [];
  return (
    <>
      {list.length > 0 && <JsonLd data={itemListLd(list)} />}
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: HEAT_FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <HotBody view={view} updated={updated} />
    </>
  );
}
