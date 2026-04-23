import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import RecapFeed from '@/components/dashboard/RecapFeed';
import TonightSection from '@/components/dashboard/TonightSection';
import ResultsSection from '@/components/dashboard/ResultsSection';
import HeatGrid from '@/components/dashboard/HeatGrid';
import { fetchRankings, fetchGames, fetchRecentRecaps, fetchRecentCompletedGames } from '@/lib/data';

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
const getTodayGames = cache((date: string) =>
  fetchGames(date).catch(() => ({ games: [], predictions: [], odds: [] }))
);
const getRecentRecaps = cache(() => fetchRecentRecaps(5).catch(() => []));
const getRecentGames = cache(() => fetchRecentCompletedGames(4, 40).catch(() => ({ games: [], predMap: new Map() })));

// ── Section: Last Night (recap feed — hero + 4 compact stories) ───────────────

async function LastNightSection() {
  const recaps = await getRecentRecaps();
  if (!recaps.length) return null;
  return <RecapFeed recaps={recaps} />;
}

// ── Section: Tonight (upcoming / live games) ──────────────────────────────────

async function TonightSlate({ today }: { today: string }) {
  const { games, predictions, odds } = await getTodayGames(today);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap: Record<number, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (predictions ?? []) as any[]) predMap[p.game_id] = p;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oddsMap: Record<number, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (odds ?? []) as any[]) oddsMap[o.game_id] = [...(oddsMap[o.game_id] ?? []), o];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TonightSection games={games as any[]} predMap={predMap} oddsMap={oddsMap} />;
}

// ── Section: Recent results ───────────────────────────────────────────────────

async function RecentResultsSection() {
  const { games, predMap } = await getRecentGames();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ResultsSection games={games as any[]} predMap={predMap} />;
}

// ── Section: Who's burning (Heat scroll) ─────────────────────────────────────

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

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)', minHeight: '280px' }} />
      <div className="flex flex-col gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
    </div>
  );
}

function GameSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)', height: '130px' }} />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
      ))}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
      ))}
    </div>
  );
}

function HeatScrollSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-shrink-0 rounded-2xl animate-pulse"
          style={{ background: 'var(--bg-card)', width: '140px', height: '190px' }} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0 flex flex-col gap-8">

      {/* 1. Last Night — cinematic recap hero */}
      <Suspense fallback={<HeroSkeleton />}>
        <LastNightSection />
      </Suspense>

      {/* 2. Tonight — split-color prediction cards */}
      <Suspense fallback={<GameSkeleton />}>
        <TonightSlate today={today} />
      </Suspense>

      {/* 3. Recent results — completed games with prediction outcomes */}
      <Suspense fallback={<ResultsSkeleton />}>
        <RecentResultsSection />
      </Suspense>

      {/* 4. Who's burning — horizontal heat scroll */}
      <Suspense fallback={<HeatScrollSkeleton />}>
        <BurningSection />
      </Suspense>

      {/* 4. Explore links */}
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
          <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Prediction accuracy</p>
          <p className="mt-1 text-xs font-medium" style={{ color: 'var(--silver)' }}>View →</p>
        </a>
      </div>

    </div>
  );
}
