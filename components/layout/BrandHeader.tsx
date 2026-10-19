import Link from 'next/link';
import { HeatPulseMark } from '@/components/ds';
import { fetchTodayGameCount } from '@/lib/data';
import { DesktopNav, MobileTabBar } from './NavLinks';

// Design BrandedHeaderDesktop / BrandedHeaderMobile.
export const NAV_ITEMS = [
  { href: '/', label: 'Tonight' },
  { href: '/hot', label: 'Heat map' },
  { href: '/search', label: 'Players' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/recaps', label: 'Stories' },
];

const icon = (d: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

export const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Tonight', icon: icon(<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>) },
  { href: '/games', label: 'Games', icon: icon(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>) },
  { href: '/hot', label: 'Heat', icon: icon(<path d="M12 2c0 0-5 5.5-5 9.5a5 5 0 0010 0C17 7.5 12 2 12 2z" />) },
  { href: '/rankings', label: 'Rankings', icon: icon(<><rect x="3" y="12" width="4" height="9" /><rect x="10" y="7" width="4" height="14" /><rect x="17" y="3" width="4" height="18" /></>) },
  { href: '/search', label: 'Players', icon: icon(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>) },
];

// "momentum." lockup with the HeatPulse mark (design MomentumWordmark).
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 leading-none">
      <HeatPulseMark size={Math.round(size * 1.2)} />
      <span className="font-extrabold" style={{ fontSize: size, letterSpacing: -size * 0.04, color: 'var(--text-bright)' }}>
        momentum<span style={{ color: 'var(--heat)' }}>.</span>
      </span>
    </span>
  );
}

function TonightStatus({ count, compact }: { count: number | null; compact?: boolean }) {
  if (count == null) return null;
  const live = count > 0;
  return (
    <Link
      href="/games"
      className="inline-flex items-center gap-1.5 rounded-full font-bold"
      style={{
        padding: compact ? '4px 8px' : '6px 10px',
        background: live ? 'var(--heat-dim)' : 'var(--bg-card)',
        border: `1px solid ${live ? 'rgba(255, 90, 36, 0.33)' : 'var(--border)'}`,
        color: live ? 'var(--heat)' : 'var(--text)',
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize: compact ? 9 : 10,
        letterSpacing: compact ? 0.8 : 1,
      }}
    >
      {live && <span className="rounded-full" style={{ width: 6, height: 6, background: 'var(--heat)', boxShadow: '0 0 8px var(--heat)' }} />}
      {live ? `TONIGHT · ${count}` : 'NO GAMES TODAY'}
    </Link>
  );
}

const SearchButton = ({ size }: { size: number }) => (
  <Link
    href="/search"
    aria-label="Search players"
    className="flex shrink-0 items-center justify-center rounded-full"
    style={{ width: size, height: size, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
  >
    <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  </Link>
);

export default async function BrandHeader() {
  // Server-rendered and cached — replaces the old per-visitor client polling.
  const count = await fetchTodayGameCount().catch(() => null);
  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 hidden h-[72px] items-center justify-between border-b px-12 lg:flex"
        style={{ background: 'rgba(10, 11, 15, 0.85)', borderColor: 'var(--border-soft)', backdropFilter: 'blur(10px)' }}
      >
        <Link href="/" aria-label="momentum. home">
          <Wordmark size={22} />
        </Link>
        <DesktopNav items={NAV_ITEMS} />
        <div className="flex items-center gap-3">
          <TonightStatus count={count} />
          <SearchButton size={30} />
        </div>
      </header>
      <header
        className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b px-4 lg:hidden"
        style={{ background: 'rgba(10, 11, 15, 0.92)', borderColor: 'var(--border-soft)', backdropFilter: 'blur(10px)' }}
      >
        <Link href="/" aria-label="momentum. home">
          <Wordmark size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <TonightStatus count={count} compact />
          <SearchButton size={24} />
        </div>
      </header>
      <MobileTabBar items={MOBILE_NAV_ITEMS} />
    </>
  );
}
