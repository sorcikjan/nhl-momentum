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
      <div className="mb-8">
        <h1 style={{
          fontFamily: 'var(--font-fraunces), Georgia, serif',
          fontWeight: 900,
          fontSize: '1.75rem',
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
        }}>
          <span style={{ color: 'var(--text-bright)' }}>The </span>
          <span style={{ color: 'var(--heat)' }}>rankings.</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Top 100 skaters by momentum score.{' '}
          <span style={{ color: 'var(--silver)' }}>Heat is 0–100.</span>
        </p>
      </div>

      <RankingsTable
        players={players}
        seasonHasStarted={!seasonPhase.isPreseason}
        sparklineSnapshots={sparklineSnapshots}
      />
    </div>
  );
}
