import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import RecapFeed from '@/components/dashboard/RecapFeed';
import TonightSection from '@/components/dashboard/TonightSection';
import ResultsSection from '@/components/dashboard/ResultsSection';
import HeatGrid from '@/components/dashboard/HeatGrid';
import DailyBrandStrip from '@/components/dashboard/DailyBrandStrip';
import { fetchRankings, fetchGames, fetchRecentRecaps, fetchRecentCompletedGames } from '@/lib/data';
import { playerUrl } from '@/lib/urls';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Hockey Momentum — Hockey Intelligence, Daily',
  description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings for every NHL game — updated live.',
  openGraph: {
    title: 'Hockey Momentum — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Stories, predictions and rankings for every NHL game.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hockey Momentum — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Stories, predictions and rankings — updated live.',
  },
};

const getRankings = cache(() => fetchRankings().catch(() => null));
const getTodayGames = cache((date: string) =>
  fetchGames(date).catch(() => ({ games: [], predictions: [], odds: [] }))
);
const getRecentRecaps = cache(() => fetchRecentRecaps(5).catch(() => []));
const getRecentGames = cache(() => fetchRecentCompletedGames(2, 15).catch(() => ({ games: [], predMap: new Map() })));

// ── Section: Brand strip (daily masthead) ─────────────────────────────────────

async function BrandStripSection({ today }: { today: string }) {
  const [rankings, { games }] = await Promise.all([
    getRankings(),
    getTodayGames(today),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top = ((rankings?.top100 ?? []) as any[])
    .sort((a: any, b: any) => (b.momentum_ppm ?? 0) - (a.momentum_ppm ?? 0))[0];

  const topPlayer = top ? {
    name: `${top.players.first_name} ${top.players.last_name}`,
    team: top.players.teams?.abbrev ?? '',
    ppm: top.momentum_ppm ?? 0,
    href: playerUrl(top.player_id, top.players.first_name, top.players.last_name),
  } : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameCount = (games as any[]).filter((g: any) =>
    ['LIVE', 'CRIT', 'PRE', 'FUT', 'SCHEDULED'].includes(g.game_state ?? '') ||
    g.game_state == null
  ).length;

  return <DailyBrandStrip topPlayer={topPlayer} gameCount={gameCount} />;
}

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

function BrandStripSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="flex flex-col gap-1">
          <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-6 w-48 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-3 w-40 rounded animate-pulse" style={{ background: 'var(--border)' }} />
        </div>
        <div className="h-3 w-16 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      </div>
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-32 flex-shrink-0 rounded-lg animate-pulse" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
      <div className="h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

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

      {/* 0. Daily masthead — brand identity + story hooks */}
      <Suspense fallback={<BrandStripSkeleton />}>
        <BrandStripSection today={today} />
      </Suspense>

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

      {/* 5. Explore — story entry points */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text)', opacity: 0.4 }}>Explore</p>
        <div className="grid grid-cols-2 gap-3">
          <a href="/rankings"
            className="rounded-xl border p-4 hover:opacity-90 transition-opacity group"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-lg mb-1">⚡</div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Heat Rankings</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text)' }}>
              Who's playing the best hockey right now
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--heat)' }}>View rankings →</p>
          </a>
          <a href="/games"
            className="rounded-xl border p-4 hover:opacity-90 transition-opacity group"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-lg mb-1">🏒</div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Games & Predictions</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text)' }}>
              AI win predictions vs bookmaker odds
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--neon)' }}>See predictions →</p>
          </a>
          <a href="/recaps"
            className="rounded-xl border p-4 hover:opacity-90 transition-opacity group"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-lg mb-1">📰</div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Daily Recaps</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text)' }}>
              Data-backed stories from every game night
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--silver)' }}>Read stories →</p>
          </a>
          <a href="/teams"
            className="rounded-xl border p-4 hover:opacity-90 transition-opacity group"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-lg mb-1">🛡</div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Teams</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text)' }}>
              Roster momentum, form and player status
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--green)' }}>Browse teams →</p>
          </a>
        </div>
      </div>

    </div>
  );
}
