import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import PlayerLeaderboard, { type LeaderboardConfig } from '@/components/dashboard/PlayerLeaderboard';
import SpotlightGames from '@/components/dashboard/SpotlightGames';
import NightlyStories from '@/components/dashboard/NightlyStories';
import { fetchRankings, fetchGames, fetchPipelineStatus } from '@/lib/data';

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

// ── Metric row definitions ────────────────────────────────────────────────────
// Each row = one metric. Three lenses: Season | Surge | Last 5 Games.
// Color convention:  silver = season baseline  |  amber = surge  |  neon = recent

interface MetricRow {
  label: string;           // section heading
  season: LeaderboardConfig;
  surge: LeaderboardConfig;
  momentum: LeaderboardConfig;
}

const ROWS: MetricRow[] = [
  // ── PPM ──────────────────────────────────────────────────────────────────
  {
    label: 'PPM — Points Per Momentum',
    season: {
      title: '🏅 Season PPM',
      subtitle: 'Top skaters by season-long PPM — the consistent performers.',
      badge: 'Full Season',
      color: 'var(--silver)', colorBg: 'rgba(148,163,184,0.12)',
      metricKey: 'season_ppm', decimals: 4, metricLabel: 'PPM',
      fullPageHref: '/rankings',
    },
    surge: {
      title: '🔥 PPM Surge',
      subtitle: 'Biggest jump in PPM vs their own season average — the breakout artists.',
      badge: 'vs Season',
      color: 'var(--amber)', colorBg: 'rgba(245,158,11,0.12)',
      metricKey: 'breakout_delta', decimals: 4, metricLabel: 'PPM+', signed: true,
      fullPageHref: '/rankings',
    },
    momentum: {
      title: '⚡ Momentum PPM',
      subtitle: 'Highest PPM over the last 5 games — who\'s on fire right now.',
      badge: 'Last 5 Games',
      color: 'var(--neon)', colorBg: 'var(--neon-glow)',
      metricKey: 'momentum_ppm', decimals: 4, metricLabel: 'PPM',
      fullPageHref: '/rankings',
    },
  },

  // ── Goals ─────────────────────────────────────────────────────────────────
  {
    label: 'Goals',
    season: {
      title: '🎯 Season Goals',
      subtitle: 'Most goals scored on the season — the pure finishers.',
      badge: 'Full Season',
      color: 'var(--silver)', colorBg: 'rgba(148,163,184,0.12)',
      metricKey: 'season_goals', decimals: 0, metricLabel: 'G',
      fullPageHref: '/rankings',
    },
    surge: {
      title: '🔥 Goal Surge',
      subtitle: 'Scoring goals at the highest rate above their season pace.',
      badge: 'vs Season',
      color: 'var(--amber)', colorBg: 'rgba(245,158,11,0.12)',
      metricKey: '_goals_surge', decimals: 2, metricLabel: 'G/gm+', signed: true,
      fullPageHref: '/rankings',
    },
    momentum: {
      title: '⚡ Hot Scorers',
      subtitle: 'Most goals in their last 5 games — the current snipers.',
      badge: 'Last 5 Games',
      color: 'var(--neon)', colorBg: 'var(--neon-glow)',
      metricKey: 'momentum_goals', decimals: 0, metricLabel: 'G',
      fullPageHref: '/rankings',
    },
  },

  // ── Assists ───────────────────────────────────────────────────────────────
  {
    label: 'Assists',
    season: {
      title: '🎩 Season Assists',
      subtitle: 'Most assists on the season — the elite playmakers.',
      badge: 'Full Season',
      color: 'var(--silver)', colorBg: 'rgba(148,163,184,0.12)',
      metricKey: 'season_assists', decimals: 0, metricLabel: 'A',
      fullPageHref: '/rankings',
    },
    surge: {
      title: '🔥 Assist Surge',
      subtitle: 'Dishing assists at the highest rate above their season pace.',
      badge: 'vs Season',
      color: 'var(--amber)', colorBg: 'rgba(245,158,11,0.12)',
      metricKey: '_assists_surge', decimals: 2, metricLabel: 'A/gm+', signed: true,
      fullPageHref: '/rankings',
    },
    momentum: {
      title: '⚡ Hot Playmakers',
      subtitle: 'Most assists in their last 5 games — on a passing streak.',
      badge: 'Last 5 Games',
      color: 'var(--neon)', colorBg: 'var(--neon-glow)',
      metricKey: 'momentum_assists', decimals: 0, metricLabel: 'A',
      fullPageHref: '/rankings',
    },
  },

  // ── Points ────────────────────────────────────────────────────────────────
  {
    label: 'Points',
    season: {
      title: '📊 Season Points',
      subtitle: 'Season points leaders — goals + assists, the complete picture.',
      badge: 'Full Season',
      color: 'var(--silver)', colorBg: 'rgba(148,163,184,0.12)',
      metricKey: 'season_points', decimals: 0, metricLabel: 'pts',
      fullPageHref: '/rankings',
    },
    surge: {
      title: '🔥 Points Surge',
      subtitle: 'Producing points at the highest rate above their season pace.',
      badge: 'vs Season',
      color: 'var(--amber)', colorBg: 'rgba(245,158,11,0.12)',
      metricKey: '_points_surge', decimals: 2, metricLabel: 'pts/gm+', signed: true,
      fullPageHref: '/rankings',
    },
    momentum: {
      title: '⚡ Hot Point Getters',
      subtitle: 'Most points in their last 5 games — producing at every turn.',
      badge: 'Last 5 Games',
      color: 'var(--neon)', colorBg: 'var(--neon-glow)',
      metricKey: 'momentum_points', decimals: 0, metricLabel: 'pts',
      fullPageHref: '/rankings',
    },
  },

  // ── Shooting % ────────────────────────────────────────────────────────────
  {
    label: 'Shooting %',
    season: {
      title: '🎯 Season Shot%',
      subtitle: 'Best season shooting percentage — skaters who make shots count.',
      badge: 'Full Season',
      color: 'var(--silver)', colorBg: 'rgba(148,163,184,0.12)',
      metricKey: '_season_shot_pct', decimals: 1, metricLabel: '%',
      fullPageHref: '/rankings',
    },
    surge: {
      title: '🔥 Shot% Surge',
      subtitle: 'Shooting percentage climbing furthest above their season average.',
      badge: 'vs Season',
      color: 'var(--amber)', colorBg: 'rgba(245,158,11,0.12)',
      metricKey: '_shot_pct_surge', decimals: 1, metricLabel: '%+', signed: true,
      fullPageHref: '/rankings',
    },
    momentum: {
      title: '⚡ Hot Shot%',
      subtitle: 'Best shooting percentage over the last 5 games — dialled in.',
      badge: 'Last 5 Games',
      color: 'var(--neon)', colorBg: 'var(--neon-glow)',
      metricKey: '_momentum_shot_pct', decimals: 1, metricLabel: '%',
      fullPageHref: '/rankings',
    },
  },

  // ── Ice Time ──────────────────────────────────────────────────────────────
  {
    label: 'Ice Time (min/game)',
    season: {
      title: '⏱ Season TOI',
      subtitle: 'Most minutes per game on the season — the coaches\' trust.',
      badge: 'Full Season',
      color: 'var(--silver)', colorBg: 'rgba(148,163,184,0.12)',
      metricKey: '_season_toi_mins', decimals: 1, metricLabel: 'min',
      fullPageHref: '/rankings',
    },
    surge: {
      title: '🔥 TOI Surge',
      subtitle: 'Ice time climbing furthest above their season average — earning more trust.',
      badge: 'vs Season',
      color: 'var(--amber)', colorBg: 'rgba(245,158,11,0.12)',
      metricKey: '_toi_surge_mins', decimals: 1, metricLabel: 'min+', signed: true,
      fullPageHref: '/rankings',
    },
    momentum: {
      title: '⚡ Recent TOI',
      subtitle: 'Most minutes per game in their last 5 — heavily deployed right now.',
      badge: 'Last 5 Games',
      color: 'var(--neon)', colorBg: 'var(--neon-glow)',
      metricKey: '_momentum_toi_mins', decimals: 1, metricLabel: 'min',
      fullPageHref: '/rankings',
    },
  },
];

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
  return [...arr].sort((a, b) => (b[key] ?? -Infinity) - (a[key] ?? -Infinity)).slice(0, 10);
}

