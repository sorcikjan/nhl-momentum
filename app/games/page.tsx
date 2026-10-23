import type { Metadata } from 'next';
import Link from 'next/link';
import { FilterChips, SectionHeading } from '@/components/ds';
import { ScheduleEmpty } from '@/components/schedule/ScheduleEmpty';
import { GameCard } from '@/components/game/GameCard';
import { fetchGamesRange, fetchSeasonPickAccuracy } from '@/lib/data';
import { fetchDayCards } from '@/lib/game-cards';
import { todayET } from '@/lib/home';
import { assertDatabaseUp } from '@/lib/supabase';

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
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const { range: raw, date: custom } = await searchParams;
  const range: Range = (['today', 'tomorrow', 'week', 'all', 'custom'] as const).includes(raw as Range) ? (raw as Range) : 'today';
  const today = todayET();
  const dates = datesFor(range, today, custom);

  const [days, accuracy] = await Promise.all([
    fetchDayCards(dates),
    fetchSeasonPickAccuracy().catch(() => null),
  ]);

  let nextGameDate: string | null = null;
  if (days.length === 0) {
    const ahead = await fetchGamesRange(Array.from({ length: 7 }, (_, i) => addDays(dates[dates.length - 1], i + 1))).catch(() => ({ games: [] }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextGameDate = (ahead.games as any[]).map(g => g.gameDate).sort()[0] ?? null;
  }

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeading
        as="h1"
        size="page"
        kicker={range === 'today' ? 'SCHEDULE · TONIGHT' : 'SCHEDULE'}
        title="All games. Every prediction."
        sub={<>{accuracy != null ? <>Season pick accuracy <b style={{ color: 'var(--rise)' }}>{Math.round(accuracy)}%</b> · our pick on every game. </> : 'Our pick on every game, with each team’s three hottest players. '}<Link href="/predictions" style={{ color: 'var(--heat)' }}>Tonight&apos;s predictions →</Link></>}
        right={<FilterChips options={RANGES.map(r => ({ label: r.label, href: r.key === 'today' ? '/games' : `/games?range=${r.key}`, active: r.key === range }))} />}
      />

      {days.length === 0 ? (
        <ScheduleEmpty nextGameDate={nextGameDate} />
      ) : (
        days.map(({ date, cards: rows }) => (
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
