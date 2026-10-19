import Link from 'next/link';
import { HeatPill, Sparkline, TeamChip } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import type { RankRow } from '@/lib/rankings-view';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const COLS = 'grid grid-cols-[32px_minmax(0,1fr)_56px] items-center gap-3 lg:grid-cols-[60px_minmax(0,1fr)_96px_60px_60px_60px_70px_120px_80px_24px]';

// Heat-colored table (design DesktopRankings; mobile keeps rank · player · Heat).
export function RankingsTable({ rows }: { rows: RankRow[] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className={`${COLS} border-b px-4 py-3.5 text-[10px] font-bold lg:px-6`} style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1, borderColor: 'var(--border-soft)' }}>
        <span>RANK</span><span>PLAYER</span>
        <span className="hidden lg:block">TEAM · POS</span>
        <span className="hidden text-right lg:block">G</span><span className="hidden text-right lg:block">A</span><span className="hidden text-right lg:block">PTS</span>
        <span className="text-right">HEAT</span>
        <span className="hidden lg:block">TREND</span><span className="hidden text-right lg:block">Δ AVG</span><span className="hidden lg:block" />
      </div>
      {rows.map(r => {
        const up = r.delta?.startsWith('+');
        return (
          <Link key={r.playerId} href={r.href} className={`${COLS} border-t px-4 py-3.5 transition-colors hover:bg-[var(--bg-hover)] lg:px-6`} style={{ borderColor: 'var(--border-soft)', borderLeft: `3px solid ${heatColor(r.heat)}` }}>
            <span className="text-sm font-bold" style={{ ...MONO, color: 'var(--text-bright)' }}>{r.rank}</span>
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="lg:hidden"><TeamChip abbrev={r.team} size={22} /></span>
              <span className="truncate text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{r.name}</span>
            </span>
            <span className="hidden items-center gap-1.5 lg:flex">
              <TeamChip abbrev={r.team} size={22} />
              <span className="text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{r.pos}</span>
            </span>
            <span className="hidden text-right text-[13px] lg:block" style={{ ...MONO, color: 'var(--text)' }}>{r.g}</span>
            <span className="hidden text-right text-[13px] lg:block" style={{ ...MONO, color: 'var(--text)' }}>{r.a}</span>
            <span className="hidden text-right text-[13px] font-bold lg:block" style={{ ...MONO, color: 'var(--text-bright)' }}>{r.pts}</span>
            <span className="text-right"><HeatPill heat={r.heat} /></span>
            <span className="hidden lg:block"><Sparkline values={r.spark} width={110} height={22} color={heatColor(r.heat)} /></span>
            <span className="hidden text-right text-xs font-bold lg:block" style={{ ...MONO, color: r.delta == null ? 'var(--text-muted)' : up ? 'var(--rise)' : 'var(--red)' }}>{r.delta ?? '—'}</span>
            <span className="hidden text-right text-lg lg:block" style={{ color: 'var(--text-muted)' }}>›</span>
          </Link>
        );
      })}
    </div>
  );
}
