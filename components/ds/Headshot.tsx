import { teamColor } from '@/lib/team-colors';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
}

// Round player photo (design primitives.js Headshot). Without a photo it shows
// initials on the team gradient. `caption` adds the name beside it, truncated so
// long names never widen a row on a 390px screen.
export function Headshot({
  src,
  name,
  team,
  size = 36,
  ringColor,
  caption = false,
}: {
  src: string | null | undefined;
  name: string;
  team?: string;
  size?: number;
  ringColor?: string;
  caption?: boolean;
}) {
  const c = team ? teamColor(team) : null;
  const face = (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: c
          ? `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}cc 60%, var(--bg-raised) 100%)`
          : 'var(--bg-raised)',
        color: c?.fg ?? 'var(--text-bright)',
        fontSize: Math.round(size * 0.36),
        boxShadow: ringColor ? `0 0 0 2px ${ringColor}` : undefined,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} width={size} height={size} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  );
  if (!caption) return face;
  return (
    <span className="flex min-w-0 items-center gap-2">
      {face}
      <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--text-bright)' }}>
        {name}
      </span>
    </span>
  );
}
