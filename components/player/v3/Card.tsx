// One question per card: a title, an optional link to the tab that goes deeper.
import type { ReactNode } from 'react';

export function Card({ title, right, goto, children }: { title: string; right?: string; goto?: { tab: string; label: string }; children: ReactNode }) {
  return (
    <section className="mt-2.5 rounded-[14px] p-3" style={{ background: 'var(--bg-card)' }}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-extrabold" style={{ color: 'var(--text-bright)' }}>{title}</h2>
        {goto
          ? <a href={`?tab=${goto.tab}`} data-goto={goto.tab} className="text-[11px] font-bold" style={{ color: '#ff8a4c' }}>{goto.label} ›</a>
          : right ? <span className="text-right text-[9px] font-semibold uppercase tracking-[.5px]" style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>{right}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function ResultBox({ r, small = false }: { r: 'W' | 'L' | null; small?: boolean }) {
  if (!r) return null;
  const s = small ? 'h-[11px] w-[11px] text-[7px] leading-[11px]' : 'h-[15px] w-[15px] text-[9px] leading-[15px]';
  return <i className={`inline-block rounded-[3px] text-center font-extrabold not-italic ${s}`} style={{ background: r === 'W' ? 'var(--rise)' : '#ff4d6a', color: '#0d0f14' }}>{r}</i>;
}
