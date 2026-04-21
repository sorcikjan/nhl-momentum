import type { Metadata } from 'next';
import RankingsTable from '@/components/rankings/RankingsTable';
import { fetchRankings } from '@/lib/data';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Heat Rankings',
  description: 'Top 100 NHL skaters ranked by Heat score — rolling 5-game momentum vs season average.',
  openGraph: {
    title: 'Heat Rankings — NHL Momentum',
    description: 'Top 100 NHL skaters ranked by Heat score — rolling 5-game momentum vs season average.',
  },
};

export default async function RankingsPage() {
  const data = await fetchRankings().catch(() => null);
  const players = data?.top100 ?? [];

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Heat Rankings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Last 5 vs season — higher = hotter.{' '}
          <span style={{ color: 'var(--silver)' }}>Heat is 0–100.</span>
        </p>
      </div>

      <RankingsTable players={players} />
    </div>
  );
}
