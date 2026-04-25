import type { Metadata } from 'next';
import RankingsTable from '@/components/rankings/RankingsTable';
import { BurningSection } from '@/components/rankings/BurningSection';
import { BreakoutSection } from '@/components/rankings/BreakoutSection';
import { GoalieSection } from '@/components/rankings/GoalieSection';
import { NewcomerWatch } from '@/components/rankings/NewcomerWatch';
import { fetchRankings, fetchGoalieRankings, fetchNewcomerWatch } from '@/lib/data';

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
  const [data, goalies, newcomers] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchGoalieRankings().catch(() => []),
    fetchNewcomerWatch().catch(() => []),
  ]);

  const players    = data?.top100 ?? [];
  const hotSkaters = data?.momentumLeaders?.skaters ?? [];
  // Full top100 sorted by breakout_delta gives BreakoutSection enough candidates
  // after the underdog filter (season_games >= 20, season_ppm < threshold) runs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakout   = [...(data?.top100 ?? []) as any[]].sort(
    (a, b) => (b.breakout_delta ?? 0) - (a.breakout_delta ?? 0)
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Heat Rankings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Last 5 vs season — higher = hotter.{' '}
          <span style={{ color: 'var(--silver)' }}>Heat is 0–100.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <BurningSection players={hotSkaters} />
        <BreakoutSection players={breakout} />
        <GoalieSection goalies={goalies} />
      </div>

      <NewcomerWatch newcomers={newcomers} />

      <RankingsTable players={players} />
    </div>
  );
}
