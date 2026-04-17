import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import SpotlightGames from '@/components/dashboard/SpotlightGames';
import NightlyStories from '@/components/dashboard/NightlyStories';
import BreakoutWatch from '@/components/dashboard/BreakoutWatch';
import HotRightNow from '@/components/dashboard/HotRightNow';
import { fetchRankings, fetchGames } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'NHL Momentum',
  description: 'Live NHL predictions, breakout player alerts, and momentum rankings — updated hourly.',
  openGraph: {
    title: 'NHL Momentum',
    description: 'Live NHL predictions, breakout player alerts, and momentum rankings — updated hourly.',
  },
};

const getRankings = cache(() => fetchRankings().catch(() => null));
const getTodayGames = cache((date: string) =>
  fetchGames(date).catch(() => ({ games: [], predictions: [], odds: [] }))
);

// ── Last Updated ──────────────────────────────────────────────────────────────

async function LastUpdatedLine() {
  const rankings = await getRankings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastCalc = (rankings?.momentumLeaders?.skaters as any)?.[0]?.calculated_at as string | undefined;
  const now = Date.now(); // eslint-disable-line react-hooks/purity
  const minsAgo = lastCalc
    ? Math.floor((now - new Date(lastCalc).getTime()) / 60000)
    : null;
  const label =
    minsAgo === null  ? null
    : minsAgo < 1    ? 'just now'
    : minsAgo < 60   ? `${minsAgo}m ago`
    : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago`
    : `${Math.floor(minsAgo / 1440)}d ago`;

  if (!label) return null;
  return (
    <p className="text-xs mt-2" style={{ color: 'var(--text)', opacity: 0.55 }}>
      Last updated {label}
    </p>
  );
}

// ── Spotlight ─────────────────────────────────────────────────────────────────

async function SpotlightSection({ today }: { today: string }) {
  const { games, predictions, odds } = await getTodayGames(today);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap: Record<number, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (predictions ?? []) as any[]) predMap[p.game_id] = p;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oddsMap: Record<number, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (odds ?? []) as any[]) oddsMap[o.game_id] = [...(oddsMap[o.game_id] ?? []), o];

  return <SpotlightGames games={games as never[]} predMap={predMap} oddsMap={oddsMap} />;
}

// ── Two-column panel ──────────────────────────────────────────────────────────

async function BreakoutWatchSection() {
  const rankings = await getRankings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakoutPlayers = (rankings?.breakoutWatch ?? []) as any[];
  return <BreakoutWatch players={breakoutPlayers} />;
}

async function HotRightNowSection() {
  const rankings = await getRankings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (rankings?.top100 ?? []) as any[];
  const lastUpdated = (raw[0] as { calculated_at?: string })?.calculated_at ?? null;
  const top10 = [...raw]
    .sort((a, b) => (b.momentum_ppm ?? -Infinity) - (a.momentum_ppm ?? -Infinity))
    .slice(0, 10);
  return <HotRightNow players={top10} lastUpdated={lastUpdated} />;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function GamesSkeleton() {
  return (
    <div className="rounded-xl border p-4 animate-pulse"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="h-3 w-28 rounded mb-4" style={{ background: 'var(--border)' }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {[1, 2].map(i => <div key={i} className="h-36 rounded-xl" style={{ background: 'var(--bg)' }} />)}
      </div>
      {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg mb-1.5" style={{ background: 'var(--bg)' }} />)}
    </div>
  );
}

function StoriesSkeleton() {
  return (
    <div className="rounded-xl border p-4 mb-6 animate-pulse"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="h-3 w-40 rounded mb-1" style={{ background: 'var(--border)' }} />
      <div className="h-2.5 w-28 rounded mb-3" style={{ background: 'var(--border)' }} />
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map(i => <div key={i} className="h-7 w-24 rounded-lg" style={{ background: 'var(--bg)' }} />)}
      </div>
      <div className="rounded-lg px-4 py-3 mb-4" style={{ background: 'var(--bg)' }}>
        {[1, 2, 3].map(i => <div key={i} className="h-2.5 rounded mb-2 w-full" style={{ background: 'var(--border)' }} />)}
      </div>
      {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg mb-1.5" style={{ background: 'var(--bg)' }} />)}
    </div>
  );
}

function TwoColumnPanelSkeleton() {
  return (
    <div className="rounded-xl border p-4 animate-pulse" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-32 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-5 w-20 rounded" style={{ background: 'var(--border)' }} />
      </div>
      <div className="h-2.5 w-3/4 rounded mb-4" style={{ background: 'var(--border)' }} />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2" style={{ background: 'var(--bg)' }}>
          <div className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1.5">
              <div className="h-3 w-28 rounded" style={{ background: 'var(--border)' }} />
              <div className="h-3 w-16 rounded" style={{ background: 'var(--border)' }} />
            </div>
            <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--border)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">

      {/* 1. Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-bright)' }}>
          NHL Momentum
        </h1>
        <p className="text-sm mt-1.5 max-w-xl" style={{ color: 'var(--text)' }}>
          See which NHL players are heating up right now — every skater scored
          on their last 5 games vs. their season average, refreshed hourly.
        </p>
        <Suspense fallback={<div className="h-3 w-28 rounded mt-2 animate-pulse" style={{ background: 'var(--border)' }} />}>
          <LastUpdatedLine />
        </Suspense>
      </div>

      {/* 2. Hero — Tonight's Games */}
      <div className="mb-10">
        <Suspense fallback={<GamesSkeleton />}>
          <SpotlightSection today={today} />
        </Suspense>
      </div>

      {/* 3. Two-column panel */}
      <div className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Suspense fallback={<TwoColumnPanelSkeleton />}>
            <BreakoutWatchSection />
          </Suspense>
          <Suspense fallback={<TwoColumnPanelSkeleton />}>
            <HotRightNowSection />
          </Suspense>
        </div>
      </div>

      {/* 4. Last Night in the NHL */}
      <div className="mb-10">
        <Suspense fallback={<StoriesSkeleton />}>
          <NightlyStories />
        </Suspense>
      </div>

      {/* 5. Explore CTAs */}
      <div className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/rankings"
            className="rounded-xl border p-5 flex flex-col gap-2 hover:opacity-90 transition-opacity"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)', opacity: 0.55 }}>Explore</span>
            <span className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>All Rankings</span>
            <span className="text-sm" style={{ color: 'var(--text)' }}>Season leaders, surge movers, and momentum PPM across every skater — six metrics, three time lenses.</span>
            <span className="mt-auto text-sm font-semibold" style={{ color: 'var(--neon)' }}>View rankings →</span>
          </a>

          <a href="/accuracy"
            className="rounded-xl border p-5 flex flex-col gap-2 hover:opacity-90 transition-opacity"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)', opacity: 0.55 }}>Evaluate</span>
            <span className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>Prediction Accuracy</span>
            <span className="text-sm" style={{ color: 'var(--text)' }}>How well our model picks game winners — historical results, calibration, and model version comparisons.</span>
            <span className="mt-auto text-sm font-semibold" style={{ color: 'var(--silver)' }}>View accuracy →</span>
          </a>
        </div>
      </div>

    </div>
  );
}
