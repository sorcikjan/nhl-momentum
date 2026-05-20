import { Suspense } from 'react';
import { cache } from 'react';
import type { Metadata } from 'next';
import RecapFeed from '@/components/dashboard/RecapFeed';
import TonightSection from '@/components/dashboard/TonightSection';
import ResultsSection from '@/components/dashboard/ResultsSection';
import HeatGrid from '@/components/dashboard/HeatGrid';
import PlayoffHero from '@/components/dashboard/PlayoffHero';
import {
  fetchRankings,
  fetchGames,
  fetchRecentRecaps,
  fetchRecentCompletedGames,
  fetchSeriesStandings,
  fetchGoalieRankings,
  fetchNewcomerWatch,
} from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';

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
const getSeriesStandings = cache(() => fetchSeriesStandings().catch(() => new Map()));

// ── Section: Playoff Hero ─────────────────────────────────────────────────────

async function PlayoffHeroSection({ today }: { today: string }) {
  const [seriesMap, rankings, { games, predictions }] = await Promise.all([
    getSeriesStandings(),
    getRankings(),
    getTodayGames(today),
  ]);
  if (seriesMap.size === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap: Record<number, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (predictions ?? []) as any[]) predMap[p.game_id] = p;

  return (
    <PlayoffHero
      seriesMap={seriesMap}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rankings={(rankings?.top100 ?? []) as any[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todayGames={games as any[]}
      predMap={predMap}
    />
  );
}

// ── Section: Last Night (recap feed) ─────────────────────────────────────────

async function LastNightSection() {
  const recaps = await getRecentRecaps();
  if (!recaps.length) return null;
  return <RecapFeed recaps={recaps} />;
}

// ── Section: Tonight (upcoming / live games) ──────────────────────────────────

async function TonightSlate({ today }: { today: string }) {
  const [{ games, predictions, odds }, rankings] = await Promise.all([
    getTodayGames(today),
    getRankings(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap: Record<number, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (predictions ?? []) as any[]) predMap[p.game_id] = p;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oddsMap: Record<number, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (odds ?? []) as any[]) oddsMap[o.game_id] = [...(oddsMap[o.game_id] ?? []), o];

  // Compute watchPlayers: top 3 Heat players per team, mapped by game_id
  const watchPlayers = new Map<number, Array<{ name: string; heat: number; team: string }>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top100 = (rankings?.top100 ?? []) as any[];

  // Build team → players lookup sorted by heat desc
  const teamPlayersMap = new Map<string, Array<{ name: string; heat: number; team: string }>>();
  for (const r of top100) {
    const abbrev = r.players?.teams?.abbrev;
    if (!abbrev) continue;
    const heat = ppmToHeat(r.momentum_ppm ?? 0);
    const name = `${r.players.first_name ?? ''} ${r.players.last_name ?? ''}`.trim();
    if (!teamPlayersMap.has(abbrev)) teamPlayersMap.set(abbrev, []);
    teamPlayersMap.get(abbrev)!.push({ name, heat, team: abbrev });
  }
  // Sort each team's players by heat desc
  for (const arr of teamPlayersMap.values()) {
    arr.sort((a, b) => b.heat - a.heat);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of games as any[]) {
    const awayAbbrev = g.awayTeam?.abbrev;
    const homeAbbrev = g.homeTeam?.abbrev;
    const awayPlayers = awayAbbrev ? (teamPlayersMap.get(awayAbbrev) ?? []).slice(0, 3) : [];
    const homePlayers = homeAbbrev ? (teamPlayersMap.get(homeAbbrev) ?? []).slice(0, 3) : [];
    const combined = [...awayPlayers, ...homePlayers]; // already sorted within each group
    if (combined.length > 0) watchPlayers.set(g.id, combined);
  }

  return (
    <TonightSection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      games={games as any[]}
      predMap={predMap}
      oddsMap={oddsMap}
      watchPlayers={watchPlayers}
    />
  );
}

// ── Section: Recent results ───────────────────────────────────────────────────

async function RecentResultsSection() {
  const [{ games, predMap }, rankings] = await Promise.all([
    getRecentGames(),
    getRankings(),
  ]);

  // Compute topPlayers: highest-Heat player per game from either team
  const topPlayers = new Map<number, { name: string; heat: number; team: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top100 = (rankings?.top100 ?? []) as any[];

  // Build team → players lookup
  const teamPlayersMap = new Map<string, Array<{ name: string; heat: number; team: string }>>();
  for (const r of top100) {
    const abbrev = r.players?.teams?.abbrev;
    if (!abbrev) continue;
    const heat = ppmToHeat(r.momentum_ppm ?? 0);
    const name = `${r.players.first_name ?? ''} ${r.players.last_name ?? ''}`.trim();
    if (!teamPlayersMap.has(abbrev)) teamPlayersMap.set(abbrev, []);
    teamPlayersMap.get(abbrev)!.push({ name, heat, team: abbrev });
  }
  for (const arr of teamPlayersMap.values()) {
    arr.sort((a, b) => b.heat - a.heat);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of games as any[]) {
    const awayAbbrev = g.away_team?.abbrev;
    const homeAbbrev = g.home_team?.abbrev;
    const awayTop = awayAbbrev ? (teamPlayersMap.get(awayAbbrev) ?? [])[0] : null;
    const homeTop = homeAbbrev ? (teamPlayersMap.get(homeAbbrev) ?? [])[0] : null;
    const top = awayTop && homeTop
      ? (awayTop.heat >= homeTop.heat ? awayTop : homeTop)
      : awayTop ?? homeTop ?? null;
    if (top) topPlayers.set(g.id, top);
  }

  return (
    <ResultsSection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      games={games as any[]}
      predMap={predMap}
      topPlayers={topPlayers}
    />
  );
}

// ── Section: Who's burning (Heat grid) ───────────────────────────────────────

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

// ── Skeletons ─────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)', minHeight: '180px' }} />
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
      ))}
    </div>
  );
}

function StorySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)', minHeight: '280px' }} />
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
    </div>
  );
}

function HeatGridSkeleton() {
  return (
    <div className="hidden md:grid md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
      ))}
    </div>
  );
}

function GameSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
      ))}
    </div>
  );
}

// ── NEW HERE? Banner ──────────────────────────────────────────────────────────

function NewHereBanner() {
  return (
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }} className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold tracking-widest uppercase shrink-0" style={{ color: 'var(--heat)' }}>NEW HERE?</span>
        <p className="text-xs" style={{ color: 'var(--text)' }}>
          Momentum gives every NHL player a <strong style={{ color: 'var(--heat)' }}>Heat score from 0 to 100</strong>, updated every game. See who&apos;s burning, who&apos;s cooling, and which games tonight are worth watching.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        <span style={{ color: 'var(--text)', opacity: 0.5 }}>67% pick accuracy · YTD</span>
        <a href="/games" style={{ color: 'var(--heat)' }} className="font-semibold">How it works →</a>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function SiteFooter() {
  return (
    <footer className="pt-8 pb-4 flex items-center justify-between gap-4 flex-wrap text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text)', opacity: 0.4 }}>
      <div className="flex gap-2 flex-wrap">
        <span>DATA</span>
        {['NHL Stats API', 'MoneyPuck', 'Natural Stat Trick'].map(s => (
          <span key={s}>· {s}</span>
        ))}
      </div>
      <div className="flex gap-4 flex-wrap">
        {[['How Heat works', '/methodology'], ['API', '/api'], ['Twitter', 'https://twitter.com']].map(([label, href]) => (
          <a key={label} href={href} className="hover:opacity-70">{label}</a>
        ))}
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0 flex flex-col gap-8">

      {/* 0. NEW HERE? banner — static, no Suspense */}
      <NewHereBanner />

      {/* 1. Playoff Hero — only rendered during playoffs */}
      <Suspense fallback={null}>
        <PlayoffHeroSection today={today} />
      </Suspense>

      {/* 2. Results & predictions — completed games */}
      <Suspense fallback={<ResultsSkeleton />}>
        <RecentResultsSection />
      </Suspense>

      {/* 3. Stories — recap feed */}
      <Suspense fallback={<StorySkeleton />}>
        <LastNightSection />
      </Suspense>

      {/* 4. Who's burning — Heat grid */}
      <Suspense fallback={<HeatGridSkeleton />}>
        <BurningSection />
      </Suspense>

      {/* 5. Tonight — upcoming / live games */}
      <Suspense fallback={<GameSkeleton />}>
        <TonightSlate today={today} />
      </Suspense>

      {/* 6. Explore — feature entry points */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text)', opacity: 0.4 }}>Explore</p>
        <h2 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          <span style={{ color: 'var(--text-bright)' }}>More ways to </span>
          <span style={{ color: 'var(--heat)' }}>dig in.</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { href: '/rankings', category: 'RANKINGS', title: 'Heat Rankings', desc: "Who's playing the best hockey right now", color: 'var(--heat)' },
            { href: '/games', category: 'PREDICTIONS', title: 'Games & Predictions', desc: 'AI win predictions vs bookmaker odds', color: 'var(--neon)' },
            { href: '/recaps', category: 'STORIES', title: 'AI archive', desc: 'Data-backed stories from every game night', color: 'var(--text-bright)' },
            { href: '/playoffs', category: 'BRACKET', title: 'Playoff Bracket', desc: 'Series standings round by round', color: 'var(--heat)' },
          ] as const).map(({ href, category, title, desc, color }) => (
            <a key={href} href={href}
              className="rounded-xl border p-4 hover:opacity-90 transition-opacity flex flex-col gap-1"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color, opacity: 0.7 }}>{category}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>{title}</p>
              <p className="text-xs" style={{ color: 'var(--text)', opacity: 0.6 }}>{desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* 7. Footer */}
      <SiteFooter />

    </div>
  );
}
