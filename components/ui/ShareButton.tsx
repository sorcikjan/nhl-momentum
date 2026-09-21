'use client';

import { useState } from 'react';

interface ShareButtonProps {
  url?: string;
  title?: string;
  /** Optional className for positioning context */
  className?: string;
}

export default function ShareButton({ url, title, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator === 'undefined') return;

    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? 'momentum.', url: shareUrl });
      } catch {
        // User cancelled or feature unavailable — fall through
      }
      return;
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed silently
    }
  }

  return (
    <button
      onClick={handleShare}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: copied ? 'var(--rise)' : 'var(--text)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        borderColor: copied ? 'rgba(0,229,160,0.4)' : 'var(--border)',
      }}
      title="Share this page"
    >
      {copied ? (
        <>
          {/* Check icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          {/* Share icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
