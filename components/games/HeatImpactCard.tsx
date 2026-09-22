import Link from 'next/link';
import HeatBadge from '@/components/ui/HeatBadge';

export interface Mover {
  playerId: number;
  href: string;
  name: string;
  teamAbbrev: string;
  before: number;
  after: number;
  delta: number;
}

function MoverColumn({ title, color, movers }: { title: string; color: string; movers: Mover[] }) {
  if (!movers.length) return null;
  return (
    <div className="flex-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
      <div className="font-mono font-bold uppercase mb-2.5" style={{ fontSize: 10, color, letterSpacing: '0.12em' }}>{title}</div>
      <div className="space-y-2.5">
        {movers.map((m, i) => (
          <Link
            key={m.playerId}
            href={m.href}
            className="flex items-center gap-2 hover:opacity-80"
            style={{ paddingTop: i > 0 ? 8 : 0, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
          >
            <div className="min-w-0 flex items-center gap-1.5 flex-1">
              <span className="text-[10px] font-bold px-1 rounded flex-shrink-0" style={{ background: 'var(--border)', color: 'var(--text)' }}>{m.teamAbbrev}</span>
              <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-bright)' }}>{m.name}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-mono">
              <span style={{ color: 'var(--text)', opacity: 0.6 }}>{m.before}</span>
              <span style={{ color: 'var(--text)', opacity: 0.4 }}>→</span>
              <HeatBadge heat={m.after} size="sm" />
              <span className="font-bold w-6 text-right" style={{ color }}>{m.delta > 0 ? '+' : ''}{m.delta}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HeatImpactCard({ up, down }: { up: Mover[]; down: Mover[] }) {
  if (!up.length && !down.length) return null;
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <MoverColumn title="↑ Heating Up" color="var(--rise)" movers={up} />
      <MoverColumn title="↓ Cooling Off" color="var(--cold)" movers={down} />
    </div>
  );
}
