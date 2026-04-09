import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import BreakoutWatch from '@/components/dashboard/BreakoutWatch';
import PlayerLeaderboard, { type LeaderboardConfig } from '@/components/dashboard/PlayerLeaderboard';
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

const getRankings = cache(() => fetchRankings().catch(() => null));
const getTodayGames = cache((date: string) =>
  fetchGames(date).catch(() => ({ games: [], predictions: [], odds: [] }))
);

// ── Leaderboard configs ───────────────────────────────────────────────────────

const CONFIGS: Record<string, LeaderboardConfig> = {
  seasonPpm: {
    title: '🏅 Season Leaders',
    subtitle: 'Top skaters by season PPM — consistent performers across the whole season.',
    badge: 'Full Season',
    color: 'var(--silver)',
    colorBg: 'rgba(148,163,184,0.12)',
    metricKey: 'season_ppm',
    decimals: 4,
    metricLabel: 'PPM',
    fullPageHref: '/rankings',
  },
  momentumPpm: {
    title: '⚡ Momentum Leaders',
    subtitle: 'Top skaters by PPM in their last 5 games — who\'s hottest right now.',
    badge: 'Last 5 Games',
    color: 'var(--neon)',
    colorBg: 'var(--neon-glow)',
    metricKey: 'momentum_ppm',
    decimals: 4,
    metricLabel: 'PPM',
    fullPageHref: '/rankings',
  },
  seasonGoals: {
    title: '🎯 Goal Scorers',
    subtitle: 'Skaters with the most goals on the season — the pure finishers.',
    badge: 'Season Goals',
    color: 'var(--red)',
    colorBg: 'rgba(239,68,68,0.12)',
    metricKey: 'season_goals',
    decimals: 0,
    metricLabel: 'G',
    fullPageHref: '/rankings',
  },
  seasonPoints: {
    title: '📊 Points Leaders',
    subtitle: 'Season points leaders — goals + assists over the full campaign.',
    badge: 'Season Pts',
    color: 'var(--silver)',
    colorBg: 'rgba(148,163,184,0.12)',
    metricKey: 'season_points',
    decimals: 0,
    metricLabel: 'pts',
    fullPageHref: '/rankings',
  },
  compositePpm: {
    title: '🧠 Model Score',
    subtitle: 'Composite PPM — the model\'s overall signal blending season + momentum + SOS.',
    badge: 'Composite',
    color: 'var(--neon)',
    colorBg: 'var(--neon-glow)',
    metricKey: 'composite_ppm',
    decimals: 4,
    metricLabel: 'PPM',
    fullPageHref: '/rankings',
  },
  hotGoals: {
    title: '🔴 Hot Scorers',
    subtitle: 'Skaters scoring the most goals in their last 5 games — on fire.',
    badge: 'Last 5 Goals',
    color: 'var(--red)',
    colorBg: 'rgba(239,68,68,0.12)',
    metricKey: 'momentum_goals',
    decimals: 0,
    metricLabel: 'G',
    fullPageHref: '/rankings',
  },
  hotAssists: {
    title: '🎩 Top Playmakers',
    subtitle: 'Skaters with the most assists in their last 5 games — setting up goals.',
    badge: 'Last 5 Assists',
    color: 'var(--green)',
    colorBg: 'rgba(34,197,94,0.12)',
    metricKey: 'momentum_assists',
    decimals: 0,
    metricLabel: 'A',
    fullPageHref: '/rankings',
  },
  energy: {
    title: '⚡ Freshest Legs',
    subtitle: 'Players with the highest energy bar — well-rested and ready to perform.',
    badge: 'Energy',
    color: 'var(--green)',
    colorBg: 'rgba(34,197,94,0.12)',
    metricKey: 'energy_bar',
    decimals: 0,
    metricLabel: '%',
    fullPageHref: '/rankings',
  },
};

// ── Server components ─────────────────────────────────────────────────────────

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortTop10(arr: any[], key: string): any[] {
  return [...arr].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0)).slice(0, 10);
}

async function PlayerMetrics() {
  const rankings = await getRankings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top = (rankings?.top100 ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakout = (rankings?.breakoutWatch ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastUpdated = (top[0] as any)?.calculated_at as string | null ?? null;

  // Derive all leaderboards from top100 (already fetched — no extra DB queries)
  const lists = {
    seasonPpm:    sortTop10(top, 'season_ppm'),
    momentumPpm:  sortTop10(top, 'momentum_ppm'),
    seasonGoals:  sortTop10(top, 'season_goals'),
    seasonPoints: sortTop10(top, 'season_points'),
    compositePpm: sortTop10(top, 'composite_ppm'),
    hotGoals:     sortTop10(top, 'momentum_goals'),
    hotAssists:   sortTop10(top, 'momentum_assists'),
    energy:       sortTop10(top, 'energy_bar'),
  };

  return (
    <>
      {/* Row 1 — PPM Perspectives */}
      <SectionHeading label="PPM Perspectives" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PlayerLeaderboard config={CONFIGS.seasonPpm}    players={lists.seasonPpm}    lastUpdated={lastUpdated} />
        <BreakoutWatch players={breakout} lastUpdated={lastUpdated} />
        <PlayerLeaderboard config={CONFIGS.momentumPpm}  players={lists.momentumPpm}  lastUpdated={lastUpdated} />
      </div>

      {/* Row 2 — Season Performance */}
      <SectionHeading label="Season Performance" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PlayerLeaderboard config={CONFIGS.seasonGoals}  players={lists.seasonGoals}  lastUpdated={lastUpdated} />
        <PlayerLeaderboard config={CONFIGS.seasonPoints} players={lists.seasonPoints} lastUpdated={lastUpdated} />
        <PlayerLeaderboard config={CONFIGS.compositePpm} players={lists.compositePpm} lastUpdated={lastUpdated} />
      </div>

      {/* Row 3 — Last 5 Games */}
      <SectionHeading label="Last 5 Games" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PlayerLeaderboard config={CONFIGS.hotGoals}   players={lists.hotGoals}   lastUpdated={lastUpdated} />
        <PlayerLeaderboard config={CONFIGS.hotAssists} players={lists.hotAssists} lastUpdated={lastUpdated} />
        <PlayerLeaderboard config={CONFIGS.energy}     players={lists.energy}     lastUpdated={lastUpdated} />
      </div>
    </>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text)', opacity: 0.5 }}>
        {label}
      </h2>
    </div>
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
        {[1, 2].map(i => <div key={i} className="h-36 rounded-xl" style={{ background: 'var(--bg)' }} />)}
      </div>
      {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg mb-1.5" style={{ background: 'var(--bg)' }} />)}
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <>
      {[1, 2, 3].map(row => (
        <div key={row}>
          <div className="h-3 w-32 rounded mb-3" style={{ background: 'var(--border)' }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(col => (
              <div key={col} className="rounded-xl border p-4 animate-pulse"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="h-3 w-28 rounded mb-4" style={{ background: 'var(--border)' }} />
                {[1, 2, 3, 4, 5].map(j => (
                  <div key={j} className="h-11 rounded-lg mb-2" style={{ background: 'var(--bg)' }} />
                ))}
              </div>
            ))}
          </div>
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

      {/* Spotlight games */}
      <div className="mb-8">
        <Suspense fallback={<GamesSkeleton />}>
          <SpotlightSection today={today} />
        </Suspense>
      </div>

      {/* Player metrics — 3 rows of 3 */}
      <Suspense fallback={<MetricsSkeleton />}>
        <PlayerMetrics />
      </Suspense>

    </div>
  );
}
