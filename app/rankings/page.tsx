import type { Metadata } from 'next';
import RankingsTable from '@/components/rankings/RankingsTable';
import { fetchRankings, fetchSeasonPhase } from '@/lib/data';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'NHL Player Rankings 2026–27',
  description: 'Full NHL player rankings — top 100 skaters by momentum score, season totals, and rolling form.',
  openGraph: {
    title: 'NHL Player Rankings — momentum.',
    description: 'Top 100 NHL skaters ranked by momentum score and season performance.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NHL Player Rankings 2026–27',
    description: 'Full NHL player rankings. Updated daily.',
  },
};

export default async function RankingsPage() {
  const [data, seasonPhase] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchSeasonPhase().catch(() => ({ isPreseason: false, regularSeasonStartDate: null, daysUntilStart: null })),
  ]);
  const players = data?.top100 ?? [];
  const sparklineSnapshots = data?.sparklineSnapshots ?? [];

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <RankingsTable
        players={players}
        seasonHasStarted={!seasonPhase.isPreseason}
        sparklineSnapshots={sparklineSnapshots}
      />
    </div>
  );
}
