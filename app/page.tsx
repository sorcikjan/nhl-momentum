import type { Metadata } from 'next';
import { HomeBody } from '@/components/home/HomeBody';
import { JsonLd } from '@/components/seo/JsonLd';
import { fetchHomeData, todayET } from '@/lib/home';
import { itemListLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { assertDatabaseUp } from '@/lib/supabase';

// Free-tier database: each render is several queries; crawlers visit every page.
export const revalidate = 120;

// Search-facing: people search "who's hot in the NHL", not the brand name.
const TITLE = "Who's Hot in the NHL Right Now — Heat Rankings & Tonight's Games";
const DESC = "Every NHL player's form in one number: Heat, 0–100, from the last five games. Who's heating up, who's going cold, last night's results and tonight's best game.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | momentum.` },
  description: DESC,
  alternates: { canonical: SITE_URL },
  openGraph: { title: TITLE, description: DESC, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
};

// Homepage: results, Heat, tonight, goalies and rookies, stories, teams.
export default async function HomePage() {
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const data = await fetchHomeData(todayET());
  const top = data.leader ? [{ name: `${data.leader.first} ${data.leader.last}`, url: `${SITE_URL}${data.leader.href}` }] : [];
  return (
    <>
      {top.length > 0 && <JsonLd data={itemListLd([...top, ...data.leaders.map(r => ({ name: r.name, url: `${SITE_URL}${r.href}` }))])} />}
      <HomeBody data={data} />
    </>
  );
}
