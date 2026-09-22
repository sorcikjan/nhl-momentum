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
  fetchSeasonPhase,
} from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'momentum. — Hockey Intelligence, Daily',
  description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings for every NHL game — updated live.',
  openGraph: {
    title: 'momentum. — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Stories, predictions and rankings for every NHL game.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'momentum. — Hockey Intelligence, Daily',
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
  const [seriesMap, rankings, { games, predictions }, goalies, newcomers] = await Promise.all([
    getSeriesStandings(),
    getRankings(),
    getTodayGames(today),
    getGoalieRankings(),
    getNewcomers(),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      goalies={goalies as any[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newcomers={newcomers as any[]}
    />
  );
}

// ── Helper: compute accuracy meta from completed games (server-side only) ────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeResultsMeta(games: any[], predMap: Map<number, any>) {
  const completed = games.filter(g => ['FINAL', 'OFF'].includes(g.game_state));
  if (!completed.length) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastNight = completed.reduce((max: string, g: any) =>
    (g.game_date as string) > max ? (g.game_date as string) : max, '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastNightGames = completed.filter((g: any) => g.game_date === lastNight);
  let hits = 0, total = 0;
  for (const g of lastNightGames) {
    const pred = predMap.get(g.id);
    if (!pred) continue;
    const outcome = Array.isArray(pred.prediction_outcomes) ? pred.prediction_outcomes[0] : pred.prediction_outcomes;
    if (outcome?.correct_winner !== undefined && outcome?.correct_winner !== null) {
      total++;
      if (outcome.correct_winner) hits++;
    }
  }
  return { lastNight, gameCount: lastNightGames.length, hits, total, pct: total > 0 ? Math.round((hits / total) * 100) : null };
}

// ── Section: Last Night — combined results + recaps ───────────────────────────

async function LastNightSection() {
  const [[{ games, predMap }, rankings], recaps] = await Promise.all([
    Promise.all([getRecentGames(), getRankings()]),
    getRecentRecaps(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top100 = (rankings?.top100 ?? []) as any[];

  // Build team → top players lookup for TOP HEAT labels on result cards
  const teamPlayersMap = new Map<string, Array<{ name: string; heat: number; team: string }>>();
  for (const r of top100) {
    const abbrev = r.players?.teams?.abbrev;
    if (!abbrev) continue;
    const heat = ppmToHeat(r.momentum_ppm ?? 0);
    const name = `${r.players.first_name ?? ''} ${r.players.last_name ?? ''}`.trim();
    if (!teamPlayersMap.has(abbrev)) teamPlayersMap.set(abbrev, []);
    teamPlayersMap.get(abbrev)!.push({ name, heat, team: abbrev });
  }
  for (const arr of teamPlayersMap.values()) arr.sort((a, b) => b.heat - a.heat);

  const topPlayers = new Map<number, { name: string; heat: number; team: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of games as any[]) {
    const awayTop = (teamPlayersMap.get(g.away_team?.abbrev) ?? [])[0] ?? null;
    const homeTop = (teamPlayersMap.get(g.home_team?.abbrev) ?? [])[0] ?? null;
    const top = awayTop && homeTop
      ? (awayTop.heat >= homeTop.heat ? awayTop : homeTop)
      : awayTop ?? homeTop ?? null;
    if (top) topPlayers.set(g.id, top);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = computeResultsMeta(games as any[], predMap);
  const hasResults = !!meta;
  const hasRecaps = recaps.length > 0;
  if (!hasResults && !hasRecaps) return null;

  return (
    <div className="flex flex-col gap-12">

      {/* Results — section has its own header ("Results & predictions.") */}
      {hasResults && (
        <ResultsSection
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          games={games as any[]}
          predMap={predMap}
          topPlayers={topPlayers}
        />
      )}

      {/* Stories — section has its own header ("The night in X stories.") */}
      {hasRecaps && (
        <RecapFeed recaps={recaps} />
      )}

    </div>
  );
}

// ── Section: Tonight (upcoming / live games) ──────────────────────────────────

async function TonightSlate({ today }: { today: string }) {
  const [{ games, predictions, odds }, rankings, seriesMap] = await Promise.all([
    getTodayGames(today),
    getRankings(),
    getSeriesStandings(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap: Record<number, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (predictions ?? []) as any[]) predMap[p.game_id] = p;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oddsMap: Record<number, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (odds ?? []) as any[]) oddsMap[o.game_id] = [...(oddsMap[o.game_id] ?? []), o];

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
  for (const arr of teamPlayersMap.values()) arr.sort((a, b) => b.heat - a.heat);

  const watchPlayers = new Map<number, Array<{ name: string; heat: number; team: string }>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of games as any[]) {
    const awayPlayers = (teamPlayersMap.get(g.awayTeam?.abbrev) ?? []).slice(0, 3);
    const homePlayers = (teamPlayersMap.get(g.homeTeam?.abbrev) ?? []).slice(0, 3);
    const combined = [...awayPlayers, ...homePlayers];
    if (combined.length > 0) watchPlayers.set(g.id, combined);
  }

  // During playoffs: detect the featured series game so it's not shown twice
  // (PlayoffHero already gives it full coverage — TonightSection shows the rest)
  let featuredGameId: number | undefined;
  if (seriesMap.size > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const todayAbbrevsSet = new Set((games as any[]).flatMap((g: any) => [g.awayTeam?.abbrev, g.homeTeam?.abbrev]).filter(Boolean));
    const activeSeries = [...seriesMap.values()].filter(s => !s.isComplete);
    const seriesTonight = activeSeries.filter(s =>
      todayAbbrevsSet.has(s.awayTeam.abbrev) || todayAbbrevsSet.has(s.homeTeam.abbrev)
    );
    const candidates = seriesTonight.length > 0 ? seriesTonight : activeSeries;

    // Score by sum of top-3 Heat per team
    const teamScore = (abbrev: string) => {
      const heats = (teamPlayersMap.get(abbrev) ?? []).slice(0, 3).map(p => p.heat);
      return heats.reduce((s, h) => s + h, 0);
    };
    let featuredSeries = null, bestScore = -1;
    for (const s of candidates) {
      const score = teamScore(s.awayTeam.abbrev) + teamScore(s.homeTeam.abbrev);
      if (score > bestScore) { bestScore = score; featuredSeries = s; }
    }
    if (featuredSeries) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fg = (games as any[]).find((g: any) =>
        (g.awayTeam?.abbrev === featuredSeries!.awayTeam.abbrev || g.awayTeam?.abbrev === featuredSeries!.homeTeam.abbrev) &&
        (g.homeTeam?.abbrev === featuredSeries!.awayTeam.abbrev || g.homeTeam?.abbrev === featuredSeries!.homeTeam.abbrev)
      );
      featuredGameId = fg?.id;
    }
  }

  return (
    <TonightSection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      games={games as any[]}
      predMap={predMap}
      oddsMap={oddsMap}
      watchPlayers={watchPlayers}
      excludeGameId={featuredGameId}
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
    <div className="flex flex-col gap-6">
      {/* Skeleton header */}
      <div className="h-10 w-48 rounded-lg animate-pulse" style={{ background: 'var(--bg-card)' }} />
      {/* Game result cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
      {/* Recap hero */}
      <div className="rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)', minHeight: '280px' }} />
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

// ── NEW HERE? / Preseason countdown banner ────────────────────────────────────

function TopBannerShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }} className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      {children}
    </div>
  );
}

function NewHereBanner() {
  return (
    <TopBannerShell>
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
    </TopBannerShell>
  );
}

async function TopBanner() {
  const { daysUntilStart, isPreseason, regularSeasonStartDate } = await fetchSeasonPhase().catch(() => ({
    daysUntilStart: null, isPreseason: false, regularSeasonStartDate: null,
  }));

  if (!isPreseason || daysUntilStart === null || !regularSeasonStartDate) {
    return <NewHereBanner />;
  }

  const startLabel = new Date(`${regularSeasonStartDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
  const dayWord = daysUntilStart === 1 ? 'day' : 'days';

  return (
    <TopBannerShell>
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold tracking-widest uppercase shrink-0" style={{ color: 'var(--heat)' }}>PRESEASON</span>
        <p className="text-xs" style={{ color: 'var(--text)' }}>
          Puck drop on the regular season is <strong style={{ color: 'var(--heat)' }}>{daysUntilStart} {dayWord} away</strong> ({startLabel}). Heat scores below still reflect final 2025-26 stats — they&apos;ll start moving the moment new games count.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        <a href="/games" style={{ color: 'var(--heat)' }} className="font-semibold">How it works →</a>
      </div>
    </TopBannerShell>
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
        {[['Twitter', 'https://twitter.com']].map(([label, href]) => (
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
    <div className="max-w-7xl mx-auto pb-20 md:pb-0 flex flex-col gap-12">

      {/* 0. Top banner — preseason countdown once we're within season-start window, NEW HERE? otherwise */}
      <Suspense fallback={<NewHereBanner />}>
        <TopBanner />
      </Suspense>

      {/* 1. Playoff Hero — only rendered during playoffs */}
      <Suspense fallback={null}>
        <PlayoffHeroSection today={today} />
      </Suspense>

      {/* 2. Tonight — upcoming / live games (design: first content section) */}
      <Suspense fallback={<GameSkeleton />}>
        <TonightSlate today={today} />
      </Suspense>

      {/* 3. Last night — results then stories as separate sections */}
      <Suspense fallback={<ResultsSkeleton />}>
        <LastNightSection />
      </Suspense>

      {/* 4. Who's hot — Heat grid (rankings) */}
      <Suspense fallback={<HeatGridSkeleton />}>
        <BurningSection />
      </Suspense>

      {/* 5. Explore — feature entry points */}
      <div className="flex flex-col gap-4">
        <div>
          <p style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--heat)', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: '6px' }}>EXPLORE</p>
          <h2 style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.05, color: 'var(--text-bright)' }}>
            More ways to dig in.
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { href: '/rankings', category: 'HEAT MAP', title: 'Heat Rankings', desc: "Who's playing the best hockey right now", color: 'var(--heat)' },
            { href: '/games', category: 'PREDICTIONS', title: 'Games & Picks', desc: 'AI win predictions vs bookmaker odds', color: 'var(--neon)' },
            { href: '/recaps', category: 'STORIES', title: 'AI archive', desc: 'Every story written. Searchable.', color: 'var(--text)' },
            { href: '/playoffs', category: 'ACCURACY', title: 'How we\'re doing', desc: 'Pick history, model drift, calibration.', color: 'var(--neon)' },
          ] as const).map(({ href, category, title, desc, color }) => (
            <a key={href} href={href}
              className="hover:opacity-90 transition-opacity flex flex-col gap-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 22px' }}>
              <p style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.5625rem', color, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{category}</p>
              <p style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-bright)', letterSpacing: '-0.025em' }}>{title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.5 }}>{desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* 6. Footer */}
      <SiteFooter />

    </div>
  );
}
