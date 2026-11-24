// One question per card: a title, an optional link to the tab that goes deeper.
// On a phone the title sits inside the card. On desktop (lg) it moves above it
// as a section heading with a kicker, like the site's other pages, and the
// sections get room between them (desktop prototype v24, 2026-11-24).
import type { ReactNode } from 'react';

type Props = { title: string; kicker?: string; right?: string; goto?: { tab: string; label: string }; children: ReactNode };

export function Card({ title, kicker, right, goto, children }: Props) {
  return (
    <section className="mt-2.5 rounded-[14px] bg-[var(--bg-card)] p-3 lg:mt-14 lg:rounded-none lg:bg-transparent lg:p-0">
      <div className="mb-2 flex items-baseline justify-between gap-2 lg:mb-4 lg:items-end lg:gap-4">
        <div className="min-w-0">
          {kicker && <div className="mb-1.5 hidden text-[11px] font-bold tracking-[1.4px] lg:block" style={{ color: 'var(--heat)', fontFamily: 'ui-monospace,monospace' }}>{kicker}</div>}
          <h2 className="text-sm font-extrabold lg:text-2xl lg:tracking-[-.6px]" style={{ color: 'var(--text-bright)' }}>{title}</h2>
        </div>
        {goto
          ? <a href={`?tab=${goto.tab}`} data-goto={goto.tab} className="text-[11px] font-bold lg:text-sm" style={{ color: '#ff8a4c' }}>{goto.label} ›</a>
          : right ? <span className="text-right text-[9px] font-semibold uppercase tracking-[.5px] lg:text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>{right}</span> : null}
      </div>
      <div className="lg:rounded-[14px] lg:bg-[var(--bg-card)] lg:px-7 lg:py-6">{children}</div>
    </section>
  );
}

export function ResultBox({ r, small = false }: { r: 'W' | 'L' | null; small?: boolean }) {
  if (!r) return null;
  const s = small ? 'h-[11px] w-[11px] text-[7px] leading-[11px]' : 'h-[15px] w-[15px] text-[9px] leading-[15px]';
  return <i className={`inline-block rounded-[3px] text-center font-extrabold not-italic ${s}`} style={{ background: r === 'W' ? 'var(--rise)' : '#ff4d6a', color: '#0d0f14' }}>{r}</i>;
}
