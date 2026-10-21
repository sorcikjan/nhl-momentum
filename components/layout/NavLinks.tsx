'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { openSearch } from '@/components/search/SearchPalette';

type Item = { href: string | null; label: string; icon?: React.ReactNode };

function isActive(path: string | null, href: string | null) {
  if (!path || !href) return false;
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
}

// Desktop nav pills (design BrandedHeaderDesktop) — client only for the active state.
export function DesktopNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {items.map(i => {
        const active = isActive(path, i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? 'page' : undefined}
            className="rounded-md px-3.5 py-2 text-[13px] font-semibold transition-colors hover:text-[var(--text-bright)]"
            style={{ color: active ? 'var(--text-bright)' : 'var(--text)', background: active ? 'var(--bg-card)' : 'transparent' }}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Mobile bottom tab bar. The design shows no mobile nav; the app needs one.
export function MobileTabBar({ items }: { items: Item[] }) {
  const path = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t lg:hidden"
      style={{ background: 'rgba(10, 11, 15, 0.92)', borderColor: 'var(--border-soft)', backdropFilter: 'blur(10px)' }}
    >
      {items.map(i => {
        const cls = 'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold';
        if (!i.href) {
          return (
            <button key={i.label} type="button" onClick={openSearch} className={cls} style={{ color: 'var(--text-muted)' }}>
              {i.icon}
              {i.label}
            </button>
          );
        }
        const active = isActive(path, i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined} className={cls} style={{ color: active ? 'var(--heat)' : 'var(--text-muted)' }}>
            {i.icon}
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
