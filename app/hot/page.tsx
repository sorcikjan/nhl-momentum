import type { Metadata } from 'next';
import HeatGrid from '@/components/dashboard/HeatGrid';
import { fetchRankings, fetchGoalieRankings, fetchNewcomerWatch } from '@/lib/data';

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Who's Hot",
  description: 'The hottest players in the NHL right now — skaters, goalies, and breakout newcomers ranked by 5-game momentum.',
  openGraph: {
    title: "Who's Hot — Hockey Momentum",
    description: 'Skaters, goalies and fresh faces ranked by 5-game momentum score.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Who's Hot — Hockey Momentum",
    description: 'The hottest players in the NHL right now. Updated daily.',
  },
};

export default async function HotPage() {
  const [data, goalies, newcomers] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchGoalieRankings().catch(() => []),
    fetchNewcomerWatch().catch(() => []),
  ]);

  const skaters = data?.momentumLeaders?.skaters ?? [];

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>
          Who&apos;s <span style={{ color: 'var(--heat)' }}>Hot</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Last 5 games vs season average — higher = hotter.{' '}
          <span style={{ color: 'var(--silver)' }}>Heat is 0–100.</span>
        </p>
      </div>

      <HeatGrid
        skaters={skaters}
        goalies={goalies}
        newcomers={newcomers as any[]}
        limit={16}
      />
    </div>
  );
}
