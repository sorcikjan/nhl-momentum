import { Headshot } from './Headshot';
import { TeamChip } from './TeamChip';

type P = { name: string; photo: string | null; team: string };

// Team logo + up to three overlapping player photos; names show on hover.
// A span (not a link) so it can sit inside a clickable game row.
export function AvatarStack({ team, players, size = 22 }: { team: string; players: P[]; size?: number }) {
  if (!players.length) return null;
  return (
    <span className="inline-flex items-center gap-1" title={players.map(p => p.name).join(', ')}>
      <TeamChip abbrev={team} size={Math.round(size * 0.8)} />
      <span className="flex">
        {players.slice(0, 3).map((p, i) => (
          <span key={p.name} className="rounded-full" style={{ marginLeft: i ? -size * 0.3 : 0, boxShadow: '0 0 0 2px var(--bg-card)' }}>
            <Headshot src={p.photo} name={p.name} team={p.team} size={size} />
          </span>
        ))}
      </span>
    </span>
  );
}
