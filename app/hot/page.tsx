import type { Metadata } from 'next';
import HeatGrid from '@/components/dashboard/HeatGrid';
import BreakoutWatch from '@/components/dashboard/BreakoutWatch';
import CoolingOff from '@/components/dashboard/CoolingOff';
import { fetchRankings, fetchGoalieRankings, fetchNewcomerWatch, fetchSeasonPhase } from '@/lib/data';

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Who's Hot",
  description: 'The hottest players in the NHL right now — skaters, goalies, and breakout newcomers ranked by 5-game momentum.',
  openGraph: {
    title: "Who's Hot — momentum.",
    description: 'Skaters, goalies and fresh faces ranked by 5-game momentum score.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Who's Hot — momentum.",
    description: 'The hottest players in the NHL right now. Updated daily.',
  },
};

export default async function HotPage() {
  const [data, goalies, newcomers, seasonPhase] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchGoalieRankings().catch(() => []),
    fetchNewcomerWatch().catch(() => []),
    fetchSeasonPhase().catch(() => ({ isPreseason: false })),
  ]);
  const seasonHasStarted = !seasonPhase.isPreseason;

  const skaters = data?.momentumLeaders?.skaters ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakoutPlayers: any[] = data?.breakoutWatch ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coolingPlayers: any[] = [...(data?.top100 ?? [])]
    .filter(p => (p.breakout_delta ?? 0) < 0)
    .sort((a, b) => (a.breakout_delta ?? 0) - (b.breakout_delta ?? 0))
    .slice(0, 10);

  const lastUpdated = breakoutPlayers[0]?.calculated_at ?? null;

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 style={{
          fontFamily: 'var(--font-fraunces), Georgia, serif',
          fontWeight: 900,
          fontSize: '1.75rem',
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
        }}>
          <span style={{ color: 'var(--text-bright)' }}>Burning </span>
          <span style={{ color: 'var(--heat)' }}>right now.</span>
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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <BreakoutWatch
          players={breakoutPlayers}
          lastUpdated={lastUpdated}
          seasonHasStarted={seasonHasStarted}
        />
        <CoolingOff
          players={coolingPlayers}
          lastUpdated={lastUpdated}
          seasonHasStarted={seasonHasStarted}
        />
      </div>
    </div>
  );
}
