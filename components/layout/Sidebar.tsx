'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LiveBadge from './LiveBadge';

const NAV_DESKTOP = [
  { href: '/',          label: 'Home' },
  { href: '/games',     label: 'Games' },
  { href: '/hot',       label: 'Hot' },
  { href: '/rankings',  label: 'Rankings' },
  { href: '/search',    label: 'Search' },
];

const NAV_MOBILE = [
  {
    href: '/',
    label: 'Today',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/games',
    label: 'Games',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/hot',
    label: 'Hot',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c0 0-5 5.5-5 9.5a5 5 0 0010 0C17 7.5 12 2 12 2z"/>
        <path d="M12 14c0 0-2 1.5-2 3a2 2 0 004 0c0-1.5-2-3-2-3z"/>
      </svg>
    ),
  },
  {
    href: '/rankings',
    label: 'Ranks',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9"/>
        <rect x="10" y="7" width="4" height="14"/>
        <rect x="17" y="3" width="4" height="18"/>
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Search',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 z-50 items-center px-6 border-b"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
          <span className="text-2xl leading-none">🏒</span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-bright)' }}>
              Hockey Momentum
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--heat)' }}>
              Hockey Intelligence, Daily.
            </span>
          </div>
        </Link>

        {/* Nav links — centered */}
        <nav className="flex-1 flex items-center justify-center gap-1">
          {NAV_DESKTOP.map(item => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: active ? 'rgba(249,115,22,0.15)' : 'transparent',
                  color: active ? 'var(--heat)' : 'var(--text)',
                  border: active ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right — LIVE badge */}
        <div className="shrink-0 w-[170px] flex justify-end">
          <LiveBadge />
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {NAV_MOBILE.map(item => (
          <Link key={item.label} href={item.href}
            className="flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors gap-0.5"
            style={{ color: path === item.href ? 'var(--heat)' : 'var(--text)' }}>
            {item.svg}
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
