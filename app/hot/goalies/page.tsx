import type { Metadata } from 'next';
import { GOALIE_HOT_FAQ, GoalieHotBody } from '@/components/hot/GoalieHotBody';
import { JsonLd } from '@/components/seo/JsonLd';
import { fetchGoalieHot } from '@/lib/goalie-hot-data';
import { SHARE_IMAGE, itemListLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)

export const metadata: Metadata = {
  title: { absolute: 'Hottest NHL Goalies Right Now — Save % Last 5 Starts | momentum.' },
  description: "Which NHL goalie is hot right now? Every starting goalie ranked by save percentage over his last five starts, against his own season and the league average.",
  alternates: { canonical: `${SITE_URL}/hot/goalies` },
  openGraph: { images: [SHARE_IMAGE], title: 'Hottest NHL Goalies Right Now — momentum.', description: 'NHL goalies ranked by save % over their last five starts.' },
  twitter: { card: 'summary_large_image', title: 'Hottest NHL Goalies Right Now — momentum.', images: [SHARE_IMAGE.url] },
};

export default async function HotGoaliesPage() {
  // NHL API only: no database guard needed.
  const view = await fetchGoalieHot();
  // An empty list means the NHL API failed: throwing keeps the last good page
  // in the cache instead of saving an empty one for a day.
  if (!view.rows.length && process.env.NEXT_PHASE !== 'phase-production-build') throw new Error('hot/goalies: NHL stats API returned no goalies');
  const updated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).toUpperCase();
  const list = view.rows.map(g => ({ name: g.name, url: `${SITE_URL}${g.href}` }));
  return (
    <>
      {list.length > 0 && <JsonLd data={itemListLd(list)} />}
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: GOALIE_HOT_FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <GoalieHotBody view={view} updated={updated} />
    </>
  );
}
