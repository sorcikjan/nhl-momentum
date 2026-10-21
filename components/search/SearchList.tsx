import Link from 'next/link';
import { Headshot, HeatPill, TeamChip } from '@/components/ds';
import type { SearchPlayer, SearchResults, SearchTeam } from '@/lib/search';

export type SearchRow = { kind: 'player'; item: SearchPlayer } | { kind: 'team'; item: SearchTeam };
export type SearchSection = { title: string; rows: SearchRow[] };

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// Teams first (at most a few, and the likeliest intent when one matches), then
// players — the order arrow keys walk through.
export function flattenRows(r: SearchResults): SearchRow[] {
  return [
    ...r.teams.map(item => ({ kind: 'team' as const, item })),
    ...r.players.map(item => ({ kind: 'player' as const, item })),
  ];
}

// Grouped result rows (photo · name · team logo · Heat). `active` indexes the
// rows across all sections, in order.
export function SearchList({ sections, active, onPick }: { sections: SearchSection[]; active: number; onPick?: (row: SearchRow) => void }) {
  const shown = sections.filter(s => s.rows.length);
  // Row index where each section starts, so `active` spans all sections.
  const starts = shown.map((_, k) => shown.slice(0, k).reduce((n, s) => n + s.rows.length, 0));
  return (
    <div role="listbox" aria-label="Search results">
      {shown.map((s, k) => (
        <div key={s.title} className="pb-2">
          <div className="px-4 pb-1.5 pt-3 text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1.4 }}>{s.title}</div>
          {s.rows.map((row, j) => {
            const i = starts[k] + j;
            const selected = i === active;
            return (
              <Link
                key={`${row.kind}-${row.item.id}`}
                href={row.item.href}
                role="option"
                aria-selected={selected}
                data-row={i}
                onClick={() => onPick?.(row)}
                className="flex items-center gap-3 px-4 py-2.5 lg:py-2"
                style={{ background: selected ? 'var(--bg-hover)' : undefined, borderLeft: `3px solid ${selected ? 'var(--heat)' : 'transparent'}` }}
              >
                {row.kind === 'player' ? (
                  <>
                    <Headshot src={row.item.photo} name={row.item.name} team={row.item.team} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold lg:text-sm" style={{ color: 'var(--text-bright)' }}>{row.item.name}</span>
                      <span className="flex items-center gap-1.5 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>
                        {row.item.team && <TeamChip abbrev={row.item.team} size={14} />}
                        {row.item.team} · {row.item.pos}
                      </span>
                    </span>
                    {row.item.heat != null && <HeatPill heat={row.item.heat} size="sm" />}
                  </>
                ) : (
                  <>
                    <TeamChip abbrev={row.item.abbrev} size={36} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold lg:text-sm" style={{ color: 'var(--text-bright)' }}>{row.item.name}</span>
                    <span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>TEAM</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
