import type { Metadata } from 'next';
import { FilterChips, SectionHeading } from '@/components/ds';
import { ScheduleEmpty } from '@/components/schedule/ScheduleEmpty';
import { GameCard } from '@/components/game/GameCard';
import { cardPlayers, type GameCardData } from '@/lib/game-card';
import { teamColor } from '@/lib/team-colors';
import { fetchGamesRange, fetchPlayerPhotos, fetchRecap, fetchSeasonPickAccuracy, fetchStatLines } from '@/lib/data';
import { gameView } from '@/lib/game-state';
import { ppmToHeat } from '@/lib/heat';
import { todayET } from '@/lib/home';
import { assertDatabaseUp } from '@/lib/supabase';
import { gameUrl, recapUrl } from '@/lib/urls';
import { calcWatchability } from '@/lib/watchability';
import type { KeyPlayer } from '@/lib/key-players';

// Free-tier database: each render is several queries; crawlers visit every page.
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'NHL Schedule & Predictions',
  description: 'Every NHL game, every AI win prediction, grouped by day — with live scores, betting-market comparisons, and who to watch.',
  openGraph: {
    title: 'NHL Schedule & Predictions — momentum.',
    description: 'Every NHL game with AI win predictions, live scores, and who to watch tonight.',
  },
};

type Range = 'today' | 'tomorrow' | 'week' | 'all' | 'custom';
const RANGES: { key: Exclude<Range, 'custom'>; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This week' },
  { key: 'all', label: 'Next 2 weeks' },
];

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

function datesFor(range: Range, today: string, custom?: string): string[] {
  if (range === 'custom' && custom && /^\d{4}-\d{2}-\d{2}$/.test(custom)) return [custom];
  const n = range === 'tomorrow' ? 1 : range === 'week' ? 7 : range === 'all' ? 14 : 1;
  const start = range === 'tomorrow' ? 1 : 0;
  return Array.from({ length: n }, (_, i) => addDays(today, start + i));
}

function dayHeader(d: string, today: string) {
  const base = new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase();
  return d === today ? `TONIGHT · ${base}` : d === addDays(today, 1) ? `TOMORROW · ${base}` : d === addDays(today, -1) ? `YESTERDAY · ${base}` : new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase() + ` · ${base}`;
}

