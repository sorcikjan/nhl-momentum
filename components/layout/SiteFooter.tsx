import Link from 'next/link';

// Trust footer (design DesktopHomeFinal). Data line names only what we use.
export function SiteFooter() {
  return (
    <footer
      className="flex flex-col gap-3 border-t px-4 pb-24 pt-6 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:pb-8"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div
        className="text-[10px] font-semibold"
        style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-muted)', letterSpacing: 1 }}
      >
        DATA · NHL Stats API
      </div>
      <nav className="flex gap-5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <Link href="/welcome" className="hover:text-[var(--text-bright)]">How Heat works</Link>
        <Link href="/accuracy" className="hover:text-[var(--text-bright)]">Methodology</Link>
      </nav>
    </footer>
  );
}