async function PlayerMetrics() {
  const rankings = await getRankings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (rankings?.top100 ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastUpdated = (raw[0] as any)?.calculated_at as string | null ?? null;

  // Enrich each player with derived fields used by surge and toi columns.
  // All math happens once here on the server — components just read the key.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top = raw.map((p: any) => {
    const sg = Math.max(1, p.season_games ?? 1);
    const mg = Math.max(1, p.momentum_games ?? 5);

    // Per-game rates
    const seasonGoalsPerGame  = (p.season_goals ?? 0)  / sg;
    const seasonAssistsPerGame = (p.season_assists ?? 0) / sg;
    const seasonPointsPerGame  = (p.season_points ?? 0)  / sg;
    const seasonToiMins        = (p.season_toi_sec ?? 0) / 60 / sg;

    const momentumGoalsPerGame  = (p.momentum_goals ?? 0)  / mg;
    const momentumAssistsPerGame = (p.momentum_assists ?? 0) / mg;
    const momentumPointsPerGame  = (p.momentum_points ?? 0)  / mg;
    const momentumToiMins        = (p.momentum_toi_sec ?? 0) / 60 / mg;

    // Shooting % — stored as 0–1 fraction, display as 0–100
    const seasonShotPct   = (p.season_shooting_pct   ?? 0) * 100;
    const momentumShotPct = (p.momentum_shooting_pct ?? 0) * 100;

    return {
      ...p,
      // Surge (delta) fields
      _goals_surge:    momentumGoalsPerGame  - seasonGoalsPerGame,
      _assists_surge:  momentumAssistsPerGame - seasonAssistsPerGame,
      _points_surge:   momentumPointsPerGame  - seasonPointsPerGame,
      _shot_pct_surge: momentumShotPct - seasonShotPct,
      _toi_surge_mins: momentumToiMins - seasonToiMins,
      // Display-ready fields
      _season_shot_pct:   seasonShotPct,
      _momentum_shot_pct: momentumShotPct,
      _season_toi_mins:   seasonToiMins,
      _momentum_toi_mins: momentumToiMins,
    };
  });

  return (
    <>
      {ROWS.map(row => (
        <div key={row.label} className="mb-8">
          <div className="mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
              {row.label}
            </h2>
          </div>

          {/* Mobile: momentum (last 5 games) only — clean single-column feed */}
          <div className="md:hidden">
            <PlayerLeaderboard
              config={row.momentum}
              players={sortTop10(top, row.momentum.metricKey)}
              lastUpdated={lastUpdated}
              compact
            />
          </div>

          {/* Desktop: all three views side by side */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-4">
            <PlayerLeaderboard config={row.season}   players={sortTop10(top, row.season.metricKey)}   lastUpdated={lastUpdated} />
            <PlayerLeaderboard config={row.surge}    players={sortTop10(top, row.surge.metricKey)}    lastUpdated={lastUpdated} />
            <PlayerLeaderboard config={row.momentum} players={sortTop10(top, row.momentum.metricKey)} lastUpdated={lastUpdated} />
          </div>
        </div>
      ))}

      {/* Mobile hint — season & surge available on Rankings */}
      <div className="md:hidden rounded-xl border p-4 text-center mb-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-xs mb-2" style={{ color: 'var(--text)' }}>
          Showing current-form leaders (last 5 games)
        </p>
        <a href="/rankings"
          className="text-sm font-semibold"
          style={{ color: 'var(--neon)' }}>
          See season leaders &amp; surge rankings →
        </a>
      </div>
    </>
  );
}

