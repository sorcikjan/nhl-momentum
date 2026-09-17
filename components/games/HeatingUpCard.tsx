import Link from 'next/link';
import HeatBadge from '@/components/ui/HeatBadge';

export interface HeatPlayerRow {
  playerId: number;
  href: string;
  name: string;
  teamAbbrev: string;
  heat: number;
  delta?: number | null;
  line: string;
}

export default function HeatingUpCard({ title = 'Heating Up Tonight', players }: { title?: string; players: HeatPlayerRow[] }) {
  if (!players.length) return null;
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--heat)' }}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--heat)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--heat)' }} />
        {title}
      </div>
      <div className="space-y-2.5">
        {players.map(p => (
          <Link key={p.playerId} href={p.href} className="flex items-center justify-between gap-2 hover:opacity-80">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1 rounded" style={{ background: 'var(--border)', color: 'var(--text)' }}>{p.teamAbbrev}</span>
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-bright)' }}>{p.name}</span>
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text)', opacity: 0.7 }}>{p.line}</div>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <HeatBadge heat={p.heat} size="sm" />
              {p.delta != null && p.delta !== 0 && (
                <span className="text-[10px] font-semibold" style={{ color: p.delta > 0 ? 'var(--rise)' : 'var(--red)' }}>
                  {p.delta > 0 ? '↑' : '↓'} {p.delta > 0 ? '+' : ''}{p.delta}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
