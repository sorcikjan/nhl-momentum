'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TonightPill() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const { count: c } = await supabase
        .from('games')
        .select('id', { count: 'exact', head: true })
        .eq('game_date', today);
      setCount(c ?? 0);
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {count !== null && (
        <Link
          href="/games"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold hover:opacity-80 transition-opacity"
          style={{
            background: 'rgba(255,90,36,0.12)',
            border: '1px solid rgba(255,90,36,0.3)',
            color: 'var(--heat)',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.6875rem',
            letterSpacing: '0.06em',
          }}
        >
          TONIGHT · {count}
        </Link>
      )}

      {/* Decorative avatar placeholder — no auth in this app */}
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 30,
          height: 30,
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </div>
    </div>
  );
}