// ── Pipeline Status ───────────────────────────────────────────────────────────

function relTime(ts: string | null): { label: string; status: 'ok' | 'warn' | 'stale' } {
  if (!ts) return { label: 'never', status: 'stale' };
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  const label =
    mins < 1     ? 'just now'
    : mins < 60  ? `${mins}m ago`
    : mins < 1440 ? `${Math.floor(mins / 60)}h ago`
    : `${Math.floor(mins / 1440)}d ago`;
  const status = mins < 25 * 60 ? 'ok' : mins < 48 * 60 ? 'warn' : 'stale';
  return { label, status };
}

async function PipelineStatus() {
  const s = await fetchPipelineStatus();

  const rows: { label: string; ts: string | null }[] = [
    { label: 'Gamelogs',    ts: s.gamelogs    },
    { label: 'Metrics',     ts: s.metrics     },
    { label: 'Predictions', ts: s.predictions },
    { label: 'Outcomes',    ts: s.outcomes    },
    { label: 'Snapshots',   ts: s.snapshots   },
  ];

  const dotColor = { ok: '#22c55e', warn: '#f59e0b', stale: '#ef4444' };

  return (
    <details className="mb-6 rounded-lg border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold flex items-center justify-between"
        style={{ color: 'var(--text)', listStyle: 'none' }}>
        <span style={{ color: 'var(--text-bright)' }}>Pipeline Status</span>
        <span style={{ color: 'var(--text)', opacity: 0.5 }}>expand</span>
      </summary>
      <div className="px-3 pb-3 pt-1">
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map(({ label, ts }) => {
              const { label: age, status } = relTime(ts);
              return (
                <tr key={label} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-1.5 font-medium w-28" style={{ color: 'var(--text-bright)' }}>{label}</td>
                  <td className="py-1.5" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                    {ts ? new Date(ts).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—'}
                  </td>
                  <td className="py-1.5 text-right">
                    <span className="inline-flex items-center gap-1" style={{ color: dotColor[status] }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor[status], display: 'inline-block' }} />
                      {age}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
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
        <div className="h-2.5 rounded mb-2 w-full" style={{ background: 'var(--border)' }} />
        <div className="h-2.5 rounded mb-2 w-5/6" style={{ background: 'var(--border)' }} />
        <div className="h-2.5 rounded w-3/4" style={{ background: 'var(--border)' }} />
      </div>
      {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg mb-1.5" style={{ background: 'var(--bg)' }} />)}
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
      {[1, 2, 3, 4, 5, 6].map(row => (
        <div key={row} className="mb-8">
          <div className="h-4 w-40 rounded mb-3" style={{ background: 'var(--border)' }} />
          {/* Mobile: single card */}
          <div className="md:hidden rounded-xl border p-4 animate-pulse"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="h-3 w-28 rounded mb-4" style={{ background: 'var(--border)' }} />
            {[1, 2, 3, 4, 5].map(j => (
              <div key={j} className="h-11 rounded-lg mb-2" style={{ background: 'var(--bg)' }} />
            ))}
          </div>
          {/* Desktop: 3-column */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-4">
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

      {/* Pipeline status log */}
      <Suspense fallback={null}>
        <PipelineStatus />
      </Suspense>

      {/* Last night's stories */}
      <Suspense fallback={<StoriesSkeleton />}>
        <NightlyStories />
      </Suspense>

      {/* Spotlight games */}
      <div className="mb-10">
        <Suspense fallback={<GamesSkeleton />}>
          <SpotlightSection today={today} />
        </Suspense>
      </div>

      {/* Player metrics — 6 rows × 3 columns */}
      <Suspense fallback={<MetricsSkeleton />}>
        <PlayerMetrics />
      </Suspense>

    </div>
  );
}
