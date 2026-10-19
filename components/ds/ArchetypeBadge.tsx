// AI-identified player archetype (design player-profile-final.js ArchetypeBadge).

function ArchetypeIcon({ archetype, size }: { archetype: string; size: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' } as const;
  const stroke = { stroke: 'var(--heat)', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (archetype.toLowerCase()) {
    case 'playmaker':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="3" fill="var(--heat)" />
          <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" {...stroke} />
        </svg>
      );
    case 'sniper':
    case 'striker':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <circle cx="12" cy="12" r="3" fill="var(--heat)" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...stroke} />
        </svg>
      );
    case 'enforcer':
      return (
        <svg {...s}>
          <path d="M12 2 L20 5 V12 C20 17 16 21 12 22 C8 21 4 17 4 12 V5 Z" fill="var(--heat)" />
        </svg>
      );
    case 'two-way':
    case 'two-way center':
    case 'two-way forward':
      return (
        <svg {...s}>
          <path d="M8 4v16M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4" {...stroke} />
        </svg>
      );
    case 'defender':
    case 'puck-mover':
    case 'shutdown defender':
    case 'offensive defenseman':
      return (
        <svg {...s}>
          <path d="M12 3 L19 6 V12 C19 16 16 20 12 21 C8 20 5 16 5 12 V6 Z" {...stroke} />
          <path d="M12 9v6M9 12l3 3 3-3" {...stroke} />
        </svg>
      );
    case 'power forward':
      return (
        <svg {...s}>
          <rect x="5" y="9" width="14" height="10" rx="2" fill="var(--heat)" />
          <path d="M12 3v6M9 6l3-3 3 3" {...stroke} />
        </svg>
      );
    default:
      return (
        <svg {...s}>
          <path d="M12 3 C10 8 7 9 7 13 C7 17 9 20 12 20 C15 20 17 17 17 13 C17 9 14 8 12 3 Z" fill="var(--heat)" />
        </svg>
      );
  }
}

export function ArchetypeBadge({
  archetype,
  blurb,
  tags = [],
  compact = false,
}: {
  archetype: string;
  blurb?: string | null;
  tags?: string[];
  compact?: boolean;
}) {
  const mono = { fontFamily: 'var(--font-geist-mono), monospace' } as const;
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-2.5 rounded-full px-3 py-2"
        style={{ background: 'var(--heat-dim)', border: '1px solid rgba(255, 90, 36, 0.33)' }}
      >
        <ArchetypeIcon archetype={archetype} size={18} />
        <span className="text-xs font-bold" style={{ color: 'var(--heat)', letterSpacing: 0.2 }}>{archetype}</span>
        <span className="text-[9px] font-semibold" style={{ ...mono, color: 'var(--text-muted)', letterSpacing: 1 }}>· AI</span>
      </span>
    );
  }
  return (
    <div
      className="flex items-center gap-3.5 rounded-xl px-4 py-3"
      style={{ background: 'var(--heat-dim)', border: '1px solid rgba(255, 90, 36, 0.33)', boxShadow: '0 0 14px rgba(255, 90, 36, 0.13)' }}
    >
      <div
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--bg)', border: '1px solid rgba(255, 90, 36, 0.33)' }}
      >
        <ArchetypeIcon archetype={archetype} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[9px] font-bold" style={{ ...mono, color: 'var(--heat)', letterSpacing: 1.4 }}>AI ARCHETYPE</div>
        <div className="text-lg font-extrabold leading-tight" style={{ color: 'var(--text-bright)', letterSpacing: -0.4 }}>{archetype}</div>
        {blurb && <div className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--text)' }}>{blurb}</div>}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span
                key={t}
                className="rounded px-2 py-[3px] text-[9px] font-bold"
                style={{ ...mono, color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border-soft)', letterSpacing: 0.4 }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