// Schedule per docs/design/redesign-2026 DesktopScheduleEnhanced / MobileGamesList.
export default async function GamesPage({ searchParams }: { searchParams: Promise<{ range?: string; date?: string }> }) {
  // Throw (→ keep serving the last good cached page) if the database is down.
  await assertDatabaseUp();
  const { range: raw, date: custom } = await searchParams;
  const range: Range = (['today', 'tomorrow', 'week', 'all', 'custom'] as const).includes(raw as Range) ? (raw as Range) : 'today';
  const today = todayET();
  const dates = datesFor(range, today, custom);

  const empty = { games: [], predictions: [], odds: [], topHeatByGameTeam: new Map(), keyPlayersByGameTeam: new Map<string, KeyPlayer[]>() };
  const [{ games, predictions, topHeatByGameTeam, keyPlayersByGameTeam }, accuracy] = await Promise.all([
    fetchGamesRange(dates).catch(() => empty),
    fetchSeasonPickAccuracy().catch(() => null),
  ]);

  // Key players (top pre-game Heat per team) on every card; goals/assists once
  // a game has started; photos for all of them in one query.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startedIds = (games as any[]).filter(g => gameView(g.gameState) !== 'upcoming').map(g => g.id as number);
  const keyIds = [...new Set([...keyPlayersByGameTeam.values()].flat().map(p => p.playerId))];
  const [statsBy, photos] = await Promise.all([
    fetchStatLines(startedIds).catch(() => new Map<number, Map<number, { goals: number; assists: number }>>()),
    keyIds.length ? fetchPlayerPhotos(keyIds).catch(() => new Map<number, string>()) : Promise.resolve(new Map<number, string>()),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predBy = new Map<number, any>((predictions ?? []).map((p: { game_id: number }) => [p.game_id, p]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byDate = new Map<string, any[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of games as any[]) {
    const d = g.gameDate;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(g);
  }

  const finalDates = [...byDate.entries()].filter(([, gs]) => gs.some(g => gameView(g.gameState) === 'final')).map(([d]) => d);
  const recapBy = new Map(await Promise.all(finalDates.map(async d => [d, await fetchRecap(d).catch(() => null)] as const)));

  let nextGameDate: string | null = null;
  if (games.length === 0) {
    const ahead = await fetchGamesRange(Array.from({ length: 7 }, (_, i) => addDays(dates[dates.length - 1], i + 1))).catch(() => empty);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextGameDate = (ahead.games as any[]).map(g => g.gameDate).sort()[0] ?? null;
  }

  const days = [...byDate.entries()].map(([date, gs]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: GameCardData[] = gs.map((g: any) => {
      const p = predBy.get(g.id);
      const view = gameView(g.gameState);
      const homeProb: number | null = p?.home_win_probability ?? null;
      const homePct = homeProb == null ? null : Math.round(homeProb * 100);
      const outcome = p?.prediction_outcomes?.[0]?.correct_winner;
      const recap = recapBy.get(date);
      // A started game without box-score rows yet shows Heat only (not "DNP" for everyone).
      const stats = statsBy.get(g.id)?.size ? statsBy.get(g.id)! : null;
      return {
        id: g.id,
        href: gameUrl(g.id, g.awayTeam.abbrev, g.homeTeam.abbrev, date),
        state: g.gameState,
        startTimeUTC: g.startTimeUTC ?? null,
        away: { abbrev: g.awayTeam.abbrev, name: teamColor(g.awayTeam.abbrev).name, score: g.awayTeam.score ?? null, pct: homePct == null ? null : 100 - homePct,
          players: cardPlayers(keyPlayersByGameTeam.get(`${g.id}-false`), photos, stats) },
        home: { abbrev: g.homeTeam.abbrev, name: teamColor(g.homeTeam.abbrev).name, score: g.homeTeam.score ?? null, pct: homePct,
          players: cardPlayers(keyPlayersByGameTeam.get(`${g.id}-true`), photos, stats) },
        pick: homeProb == null ? null : homeProb >= 0.5
          ? { abbrev: g.homeTeam.abbrev, pct: homePct! }
          : { abbrev: g.awayTeam.abbrev, pct: 100 - homePct! },
        pickResult: view !== 'final' || outcome == null ? null : outcome ? 'hit' : 'miss',
        watchability: view === 'final' ? null : calcWatchability({
          topHomeHeat: ppmToHeat(topHeatByGameTeam.get(`${g.id}-true`) ?? 0),
          topAwayHeat: ppmToHeat(topHeatByGameTeam.get(`${g.id}-false`) ?? 0),
          homeWinProbability: homeProb,
          isPlayoff: false,
        }),
        recapHref: view === 'final' && recap ? recapUrl(date, recap.title) : null,
        marquee: false,
      };
    });
    // ★ the single most watchable upcoming game of the day
    const best = rows.reduce<GameCardData | null>((b, r) => (r.watchability != null && (!b || r.watchability > (b.watchability ?? -1)) ? r : b), null);
    if (best && rows.length > 1) best.marquee = true;
    return { date, rows };
  });

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeading
        as="h1"
        size="page"
        kicker={range === 'today' ? 'SCHEDULE · TONIGHT' : 'SCHEDULE'}
        title="All games. Every prediction."
        sub={accuracy != null ? <>Season pick accuracy <b style={{ color: 'var(--rise)' }}>{Math.round(accuracy)}%</b> · our pick on every game.</> : 'Our pick on every game, with each team’s three hottest players.'}
        right={<FilterChips options={RANGES.map(r => ({ label: r.label, href: r.key === 'today' ? '/games' : `/games?range=${r.key}`, active: r.key === range }))} />}
      />

      {days.length === 0 ? (
        <ScheduleEmpty nextGameDate={nextGameDate} />
      ) : (
        days.map(({ date, rows }) => (
          <section key={date} className="mb-8">
            <div className="mb-3.5 flex items-center gap-3">
              <h2 className="text-[11px] font-bold" style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-muted)', letterSpacing: 1.4 }}>{dayHeader(date, today)}</h2>
              <span className="h-px flex-1" style={{ background: 'var(--border-soft)' }} />
              <span className="text-[11px]" style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-muted)' }}>{rows.length} game{rows.length === 1 ? '' : 's'}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rows.map(r => <GameCard key={r.id} g={r} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
