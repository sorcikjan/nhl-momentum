'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FilterChips, SectionHeading, TeamChip } from '@/components/ds';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import { viewRows, type Pos, type RankRow, type Sort } from '@/lib/rankings-view';

export type GoalieRow = { id: number; href: string; name: string; team: string; savePct: number; gaa: number; games: number };

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

type Props = { rows: RankRow[]; goalies: GoalieRow[]; total: number };

// Filters come from the URL on the client, so /rankings stays one static ISR page.
export function RankingsFromUrl(props: Props) {
  const sp = useSearchParams();
  const p = sp.get('pos'), s = sp.get('sort');
  const pos: Pos = POSITIONS.includes(p as Pos) ? (p as Pos) : 'ALL';
  const sort: Sort = SORTS.some(x => x.key === s) ? (s as Sort) : 'heat';
  return <RankingsView {...props} pos={pos} sort={sort} />;
}

// Rankings per docs/design/redesign-2026 DesktopRankings / MobileRankings.
export function RankingsView({ rows: all, goalies, total, pos, sort }: Props & { pos: Pos; sort: Sort }) {
  const rows = pos === 'G' ? [] : viewRows(all, { pos, sort });
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
          {goalies.map((g, i) => (
            <Link key={g.id} href={g.href} className="grid grid-cols-[32px_minmax(0,1fr)_72px_56px] items-center gap-3 border-t px-4 py-3.5 hover:bg-[var(--bg-hover)] lg:grid-cols-[60px_minmax(0,1fr)_100px_100px_80px] lg:px-6" style={{ borderColor: 'var(--border-soft)', borderLeft: '3px solid var(--cold)' }}>
              <span className="text-sm font-bold" style={{ ...MONO, color: 'var(--text-bright)' }}>{i + 1}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <TeamChip abbrev={g.team} size={22} />
                <span className="truncate text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{g.name}</span>
              </span>
              <span className="text-right text-[13px] font-bold" style={{ ...MONO, color: 'var(--cold)' }}>{g.savePct.toFixed(3).replace(/^0/, '')}</span>
              <span className="text-right text-[13px]" style={{ ...MONO, color: 'var(--text)' }}>{g.gaa.toFixed(2)}</span>
              <span className="hidden text-right text-[11px] lg:block" style={{ ...MONO, color: 'var(--text-muted)' }}>last {g.games}</span>
            </Link>
          ))}
        </div>
      ) : (
        <RankingsTable rows={rows} />
      )}
    </div>
  );
}
