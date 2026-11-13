'use client';
// The profile's four tabs. Every panel is server-rendered into the HTML; this
// only switches which one shows, keeps ?tab= in the URL, and pins the compact
// header + tab bar under the site header once they scroll out of view.
import { useEffect, useRef, useState, type ReactNode } from 'react';

export type TabKey = 'now' | 'games' | 'player' | 'career';
export const TABS: TabKey[] = ['now', 'games', 'player', 'career'];
const LABEL: Record<TabKey, string> = { now: 'Now', games: 'Games', player: 'Player', career: 'Career' };

type Props = { hero: ReactNode; mini: ReactNode; panels: Record<TabKey, ReactNode>; initial: TabKey };

export function ProfileTabs({ hero, mini, panels, initial }: Props) {
  const [tab, setTab] = useState<TabKey>(initial);
  const [pinned, setPinned] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // The page is cached without a query string; the tab comes from the URL here.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as TabKey | null;
    // Read once after hydration: the cached HTML can't know the query string.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t && TABS.includes(t)) setTab(t);
  }, []);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // The site header is 48px (mobile) / 72px (desktop) and fixed.
    const top = window.matchMedia('(min-width: 1024px)').matches ? 72 : 48;
    const io = new IntersectionObserver(([e]) => setPinned(!e.isIntersecting && e.boundingClientRect.top < top), { rootMargin: `-${top}px 0px 0px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = (t: TabKey) => {
    setTab(t);
    const url = new URL(window.location.href);
    if (t === 'now') url.searchParams.delete('tab'); else url.searchParams.set('tab', t);
    window.history.replaceState(null, '', url);
    window.scrollTo({ top: 0 });
  };

  // "Games ›" style links inside the panels.
  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('[data-goto]') as HTMLElement | null;
    const t = a?.dataset.goto as TabKey | undefined;
    if (t && TABS.includes(t)) { e.preventDefault(); go(t); }
  };

  const bar = (
    <div role="tablist" aria-label="Player profile" className="flex border-b px-2" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg)' }}>
      {TABS.map(t => (
        <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => go(t)}
          className="flex-1 py-3 text-xs font-bold"
          style={{ color: tab === t ? '#fff' : 'var(--text-muted)', boxShadow: tab === t ? 'inset 0 -2px 0 var(--heat)' : undefined }}>
          {LABEL[t]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[960px]" onClick={onClick}>
      <div aria-hidden={!pinned} className="fixed inset-x-0 top-12 z-40 transition-transform duration-200 lg:top-[72px]"
        style={{ transform: pinned ? 'none' : 'translateY(-150%)', visibility: pinned ? 'visible' : 'hidden' }}>
        <div className="mx-auto max-w-[960px]">{mini}{bar}</div>
      </div>
      <div className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl">
        {tab === 'now' ? hero : mini}
        <div ref={barRef}>{bar}</div>
      </div>
      {TABS.map(t => (
        <section key={t} data-panel={t} hidden={tab !== t} role="tabpanel" aria-label={LABEL[t]}>
          {panels[t]}
        </section>
      ))}
    </div>
  );
}
