import Link from 'next/link';
import { CookieSettingsButton } from '@/components/analytics/Analytics';
import { Flag } from '@/components/nation/Flag';
import { NATIONS } from '@/lib/nations';

// Trust footer (design DesktopHomeFinal). Data line names only what we use.
export function SiteFooter() {
  return (
    <footer
      data-section="footer"
      className="flex flex-col gap-3 border-t px-4 pb-24 pt-6 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:pb-8"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div
        className="text-[10px] font-semibold"
        style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-muted)', letterSpacing: 1 }}
      >
        DATA · NHL Stats API
      </div>
      <nav aria-label="NHL players by nation" className="flex flex-wrap items-center gap-2.5">
        {Object.values(NATIONS).map(n => (
          <Link key={n.code} href={n.path} title={n.label} aria-label={n.label} lang={n.lang}
            className="flex h-6 items-center opacity-70 transition-opacity hover:opacity-100">
            <Flag code={n.code} width={21} />
          </Link>
        ))}
      </nav>
      <nav className="flex flex-wrap gap-5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <Link href="/predictions" className="hover:text-[var(--text-bright)]">Tonight&apos;s predictions</Link>
        <Link href="/about#heat" className="hover:text-[var(--text-bright)]">How Heat works</Link>
        <Link href="/about" className="hover:text-[var(--text-bright)]">About</Link>
        <Link href="/accuracy" className="hover:text-[var(--text-bright)]">Methodology</Link>
        <CookieSettingsButton />
      </nav>
    </footer>
  );
}
