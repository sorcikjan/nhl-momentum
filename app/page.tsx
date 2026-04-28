import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import RecapFeed from '@/components/dashboard/RecapFeed';
import TonightSection from '@/components/dashboard/TonightSection';
import ResultsSection from '@/components/dashboard/ResultsSection';
import HeatGrid from '@/components/dashboard/HeatGrid';
import DailyBrandStrip from '@/components/dashboard/DailyBrandStrip';
import { fetchRankings, fetchGames, fetchRecentRecaps, fetchRecentCompletedGames, fetchSeriesStandings, fetchGoalieRankings, fetchNewcomerWatch, teamLogoUrl } from '@/lib/data';
import type { SeriesInfo } from '@/lib/data';
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
const getGoalieRankings = cache(() => fetchGoalieRankings().catch(() => []));
const getNewcomers = cache(() => fetchNewcomerWatch().catch(() => []));

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
  const [rankings, goalies, newcomers] = await Promise.all([
    getRankings(),
    getGoalieRankings(),
    getNewcomers(),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skaters = ((rankings?.top100 ?? []) as any[])
    .sort((a: any, b: any) => (b.momentum_ppm ?? 0) - (a.momentum_ppm ?? 0))
    .slice(0, 15);
  return (
    <HeatGrid
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skaters={skaters as any[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      goalies={goalies as any[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newcomers={newcomers as any[]}
    />
  );
}

// ── Section: Playoff bracket (only during playoffs) ──────────────────────────

function PlayoffSeriesRow({ s }: { s: SeriesInfo }) {
  const leaderW = Math.max(s.awayWins, s.homeWins);
  const trailingW = Math.min(s.awayWins, s.homeWins);
  const leaderAbbrev = s.awayWins >= s.homeWins ? s.awayTeam.abbrev : s.homeTeam.abbrev;

  const statusLabel = s.isComplete
    ? `${leaderAbbrev} wins ${leaderW}–${trailingW}`
    : leaderW === trailingW
    ? `Tied ${leaderW}–${trailingW}`
    : `${leaderAbbrev} leads ${leaderW}–${trailingW}`;

  return (
    <div className="flex items-center justify-between gap-3 py-2"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogoUrl(s.awayTeam.abbrev)} alt={s.awayTeam.abbrev} className="w-6 h-6 flex-shrink-0" />
        <span className="text-xs font-semibold" style={{ color: 'var(--text)', opacity: s.isComplete && s.awayWins < s.homeWins ? 0.4 : 1 }}>{s.awayTeam.abbrev}</span>
        <span className="text-xs font-black font-mono tabular-nums ml-1"
          style={{ color: s.awayWins > s.homeWins ? 'var(--text-bright)' : 'var(--text)', opacity: s.awayWins < s.homeWins ? 0.35 : 1 }}>
          {s.awayWins}
        </span>
        <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.2 }}>–</span>
        <span className="text-xs font-black font-mono tabular-nums"
          style={{ color: s.homeWins > s.awayWins ? 'var(--text-bright)' : 'var(--text)', opacity: s.homeWins < s.awayWins ? 0.35 : 1 }}>
          {s.homeWins}
        </span>
        <span className="text-xs font-semibold ml-1" style={{ color: 'var(--text)', opacity: s.isComplete && s.homeWins < s.awayWins ? 0.4 : 1 }}>{s.homeTeam.abbrev}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogoUrl(s.homeTeam.abbrev)} alt={s.homeTeam.abbrev} className="w-6 h-6 flex-shrink-0" />
      </div>
      <span className="text-xs flex-shrink-0" style={{ color: s.isComplete ? 'var(--neon)' : 'var(--text)', opacity: s.isComplete ? 0.9 : 0.5 }}>
        {statusLabel}
      </span>
    </div>
  );
}

async function PlayoffBracketSection() {
  const seriesMap = await fetchSeriesStandings().catch(() => new Map());
  if (seriesMap.size === 0) return null;

  const rounds = new Map<number, SeriesInfo[]>();
  for (const s of seriesMap.values()) {
    if (!rounds.has(s.round)) rounds.set(s.round, []);
    rounds.get(s.round)!.push(s);
  }

  const ROUND_LABELS: Record<number, string> = {
    1: 'First Round', 2: 'Second Round', 3: 'Conference Finals', 4: 'Stanley Cup Final',
  };

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text)', opacity: 0.4 }}>Stanley Cup Playoffs</p>
        <a href="/playoffs" className="text-xs font-medium" style={{ color: 'var(--neon)' }}>Full bracket →</a>
      </div>
      {[...rounds.entries()].sort(([a], [b]) => a - b).map(([round, series]) => (
        <div key={round} className="mb-4 last:mb-0">
          <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-bright)' }}>
            {ROUND_LABELS[round] ?? `Round ${round}`}
          </p>
          {series.sort((a, b) => a.seriesNum - b.seriesNum).map(s => (
            <PlayoffSeriesRow key={`${s.round}-${s.seriesNum}`} s={s} />
          ))}
        </div>
      ))}
    </div>
  );
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

      {/* 1. Playoff bracket — only rendered during playoffs */}
      <Suspense fallback={null}>
        <PlayoffBracketSection />
      </Suspense>

      {/* 2. Last Night — cinematic recap hero */}
      <Suspense fallback={<HeroSkeleton />}>
        <LastNightSection />
      </Suspense>

      {/* 3. Tonight — split-color prediction cards */}
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
            <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Last Night</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text)' }}>
              Data-backed stories from every game night
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--silver)' }}>Read stories →</p>
          </a>
          <a href="/playoffs"
            className="rounded-xl border p-4 hover:opacity-90 transition-opacity group"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-lg mb-1">🏆</div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Playoff Bracket</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text)' }}>
              Series standings round by round
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--heat)' }}>View bracket →</p>
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
