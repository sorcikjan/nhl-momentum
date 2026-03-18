'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',           label: 'Dashboard',   icon: '◈' },
  { href: '/games',      label: 'Games',       icon: '🏒' },
  { href: '/rankings',   label: 'Rankings',    icon: '⚡' },
  { href: '/teams',      label: 'Teams',       icon: '🛡' },
  { href: '/accuracy',   label: 'Accuracy',    icon: '🎯' },
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
              <div className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>NHL Momentum</div>
              <div className="text-xs" style={{ color: 'var(--neon)' }}>Analytics</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(item => {
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

        <div className="px-5 py-4 text-xs border-t" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
          v1.0 · Model v1.0
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {NAV.map(item => {
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors"
              style={{ color: active ? 'var(--neon)' : 'var(--text)' }}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
