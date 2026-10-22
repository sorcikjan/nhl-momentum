'use client';

import { useEffect, useRef, useState } from 'react';
import { shareLinks } from '@/lib/share';
import { pageType, track } from '@/lib/analytics';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

const itemStyle = { color: 'var(--text-bright)' } as const;
const itemCls = 'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-semibold hover:bg-[var(--bg-hover)]';

export function ShareMenu({ url, text, copied, onCopy, onShare }: { url: string; text: string; copied: boolean; onCopy: () => void; onShare?: (method: 'x' | 'reddit') => void }) {
  const l = shareLinks(url, text);
  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border p-1.5"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}
    >
      <button role="menuitem" type="button" onClick={onCopy} className={itemCls} style={{ ...itemStyle, color: copied ? 'var(--rise)' : itemStyle.color }}>
        {copied ? '✓ Link copied' : 'Copy link'}
      </button>
      <a role="menuitem" href={l.x} onClick={() => onShare?.('x')} target="_blank" rel="noopener noreferrer" className={itemCls} style={itemStyle}>Post on X</a>
      <a role="menuitem" href={l.reddit} onClick={() => onShare?.('reddit')} target="_blank" rel="noopener noreferrer" className={itemCls} style={itemStyle}>Post to Reddit</a>
      <p className="truncate px-3 pb-1 pt-1.5 text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }} title={text}>{text}</p>
    </div>
  );
}

// Share: the native share sheet on touch devices; elsewhere a small menu with
// copy link, X and Reddit, all pre-filled with `text`.
export default function ShareButton({ path, text, className }: { path?: string; text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const url = () => (typeof window === 'undefined' ? '' : `${window.location.origin}${path ?? window.location.pathname}`);
  const sharePath = () => path ?? window.location.pathname;
  const tracked = (method: string) => track('share', { method, content_type: pageType(sharePath()), item_id: sharePath() });

  async function onClick() {
    const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (touch && typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: text, text, url: url() }); tracked('native'); } catch { /* cancelled */ }
      return;
    }
    setOpen(o => !o);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      tracked('copy_link');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: the menu still offers X / Reddit */ }
  }

  return (
    <div ref={ref} className={`relative inline-block ${className ?? ''}`}>
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors hover:border-[var(--text-muted)]"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-bright)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>
      {open && <ShareMenu url={url()} text={text} copied={copied} onCopy={copy} onShare={tracked} />}
    </div>
  );
}
