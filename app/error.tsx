'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Shown only when a page has no cached copy to fall back on and its data can't
// be loaded (e.g. right after a deploy while the database is unavailable).
// Pages with a cached copy keep serving it — see assertDatabaseUp().
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[page error]', error.message, error.digest ?? '');
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--heat)' }}>
        Intermission
      </p>
      <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>
        Live data is catching up
      </h1>
      <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        We couldn&apos;t load this page&apos;s stats just now. It usually clears within a minute or two.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md px-4 py-2 text-sm font-semibold"
          style={{ background: 'var(--heat)', color: 'var(--bg)' }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md px-4 py-2 text-sm font-semibold"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
