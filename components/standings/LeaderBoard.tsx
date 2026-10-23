import Link from 'next/link';
import { Headshot } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import type { LeaderBoard as Board } from '@/lib/nhl-stats';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// An official stat category, each leader with the player's Heat right now.
export function LeaderBoard({ board, showHeat = true }: { board: Board; showHeat?: boolean }) {
  return (
    <div className="flex flex-col rounded-[14px] border px-3.5 pb-2 pt-3.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-baseline justify-between px-0.5 pb-2">
        <h3 className="text-[15px] font-extrabold" style={{ color: 'var(--text-bright)' }}>{board.title}</h3>
        <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.8 }}>{board.unit}</span>
      </div>
      <ol>
        {board.rows.map((p, i) => (
          <li key={p.id} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <Link href={p.href} className="flex min-h-[46px] items-center gap-2.5 transition-colors hover:bg-[var(--bg-hover)]">
              <span className="w-4 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{i + 1}</span>
              <Headshot src={p.photo} name={p.name} team={p.team} size={30} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-bold" style={{ color: 'var(--text-bright)' }}>{p.name}</span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {p.team}
                  {showHeat && (p.heat == null ? null : <> · <span className="font-bold" style={{ color: heatColor(p.heat) }}>Heat {p.heat}</span></>)}
                </span>
              </span>
              <span className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--text-bright)' }}>{p.value}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
