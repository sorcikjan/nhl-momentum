import { teamColor, teamLogo } from '@/lib/team-colors';

// Official NHL team logo (dark-background variant); `ringed` marks our pick.
// Without a team it falls back to the old colored abbreviation block.
export function TeamChip({
  abbrev,
  size = 28,
  ringed = false,
}: {
  abbrev: string;
  size?: number;
  ringed?: boolean;
}) {
  const c = teamColor(abbrev);
  const box = {
    width: size,
    height: size,
    borderRadius: Math.max(4, Math.round(size / 4)),
    border: ringed ? '2px solid var(--heat)' : undefined,
  } as const;
  if (!abbrev) {
    return <span className="inline-flex shrink-0" style={{ ...box, background: c.bg }} aria-hidden />;
  }
  return (
    <span className="inline-flex shrink-0 items-center justify-center" style={{ ...box, padding: ringed ? 1 : 0 }} title={c.name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={teamLogo(abbrev)} alt={c.name || abbrev} width={size} height={size} className="h-full w-full scale-[1.3] object-contain" loading="lazy" />
    </span>
  );
}
