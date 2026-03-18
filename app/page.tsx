import type { Metadata } from 'next';
import MomentumLeaders from '@/components/dashboard/MomentumLeaders';
import BreakoutWatch from '@/components/dashboard/BreakoutWatch';
import TodaysGames from '@/components/dashboard/TodaysGames';
import { fetchRankings, fetchGames } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Today\'s NHL momentum leaders, breakout watch, and scheduled games at a glance.',
  openGraph: {
    title: 'Dashboard — NHL Momentum',
    description: 'Today\'s NHL momentum leaders, breakout watch, and scheduled games at a glance.',
  },
};

export default async function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [rankings, { games }] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchGames(today).catch(() => ({ games: [], predictions: [] })),
  ]);

  const leaders = rankings?.momentumLeaders?.skaters ?? [];
  const breakout = rankings?.breakoutWatch ?? [];

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Momentum-based NHL analytics · Model v1.0
        </p>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Players Tracked', value: rankings ? `${rankings.top100.length}+` : '—' },
          { label: 'Momentum Window', value: 'Last 5 G' },
          { label: 'Model Version',   value: 'v1.1' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border p-3 text-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--neon)' }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <MomentumLeaders players={leaders} />
        </div>
        <div className="lg:col-span-1">
          <BreakoutWatch players={breakout} />
        </div>
        <div className="lg:col-span-1">
          <TodaysGames games={games as never[]} />
        </div>
      </div>
    </div>
  );
}
