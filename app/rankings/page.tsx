import type { Metadata } from 'next';
import RankingsTable from '@/components/rankings/RankingsTable';
import { fetchRankings } from '@/lib/data';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'NHL Player Rankings 2025–26',
  description: 'Full NHL player rankings — top 100 skaters by momentum score, season totals, and rolling form.',
  openGraph: {
    title: 'NHL Player Rankings — Hockey Momentum',
    description: 'Top 100 NHL skaters ranked by momentum score and season performance.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NHL Player Rankings 2025–26',
    description: 'Full NHL player rankings. Updated daily.',
  },
};

export default async function RankingsPage() {
  const data = await fetchRankings().catch(() => null);
  const players = data?.top100 ?? [];

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Rankings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Top 100 skaters by momentum score.{' '}
          <span style={{ color: 'var(--silver)' }}>Heat is 0–100.</span>
        </p>
      </div>

      <RankingsTable players={players} />
    </div>
  );
}
