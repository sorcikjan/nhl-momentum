'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PlayerSearch from './PlayerSearch';

const NAV = [
  { href: '/',           label: 'Home',        icon: '◈' },
  { href: '/games',      label: 'Games',       icon: '🏒' },
  { href: '/playoffs',   label: 'Playoffs',    icon: '🏆' },
  { href: '/rankings',   label: 'Rankings',    icon: '⚡' },
  { href: '/teams',      label: 'Teams',       icon: '🛡' },
  { href: '/recaps',     label: 'Last Night',  icon: '📰' },
  { href: '/news',       label: 'News',        icon: '📡' },
  { href: '/accuracy',   label: 'Accuracy',    icon: '🎯' },
  { href: '/search',     label: 'Search',      icon: '🔍' },
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
    href: '/rankings',
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-56 flex-col border-r"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏒</span>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>Hockey Momentum</div>
              <div className="text-xs font-medium" style={{ color: 'var(--heat)' }}>Hockey Intelligence, Daily.</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <PlayerSearch />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.filter(item => item.href !== '/search').map(item => {
            const active = path === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'var(--neon-glow)' : 'transparent',
                  color: active ? 'var(--neon)' : 'var(--text)',
                  borderLeft: active ? '2px solid var(--neon)' : '2px solid transparent',
                }}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 text-xs border-t flex flex-col gap-0.5" style={{ borderColor: 'var(--border)' }}>
          <span style={{ color: 'var(--text)' }}>AI-powered · Updated live</span>
          <span style={{ color: 'var(--text)', opacity: 0.4 }}>Model v1.8</span>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {NAV_MOBILE.map(item => {
          const active = path === item.href && item.label !== 'Ranks';
          const activeRanks = item.label === 'Ranks' && path === '/rankings';
          const isActive = active || activeRanks;
          return (
            <Link key={item.label} href={item.href}
              className="flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors gap-0.5"
              style={{ color: isActive ? 'var(--heat)' : 'var(--text)' }}>
              {item.svg}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
