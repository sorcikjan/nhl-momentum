'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hotPlayers, searchIndex, type SearchIndex } from '@/lib/search';
import { SearchList, flattenRows, type SearchRow, type SearchSection } from './SearchList';

export const OPEN_SEARCH_EVENT = 'momentum:open-search';
export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));

const RECENT_KEY = 'momentum.recentSearches';
const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// One fetch per page load, shared by every open.
let indexPromise: Promise<SearchIndex> | null = null;
function loadIndex(): Promise<SearchIndex> {
  indexPromise ??= fetch('/api/search-index')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`search index ${r.status}`))))
    .catch(err => { indexPromise = null; throw err; });
  return indexPromise;
}

function readRecent(): SearchRow[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function saveRecent(row: SearchRow) {
  try {
    const next = [row, ...readRecent().filter(r => !(r.kind === row.kind && r.item.id === row.item.id))].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* private mode: recent searches are a convenience only */ }
}

// Search overlay: centered palette on desktop, full-screen sheet on mobile.
// Opens from the header / tab bar triggers, ⌘K / Ctrl+K, or "/".
export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [recent, setRecent] = useState<SearchRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const show = useCallback(() => {
    setOpen(true);
    setRecent(readRecent());
    setFailed(false);
    loadIndex().then(setIndex, () => setFailed(true));
  }, []);
  const close = useCallback(() => { setOpen(false); setQuery(''); setActive(0); }, []);

  // Triggers: custom event, ⌘K / Ctrl+K, "/" outside text fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName));
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener(OPEN_SEARCH_EVENT, show); window.removeEventListener('keydown', onKey); };
  }, [show]);

  // Focus the field and lock page scroll while open. (Picking a result closes it.)
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const sections: SearchSection[] = useMemo(() => {
    if (query.trim()) {
      if (!index) return [];
      const rows = flattenRows(searchIndex(index, query));
      return [
        { title: 'TEAMS', rows: rows.filter(r => r.kind === 'team') },
        { title: 'PLAYERS', rows: rows.filter(r => r.kind === 'player') },
      ];
    }
    return [
      { title: 'RECENT', rows: recent },
      { title: '🔥 HOT RIGHT NOW', rows: index ? hotPlayers(index, 5).map(item => ({ kind: 'player' as const, item })) : [] },
    ];
  }, [query, index, recent]);
  const rows = useMemo(() => sections.flatMap(s => s.rows), [sections]);

  const pick = useCallback((row: SearchRow) => { saveRecent(row); close(); }, [close]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!rows.length) return;
      const next = (active + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      setActive(next);
      listRef.current?.querySelector(`[data-row="${next}"]`)?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && rows[active]) {
      e.preventDefault();
      pick(rows[active]);
      router.push(rows[active].item.href);
    }
  };

  if (!open) return null;
  const empty = query.trim() && index && !rows.length;
  return (
    <div className="fixed inset-0 z-[100] flex justify-center lg:items-start" role="dialog" aria-modal="true" aria-label="Search players and teams">
      <div className="absolute inset-0 hidden lg:block" style={{ background: 'rgba(5, 6, 9, 0.7)', backdropFilter: 'blur(4px)' }} onClick={close} />
      <div
        className="relative flex h-full w-full flex-col overflow-hidden lg:mt-[12vh] lg:h-auto lg:max-h-[70vh] lg:max-w-[600px] lg:rounded-2xl lg:border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border-soft)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onInputKey}
            placeholder="Search players & teams"
            aria-label="Search players and teams"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            className="min-w-0 flex-1 bg-transparent text-base outline-none lg:text-[15px]"
            style={{ color: 'var(--text-bright)' }}
          />
          <button onClick={close} className="text-sm font-semibold lg:hidden" style={{ color: 'var(--heat)' }}>Cancel</button>
          <kbd className="hidden rounded border px-1.5 py-0.5 text-[10px] lg:inline" style={{ ...MONO, color: 'var(--text-muted)', borderColor: 'var(--border)' }}>esc</kbd>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          {failed ? (
            <p className="px-4 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Search is unavailable right now. Try again in a moment.</p>
          ) : !index && (query.trim() || !recent.length) ? (
            <p className="px-4 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Loading players…</p>
          ) : empty ? (
            <p className="px-4 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No players or teams match “{query.trim()}”.</p>
          ) : (
            <SearchList sections={sections} active={active} onPick={pick} />
          )}
        </div>
      </div>
    </div>
  );
}

// Header triggers: a wide "search" field on desktop, an icon on mobile.
export function SearchTrigger({ variant }: { variant: 'pill' | 'icon' }) {
  const icon = (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
  if (variant === 'icon') {
    return (
      <button onClick={openSearch} aria-label="Search players & teams" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {icon(12)}
      </button>
    );
  }
  return (
    <button
      onClick={openSearch}
      className="flex w-[260px] items-center gap-2 rounded-full px-3.5 py-1.5 text-left text-[13px] transition-colors hover:border-[var(--text-muted)]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
    >
      {icon(14)}
      <span className="flex-1">Search players &amp; teams</span>
      <kbd className="rounded border px-1.5 text-[10px]" style={{ ...MONO, borderColor: 'var(--border)' }}>⌘K</kbd>
    </button>
  );
}
