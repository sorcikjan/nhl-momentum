import type { Metadata } from 'next';
import { TEAM_HEAT_FAQ, TeamHotBody } from '@/components/hot/TeamHotBody';
import { JsonLd } from '@/components/seo/JsonLd';
import { fetchRankings } from '@/lib/data';
import { fetchStandings } from '@/lib/nhl-stats';
import { SHARE_IMAGE, itemListLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { assertDatabaseUp } from '@/lib/supabase';
import { teamHotView } from '@/lib/team-hot-view';
import { teamUrl } from '@/lib/urls';

export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)

export const metadata: Metadata = {
  title: { absolute: 'Hottest NHL Teams Right Now — Team Heat Rankings | momentum.' },
  description: "Who's the hottest team in the NHL right now? All 32 teams ranked by the form of their five hottest skaters over the last five games, with each team's last-10 record and hottest player.",
  alternates: { canonical: `${SITE_URL}/hot/teams` },
  openGraph: { images: [SHARE_IMAGE], title: 'Hottest NHL Teams Right Now — momentum.', description: 'All 32 NHL teams ranked by the form of their top skaters.' },
  twitter: { card: 'summary_large_image', title: 'Hottest NHL Teams Right Now — momentum.', images: [SHARE_IMAGE.url] },
};

export default async function HotTeamsPage() {
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const rankings = await fetchRankings().catch(() => null);
  const standings = await fetchStandings(rankings?.teamHeat, rankings?.teams).catch(() => []);
  const view = teamHotView(rankings, standings, teamUrl);
  const updated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).toUpperCase();
  const list = view.rows.filter(t => t.href).map(t => ({ name: t.name, url: `${SITE_URL}${t.href}` }));
  return (
    <>
      {list.length > 0 && <JsonLd data={itemListLd(list)} />}
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: TEAM_HEAT_FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <TeamHotBody view={view} updated={updated} />
    </>
  );
}
