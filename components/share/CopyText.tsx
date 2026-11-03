'use client';

import { useState } from 'react';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// A block of post text with one button that copies it as is.
export function CopyText({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked: select by hand */ }
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1 }}>{label}</span>
        <button type="button" onClick={copy} className="rounded-md border px-2.5 py-1 text-[11px] font-bold" style={{ ...MONO, borderColor: 'var(--border)', color: copied ? 'var(--rise)' : 'var(--text-bright)' }}>
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed" style={{ background: 'var(--bg)', borderColor: 'var(--border-soft)', color: 'var(--text)', fontFamily: 'inherit' }}>{text}</pre>
    </div>
  );
}
