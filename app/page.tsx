import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import RecentResults from '@/components/dashboard/RecentResults';
import UpcomingSlate from '@/components/dashboard/UpcomingSlate';
import HeatGrid from '@/components/dashboard/HeatGrid';
import NightlyStories from '@/components/dashboard/NightlyStories';
import { fetchRankings, fetchGames, fetchRecentCompletedGames } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'NHL Momentum',
  description: 'Results, predictions, and Heat rankings for every NHL game — updated hourly.',
  openGraph: {
    title: 'NHL Momentum',
    description: 'Results, predictions, and Heat rankings for every NHL game — updated hourly.',
  },
};

const getRankings = cache(() => fetchRankings().catch(() => null));
const getRecentGames = cache(() => fetchRecentCompletedGames(3, 30).catch(() => ({ games: [], predMap: new Map() })));
const getTodayGames = cache((date: string) =>
  fetchGames(date).catch(() => ({ games: [], predictions: [], odds: [] }))
);

// ── Section: Last Night (recent completed games) ──────────────────────────────

async function LastNightSection() {
  const { games, predMap } = await getRecentGames();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <RecentResults games={games as any[]} predMap={predMap} />;
}

// ── Section: Tonight (upcoming / live games) ──────────────────────────────────

async function TonightSection({ today }: { today: string }) {
  const { games, predictions, odds } = await getTodayGames(today);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap: Record<number, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (predictions ?? []) as any[]) predMap[p.game_id] = p;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oddsMap: Record<number, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (odds ?? []) as any[]) oddsMap[o.game_id] = [...(oddsMap[o.game_id] ?? []), o];

  return <UpcomingSlate games={games as never[]} predMap={predMap} oddsMap={oddsMap} />;
}

// ── Section: Who's burning (Heat grid) ───────────────────────────────────────

async function BurningSection() {
  const rankings = await getRankings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = ((rankings?.top100 ?? []) as any[])
    .sort((a, b) => (b.momentum_ppm ?? 0) - (a.momentum_ppm ?? 0))
    .slice(0, 20);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <HeatGrid players={players as any[]} />;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function GameListSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-9 rounded-lg animate-pulse" style={{ background: 'var(--bg-card)' }} />
      ))}
    </div>
  );
}

function HeatGridSkeleton() {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-0 flex flex-col gap-10">

      {/* 1. Last Night — recent completed games */}
      <Suspense fallback={<GameListSkeleton />}>
        <LastNightSection />
      </Suspense>

      {/* 2. Tonight — upcoming / live games */}
      <Suspense fallback={<GameListSkeleton />}>
        <TonightSection today={today} />
      </Suspense>

      {/* 3. Who's burning — Heat grid */}
      <Suspense fallback={<HeatGridSkeleton />}>
        <BurningSection />
      </Suspense>

      {/* 4. Last Night — AI recap stories */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)', opacity: 0.5 }}>
            Stories
          </h2>
        </div>
        <Suspense fallback={
          <div className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
        }>
          <NightlyStories />
        </Suspense>
      </section>

      {/* 5. Explore links */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/rankings"
          className="rounded-xl border p-4 hover:opacity-90 transition-opacity"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text)', opacity: 0.5 }}>Explore</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Heat Rankings</p>
          <p className="mt-1 text-xs font-medium" style={{ color: 'var(--heat)' }}>View →</p>
        </a>
        <a href="/accuracy"
          className="rounded-xl border p-4 hover:opacity-90 transition-opacity"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text)', opacity: 0.5 }}>Evaluate</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>How accurate is Heat?</p>
          <p className="mt-1 text-xs font-medium" style={{ color: 'var(--silver)' }}>View →</p>
        </a>
      </div>

    </div>
  );
}
