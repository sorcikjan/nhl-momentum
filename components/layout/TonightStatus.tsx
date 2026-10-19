'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Header status pill. Fetched client-side from a CDN-cached route so it stays current
// on long-cached ISR pages and adds no work to page regeneration.
export function TonightStatus({ compact }: { compact?: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/today-count')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && typeof d?.count === 'number') setCount(d.count); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
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
