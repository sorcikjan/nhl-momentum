import Link from 'next/link';

// Pill filters as links (design games list / rankings chips). Server-rendered:
// the active state comes from the URL, not client state.
export function FilterChips({
  options,
}: {
  options: { label: string; href: string; active: boolean }[];
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {options.map(o => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.active ? 'page' : undefined}
          className="rounded-full px-3.5 py-2 text-xs font-semibold transition-colors"
          style={{
            color: o.active ? 'var(--heat)' : 'var(--text)',
            background: o.active ? 'var(--heat-dim)' : 'var(--bg-card)',
            border: `1px solid ${o.active ? 'rgba(255, 90, 36, 0.4)' : 'var(--border)'}`,
          }}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
