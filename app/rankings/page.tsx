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
        <p style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.69rem',
          color: 'var(--heat)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
        }}>
          ALL SKATERS · BY HEAT
        </p>
        <h1 style={{
          fontFamily: 'var(--font-geist-sans), sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'var(--text-bright)',
        }}>
          The <span style={{ color: 'var(--heat)' }}>rankings.</span>
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
          Sorted by Heat. The current state of every player in one place.{' '}
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
