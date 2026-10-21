import Link from 'next/link';
import { Headshot, HeatPill, TeamChip } from '@/components/ds';
import type { KeyPlayer } from '@/lib/key-players';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
type Side = { abbrev: string; name: string; players: KeyPlayer[] };

function Delta({ d }: { d: number }) {
  return (
    <span className="text-[11px] font-bold" style={{ ...MONO, color: d > 0 ? 'var(--rise)' : 'var(--red)' }}>
      {d > 0 ? '↑' : '↓'} {Math.abs(d)}
    </span>
  );
}

function Column({ side }: { side: Side }) {
  return (
    <div className="min-w-0 rounded-[14px] border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 border-b px-3 py-2.5 lg:px-4" style={{ borderColor: 'var(--border-soft)' }}>
        <TeamChip abbrev={side.abbrev} size={22} />
        <span className="truncate text-[13px] font-bold" style={{ color: 'var(--text-bright)' }}>{side.name}</span>
      </div>
      {side.players.length === 0 ? (
        <p className="px-3 py-4 text-xs lg:px-4" style={{ color: 'var(--text-muted)' }}>No lineup data yet.</p>
      ) : side.players.map(p => (
        <Link key={p.playerId} href={p.href} data-key-player className="flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--bg-hover)] lg:gap-3 lg:px-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <Headshot src={p.photo} name={p.name} team={p.team} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold lg:text-sm" style={{ color: 'var(--text-bright)' }}>{p.name}</span>
            <span className="block truncate text-[10px] lg:text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{p.line}</span>
          </span>
          {p.heat != null ? <HeatPill heat={p.heat} size="sm" /> : p.delta ? <Delta d={p.delta} /> : null}
        </Link>
      ))}
    </div>
  );
}

// Three key players per team: stacked on phones, side by side from sm up.
export function KeyPlayers({ away, home }: { away: Side; home: Side }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
      <Column side={away} />
      <Column side={home} />
    </div>
  );
}
