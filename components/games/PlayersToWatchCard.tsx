import Link from 'next/link';
import HeatBadge from '@/components/ui/HeatBadge';

export interface WatchPlayer {
  playerId: number;
  href: string;
  name: string;
  teamAbbrev: string;
  position: string | null;
  heat: number;
  line: string;
}

export default function PlayersToWatchCard({ players }: { players: WatchPlayer[] }) {
  if (!players.length) return null;
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--heat)', letterSpacing: '0.1em' }}>Players to Watch</div>
      <div className="space-y-2.5">
        {players.map(p => (
          <Link key={p.playerId} href={p.href} className="flex items-center justify-between gap-2 hover:opacity-80">
            <div className="min-w-0 flex items-center gap-2">
              <span className="text-[10px] font-bold px-1 rounded flex-shrink-0" style={{ background: 'var(--border)', color: 'var(--text)' }}>{p.teamAbbrev}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-bright)' }}>{p.name}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text)', opacity: 0.7 }}>
                  {p.position ? `${p.position} · ` : ''}{p.line}
                </div>
              </div>
            </div>
            <HeatBadge heat={p.heat} size="sm" />
          </Link>
        ))}
      </div>
    </div>
  );
}
