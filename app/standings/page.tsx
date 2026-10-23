import type { Metadata } from 'next';
import { SectionHeading, SectionLink } from '@/components/ds';
import { StandingsTable, byGroup } from '@/components/standings/StandingsTable';
import { fetchRankings } from '@/lib/data';
import { currentSeason } from '@/lib/nhl-api';
import { fetchStandings } from '@/lib/nhl-stats';
import { SHARE_IMAGE } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

// NHL.com updates after every game; the pipeline revalidates after each one too.
export const revalidate = 600;

const season = () => { const s = currentSeason(); return `${s.slice(0, 4)}–${s.slice(6)}`; };

export function generateMetadata(): Metadata {
  const title = `NHL Standings ${season()} — Conference, Division & League`;
  const description = `The ${season()} NHL standings by conference, division and league: games, record, points, goal differential, last 10 and streak — with each team's Heat, the form of its five hottest skaters.`;
  return {
    title, description,
    alternates: { canonical: `${SITE_URL}/standings` },
    openGraph: { images: [SHARE_IMAGE], title: `${title} — momentum.`, description },
    twitter: { images: [SHARE_IMAGE.url], card: 'summary_large_image', title, description },
  };
}

export default async function StandingsPage() {
  const rankings = await fetchRankings().catch(() => null);
  const rows = await fetchStandings(rankings?.teamHeat, rankings?.teams).catch(() => []);
  // Throw rather than cache an empty page: ISR keeps the last good one.
  if (!rows.length) throw new Error('NHL standings unavailable');
  return (
    <div className="flex flex-col gap-10 pb-20 lg:pb-0">
      <SectionHeading
        as="h1" size="page"
        kicker={`OFFICIAL NHL STANDINGS · ${season()} · SOURCE: NHL.COM`}
        title="NHL standings."
        sub="Every team's record, with its Heat: the average form of its five hottest skaters over the last five games."
        right={<SectionLink href="/stats">Stat leaders</SectionLink>}
      />
      <section className="flex flex-col gap-3.5">
        <SectionHeading kicker="BY CONFERENCE" title="Conference standings." />
        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
          {byGroup(rows, 'conference').map(c => <StandingsTable key={c.name} caption={`${c.name} Conference`} rows={c.rows} detail />)}
        </div>
      </section>
      <section className="flex flex-col gap-3.5">
        <SectionHeading kicker="BY DIVISION" title="Division standings." />
        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
          {byGroup(rows, 'division').map(d => <StandingsTable key={d.name} caption={`${d.name} Division`} rows={d.rows} detail />)}
        </div>
      </section>
      <section className="flex flex-col gap-3.5">
        <SectionHeading kicker="ALL 32 TEAMS" title="League standings." />
        <StandingsTable caption="NHL" rows={rows} detail />
      </section>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Records and points: NHL.com, updated after every game. Heat: momentum., from the last five games.</p>
    </div>
  );
}
