import Link from 'next/link';
import { heatColor } from '@/lib/heat';
import type { PlayerRowData, RowTone } from '@/lib/player-row';
import { Headshot } from './Headshot';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const TONE: Record<RowTone, string> = { rise: 'var(--rise)', cold: 'var(--cold)', muted: 'var(--text)' };

// The one player row for every list: mark · photo · name / team · pos · last 5 ·
// chip · number. Heat numbers take the Heat colour; others (goalie SV%) are cold blue.
export function PlayerRow({ r }: { r: PlayerRowData }) {
  return (
    <Link
      href={r.href}
      className="flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors hover:bg-[var(--bg-hover)] lg:gap-3 lg:px-3.5"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
    >
      <span className="w-4 shrink-0 text-xs font-bold" style={{ ...MONO, color: r.markTone ? TONE[r.markTone] : 'var(--text-muted)' }}>{r.mark}</span>
      <Headshot src={r.photo} name={r.name} team={r.team} size={34} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{r.name}</span>
        <span className="truncate text-xs" style={{ color: 'var(--text)' }}>
          {r.team} · {r.pos} · <span style={{ ...MONO, color: 'var(--text-bright)', opacity: 0.8 }}>{r.l5}</span>
        </span>
      </span>
      {r.chip && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold lg:text-[11px]"
          style={{ ...MONO, color: TONE[r.chip.tone], background: `color-mix(in srgb, ${TONE[r.chip.tone]} 12%, transparent)` }}
        >
          {r.chip.text}
        </span>
      )}
      <span
        className="min-w-[30px] shrink-0 text-right text-lg font-extrabold tabular-nums lg:text-xl"
        style={{ color: r.valueHeat == null ? 'var(--cold)' : heatColor(r.valueHeat) }}
      >
        {r.value}
      </span>
    </Link>
  );
}

export function PlayerList({ rows, empty = 'Not enough games yet.' }: { rows: PlayerRowData[]; empty?: string }) {
  if (!rows.length) return <p className="py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{empty}</p>;
  return (
    <div className="flex flex-col gap-2">
      {rows.map(r => <PlayerRow key={r.playerId} r={r} />)}
    </div>
  );
}

// The one right-slot link of a SectionHeading.
export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[11px] font-semibold uppercase" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 0.5 }}>
      {children} →
    </Link>
  );
}
