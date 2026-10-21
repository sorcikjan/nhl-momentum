import { TeamChip } from '@/components/ds';
import type { CardPlayer } from '@/lib/game-card';
import { PlayerRows } from './GameCard';

type Side = { abbrev: string; name: string; players: CardPlayer[] };

function Column({ side }: { side: Side }) {
  return (
    <div className="min-w-0 rounded-[14px] border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: 'var(--border-soft)' }}>
        <TeamChip abbrev={side.abbrev} size={22} />
        <span className="truncate text-[13px] font-bold" style={{ color: 'var(--text-bright)' }}>{side.name}</span>
      </div>
      <div className="px-4 py-3">
        <PlayerRows team={side.abbrev} players={side.players} link />
      </div>
    </div>
  );
}

// Game page "Key players": the same three-per-team rows as the game cards.
export function KeyPlayers({ away, home }: { away: Side; home: Side }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
      <Column side={away} />
      <Column side={home} />
    </div>
  );
}
