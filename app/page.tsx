import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import MomentumLeaders from '@/components/dashboard/MomentumLeaders';
import BreakoutWatch from '@/components/dashboard/BreakoutWatch';
import TodaysGames from '@/components/dashboard/TodaysGames';
import { fetchRankings, fetchGames } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Today\'s NHL momentum leaders, breakout watch, and scheduled games at a glance.',
  openGraph: {
    title: 'Dashboard — NHL Momentum',
    description: 'Today\'s NHL momentum leaders, breakout watch, and scheduled games at a glance.',
  },
};

// Deduplicate fetches across server components in the same render pass
const getRankings = cache(() => fetchRankings().catch(() => null));
const getTodayGames = cache((date: string) =>
  fetchGames(date).catch(() => ({ games: [], predictions: [] }))
);

async function DashboardStats({ today }: { today: string }) {
  const [rankings, { games }] = await Promise.all([
    getRankings(),
    getTodayGames(today),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastCalc = (rankings?.momentumLeaders?.skaters as any)?.[0]?.calculated_at as string | undefined;
  const minsAgo = lastCalc
    ? Math.floor((Date.now() - new Date(lastCalc).getTime()) / 60000)
    : null;
  const updatedLabel =
    minsAgo === null ? '—'
    : minsAgo < 1   ? 'just now'
    : minsAgo < 60  ? `${minsAgo}m ago`
    : `${Math.floor(minsAgo / 60)}h ago`;

  const playerCount = (rankings?.top100?.length ?? 0) >= 100 ? '100+' : String(rankings?.top100?.length ?? '—');
  const gameCount = (games as unknown[]).length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'Players Tracked', value: playerCount },
        { label: 'Games Today',     value: gameCount > 0 ? String(gameCount) : 'None' },
        { label: 'Last Updated',    value: updatedLabel },
      ].map(s => (
        <div key={s.label} className="rounded-lg border p-3 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-lg font-bold font-mono" style={{ color: 'var(--neon)' }}>{s.value}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

async function LeadersAndBreakout() {
  const rankings = await getRankings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaders = (rankings?.momentumLeaders?.skaters ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakout = (rankings?.breakoutWatch ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastUpdated = (leaders[0] as any)?.calculated_at as string | null ?? null;
  return (
    <>
      <div>
        <MomentumLeaders players={leaders} lastUpdated={lastUpdated} />
      </div>
      <div>
        <BreakoutWatch players={breakout} lastUpdated={lastUpdated} />
      </div>
    </>
  );
}

async function GamesPanel({ today }: { today: string }) {
  const { games } = await getTodayGames(today);
  return <TodaysGames games={games as never[]} />;
}

function StatSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-lg border p-3 animate-pulse"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="h-6 rounded mb-1.5 mx-auto w-16" style={{ background: 'var(--border)' }} />
          <div className="h-2.5 rounded mx-auto w-20" style={{ background: 'var(--border)' }} />
        </div>
      ))}
    </div>
  );
}

function PanelSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4 animate-pulse"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="h-3 w-28 rounded mb-4" style={{ background: 'var(--border)' }} />
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="h-11 rounded-lg mb-2" style={{ background: 'var(--bg)' }} />
          ))}
        </div>
      ))}
    </>
  );
}

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

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
      <Suspense fallback={<StatSkeleton />}>
        <DashboardStats today={today} />
      </Suspense>

      {/* Main grid — sm: Leaders|Breakout on row 1, Games full-width row 2; lg: all 3 in one row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense fallback={<PanelSkeleton count={2} />}>
          <LeadersAndBreakout />
        </Suspense>
        <div className="sm:col-span-2 lg:col-span-1">
          <Suspense fallback={
            <div className="rounded-xl border p-4 animate-pulse"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="h-3 w-24 rounded mb-4" style={{ background: 'var(--border)' }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg mb-2" style={{ background: 'var(--bg)' }} />
              ))}
            </div>
          }>
            <GamesPanel today={today} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
