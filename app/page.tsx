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
  const lastNight = completed.reduce((max: string, g: any) =>
    (g.game_date as string) > max ? (g.game_date as string) : max, '');
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

  // Compute header meta from results
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = computeResultsMeta(games as any[], predMap);
  const hasResults = !!meta;
  const hasRecaps = recaps.length > 0;
  if (!hasResults && !hasRecaps) return null;

  // Shared header data — prefer results date, fall back to recap date
  const dateLabel = meta
    ? new Date((meta.lastNight) + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : recaps[0]
    ? new Date(recaps[0].date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  return (
    <section className="flex flex-col gap-6">

      {/* Shared header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            <span style={{ color: 'var(--text-bright)' }}>Last </span>
            <span style={{ color: 'var(--heat)' }}>night.</span>
          </h2>
          <p style={{ color: 'var(--silver)', opacity: 0.55, fontSize: '0.78rem', marginTop: '0.25rem' }}>
            {dateLabel}{meta ? ` · ${meta.gameCount} game${meta.gameCount !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        {meta?.pct !== null && meta?.pct !== undefined && (
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--neon)' }}>
            WE GOT {meta.hits}/{meta.total} right · {meta.pct}%
          </span>
        )}
      </div>

      {/* Game results */}
      {hasResults && (
        <ResultsSection
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          games={games as any[]}
          predMap={predMap}
          topPlayers={topPlayers}
          hideHeader
        />
      )}

      {/* Stories divider + recap cards */}
      {hasRecaps && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text)', opacity: 0.35 }}>
            STORIES
          </p>
          <RecapFeed recaps={recaps} hideHeader />
        </div>
      )}

    </section>
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

      {/* 2. Last night — results + recap stories combined */}
      <Suspense fallback={<ResultsSkeleton />}>
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
