import { AvatarStack } from './AvatarStack';

type P = { name: string; photo: string | null; team: string };

// "Connor McDavid" → "McDavid"; keeps multi-word last names ("Van Thompson").
export function lastNames(names: string[]): string {
  return names.map(n => { const i = n.indexOf(' '); return i > 0 ? n.slice(i + 1) : n; }).join(' · ');
}

// One team's key players in a list row: logo, three photos, last names.
export function KeyLine({ team, players }: { team: string; players: P[] }) {
  if (!players.length) return null;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <AvatarStack team={team} players={players} />
      <span className="truncate text-[11px] font-semibold" style={{ color: 'var(--text)' }}>{lastNames(players.map(p => p.name))}</span>
    </span>
  );
}
