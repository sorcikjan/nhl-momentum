import type { Metadata } from 'next';
import Link from 'next/link';
import { FilterChips, SectionHeading, TeamChip } from '@/components/ds';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import { fetchGoalieRankings, fetchRankings } from '@/lib/data';
import { rankingRows, type Pos, type Sort } from '@/lib/rankings-view';
import { assertDatabaseUp } from '@/lib/supabase';
import { playerUrl } from '@/lib/urls';

// Free-tier database: data changes only when the pipeline runs, and pipeline
// runs call /api/revalidate — so a longer interval costs no freshness.
export const revalidate = 600;

export const metadata: Metadata = {
  title: 'NHL Player Rankings 2026–27',
  description: 'NHL player rankings — top skaters by Heat (recent form), season totals and trend, plus the best goalies by recent save percentage.',
  openGraph: {
    title: 'NHL Player Rankings — momentum.',
    description: 'Top NHL skaters ranked by Heat and season performance.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NHL Player Rankings 2026–27',
    description: 'NHL player rankings by Heat. Updated after every game night.',
  },
};

const POSITIONS: Pos[] = ['ALL', 'C', 'L', 'R', 'D', 'G'];
const SORTS: { key: Sort; label: string }[] = [
  { key: 'heat', label: 'Heat' }, { key: 'points', label: 'Points' }, { key: 'goals', label: 'Goals' }, { key: 'assists', label: 'Assists' },
];
const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

const href = (pos: Pos, sort: Sort) => {
  const q = new URLSearchParams();
  if (pos !== 'ALL') q.set('pos', pos);
  if (sort !== 'heat') q.set('sort', sort);
  const s = q.toString();
  return s ? `/rankings?${s}` : '/rankings';
};

// Rankings per docs/design/redesign-2026 DesktopRankings / MobileRankings.
export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ pos?: string; sort?: string }> }) {
  // Throw (→ keep serving the last good cached page) if the database is down.
  await assertDatabaseUp();
  const sp = await searchParams;
  const pos: Pos = POSITIONS.includes(sp.pos as Pos) ? (sp.pos as Pos) : 'ALL';
  const sort: Sort = SORTS.some(s => s.key === sp.sort) ? (sp.sort as Sort) : 'heat';

  const [data, goalies] = await Promise.all([
    fetchRankings().catch(() => null),
    pos === 'G' ? fetchGoalieRankings().catch(() => []) : Promise.resolve([]),
  ]);
  const rows = pos === 'G' ? [] : rankingRows(data?.top100 ?? [], { pos, sort }, data?.sparklineSnapshots ?? []);
  const total = data?.totalSkaters ?? 0;
  const kicker = pos === 'G' ? `GOALIES · TOP ${goalies.length}` : `TOP ${Math.min(100, total)} OF ${total} SKATERS`;

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeading
        as="h1"
        size="page"
        kicker={kicker}
        title="Rankings"
        sub={pos === 'G' ? 'Goalies by save percentage over recent starts.' : `Sorted by ${SORTS.find(s => s.key === sort)!.label.toLowerCase()}. The current state of every player in one place.`}
        right={pos === 'G' ? undefined : <FilterChips options={SORTS.map(s => ({ label: s.label, href: href(pos, s.key), active: s.key === sort }))} />}
      />
      <div className="mb-4">
        <FilterChips options={POSITIONS.map(p => ({ label: p, href: href(p, p === 'G' ? 'heat' : sort), active: p === pos }))} />
      </div>

      {pos === 'G' ? (
        <div className="overflow-hidden rounded-[14px] border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(goalies as any[]).map((g, i) => (
            <Link key={g.id} href={playerUrl(g.id, g.first_name, g.last_name)} className="grid grid-cols-[32px_minmax(0,1fr)_72px_56px] items-center gap-3 border-t px-4 py-3.5 hover:bg-[var(--bg-hover)] lg:grid-cols-[60px_minmax(0,1fr)_100px_100px_80px] lg:px-6" style={{ borderColor: 'var(--border-soft)', borderLeft: '3px solid var(--cold)' }}>
              <span className="text-sm font-bold" style={{ ...MONO, color: 'var(--text-bright)' }}>{i + 1}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <TeamChip abbrev={g.teams?.abbrev ?? ''} size={22} />
                <span className="truncate text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{g.first_name} {g.last_name}</span>
              </span>
              <span className="text-right text-[13px] font-bold" style={{ ...MONO, color: 'var(--cold)' }}>{g.avgSavePct.toFixed(3).replace(/^0/, '')}</span>
              <span className="text-right text-[13px]" style={{ ...MONO, color: 'var(--text)' }}>{g.avgGAA.toFixed(2)}</span>
              <span className="hidden text-right text-[11px] lg:block" style={{ ...MONO, color: 'var(--text-muted)' }}>last {g.gamesPlayed}</span>
            </Link>
          ))}
        </div>
      ) : (
        <RankingsTable rows={rows} />
      )}
    </div>
  );
}
