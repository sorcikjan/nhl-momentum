import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import MomentumLeaders from '@/components/dashboard/MomentumLeaders';
import BreakoutWatch from '@/components/dashboard/BreakoutWatch';
import SeasonLeaders from '@/components/dashboard/SeasonLeaders';
import SpotlightGames from '@/components/dashboard/SpotlightGames';
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
  fetchGames(date).catch(() => ({ games: [], predictions: [], odds: [] }))
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
    minsAgo === null  ? '—'
    : minsAgo < 1    ? 'just now'
    : minsAgo < 60   ? `${minsAgo}m ago`
    : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago`
    : `${Math.floor(minsAgo / 1440)}d ago`;

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

// ── Spotlight games section ────────────────────────────────────────────────────

async function SpotlightSection({ today }: { today: string }) {
  const { games, predictions, odds } = await getTodayGames(today);

  // Build prediction lookup: game_id → prediction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap: Record<number, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (predictions ?? []) as any[]) predMap[p.game_id] = p;

  // Build odds lookup: game_id → array of odds rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oddsMap: Record<number, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (odds ?? []) as any[]) {
    oddsMap[o.game_id] = [...(oddsMap[o.game_id] ?? []), o];
  }

  return (
    <SpotlightGames
      games={games as never[]}
      predMap={predMap}
      oddsMap={oddsMap}
    />
  );
}

// ── Player panels section ─────────────────────────────────────────────────────

async function PlayerPanels() {
  const rankings = await getRankings();
  // momentumLeaders.skaters has up to 10 (default show 5, expand to 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaders  = (rankings?.momentumLeaders?.skaters ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakout = (rankings?.breakoutWatch ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastUpdated = (leaders[0] as any)?.calculated_at as string | null ?? null;

  // Season leaders: top100 re-sorted by season_ppm (top 10 passed, component shows 5 by default)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasonLeaders = [...(rankings?.top100 ?? [])]
    .sort((a, b) => ((b as never as { season_ppm: number }).season_ppm ?? 0) - ((a as never as { season_ppm: number }).season_ppm ?? 0))
    .slice(0, 10) as never[];

  return (
    <>
      <SeasonLeaders players={seasonLeaders} lastUpdated={lastUpdated} />
      <BreakoutWatch players={breakout} lastUpdated={lastUpdated} />
      <MomentumLeaders players={leaders} lastUpdated={lastUpdated} />
    </>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

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

function GamesSkeleton() {
  return (
    <div className="rounded-xl border p-4 animate-pulse"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="h-3 w-28 rounded mb-4" style={{ background: 'var(--border)' }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {[1, 2].map(i => (
          <div key={i} className="h-36 rounded-xl" style={{ background: 'var(--bg)' }} />
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="h-10 rounded-lg mb-1.5" style={{ background: 'var(--bg)' }} />
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>NHL Momentum</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          See which NHL players are heating up right now. We score every skater&apos;s last 5 games and compare it to their season average — refreshed hourly.
        </p>
      </div>

      {/* Stat bar */}
      <Suspense fallback={<StatSkeleton />}>
        <DashboardStats today={today} />
      </Suspense>

      {/* Spotlight games — full width top section */}
      <div className="mb-6">
        <Suspense fallback={<GamesSkeleton />}>
          <SpotlightSection today={today} />
        </Suspense>
      </div>

      {/* Player Metrics */}
      <div className="mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)', opacity: 0.6 }}>
          Player Metrics
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Suspense fallback={<PanelSkeleton count={3} />}>
          <PlayerPanels />
        </Suspense>
      </div>
    </div>
  );
}
