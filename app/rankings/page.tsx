import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RankingsFromUrl, RankingsView, type GoalieRow } from '@/components/rankings/RankingsView';
import { fetchGoalieRankings, fetchRankings } from '@/lib/data';
import { rankingRows } from '@/lib/rankings-view';
import { assertDatabaseUp } from '@/lib/supabase';
import { playerUrl } from '@/lib/urls';

// Free-tier database: data changes only when the pipeline runs, and pipeline
// runs call /api/revalidate — so a longer interval costs no freshness.
export const revalidate = 600;

export const metadata: Metadata = {
  title: 'NHL Player Rankings 2026–27',
  description: 'NHL player rankings — top skaters by Heat (recent form), season totals and trend, plus the best goalies by recent save percentage.',
  openGraph: {
    title: 'NHL Player Rankings — momentum.',
    description: 'Top NHL skaters ranked by Heat and season performance.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NHL Player Rankings 2026–27',
    description: 'NHL player rankings by Heat. Updated after every game night.',
  },
};

// One static ISR page; position/sort filters are applied on the client from the URL.
export default async function RankingsPage() {
  // Throw (→ keep serving the last good cached page) if the database is down.
  await assertDatabaseUp();
  const [data, goaliesRaw] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchGoalieRankings().catch(() => []),
  ]);
  const rows = rankingRows(data?.top100 ?? [], { pos: 'ALL', sort: 'heat' }, data?.sparklineSnapshots ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalies: GoalieRow[] = (goaliesRaw as any[]).map(g => ({
    id: g.id, href: playerUrl(g.id, g.first_name, g.last_name), name: `${g.first_name} ${g.last_name}`,
    team: g.teams?.abbrev ?? '', savePct: g.avgSavePct, gaa: g.avgGAA, games: g.gamesPlayed,
  }));
  const props = { rows, goalies, total: data?.totalSkaters ?? 0 };
  return (
    <Suspense fallback={<RankingsView {...props} pos="ALL" sort="heat" />}>
      <RankingsFromUrl {...props} />
    </Suspense>
  );
}
