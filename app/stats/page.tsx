import type { Metadata } from 'next';
import { SectionHeading, SectionLink } from '@/components/ds';
import { LeaderBoard } from '@/components/standings/LeaderBoard';
import { fetchRankings } from '@/lib/data';
import { currentSeason } from '@/lib/nhl-api';
import { GOALIE_BOARDS, SKATER_BOARDS, fetchLeaders } from '@/lib/nhl-stats';
import { SHARE_IMAGE } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const revalidate = 600;

const season = () => { const s = currentSeason(); return `${s.slice(0, 4)}–${s.slice(6)}`; };

export function generateMetadata(): Metadata {
  const title = `NHL Stat Leaders ${season()} — Points, Goals, Assists, Save %`;
  const description = `The ${season()} NHL leaders in points, goals, assists, plus/minus and power-play goals, and the top goalies by save percentage, GAA, wins and shutouts — each with his Heat right now.`;
  return {
    title, description,
    alternates: { canonical: `${SITE_URL}/stats` },
    openGraph: { images: [SHARE_IMAGE], title: `${title} — momentum.`, description },
    twitter: { images: [SHARE_IMAGE.url], card: 'summary_large_image', title, description },
  };
}

export default async function StatsPage() {
  const rankings = await fetchRankings().catch(() => null);
  const [skaters, goalies] = await Promise.all([
    fetchLeaders(SKATER_BOARDS, 'skater', 10, rankings?.heatByPlayer).catch(() => []),
    fetchLeaders(GOALIE_BOARDS, 'goalie', 10).catch(() => []),
  ]);
  if (!skaters.length && !goalies.length) throw new Error('NHL stat leaders unavailable');
  return (
    <div className="flex flex-col gap-10 pb-20 lg:pb-0">
      <SectionHeading
        as="h1" size="page"
        kicker={`OFFICIAL STAT LEADERS · ${season()} · SOURCE: NHL.COM`}
        title="NHL stat leaders."
        sub="The season totals, and whether each leader is still hot right now."
        right={<SectionLink href="/standings">Standings</SectionLink>}
      />
      <section className="flex flex-col gap-3.5">
        <SectionHeading kicker="SKATERS" title="Skater leaders." />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {skaters.map(b => <LeaderBoard key={b.key} board={b} />)}
        </div>
      </section>
      <section className="flex flex-col gap-3.5">
        <SectionHeading kicker="GOALIES" title="Goalie leaders." />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {goalies.map(b => <LeaderBoard key={b.key} board={b} showHeat={false} />)}
        </div>
      </section>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Season totals: NHL.com, updated after every game. Heat: momentum., from the last five games.</p>
    </div>
  );
}
