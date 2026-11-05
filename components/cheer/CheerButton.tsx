'use client';
import { TeamChip } from '@/components/ds';
import { Flag } from '@/components/nation/Flag';
import { openCheer, pickLabel } from '@/lib/cheer';
import { track } from '@/lib/analytics';
import { usePick } from './usePick';

// Header: "Pick who you cheer for" until there's a pick, then its flag or
// logo and name ("Czechs", "Bruins") — either way it opens the picker.
export function CheerButton({ compact = false }: { compact?: boolean }) {
  const pick = usePick();
  const open = () => { track('cheer_open', { picked: !!pick }); openCheer(); };
  const cls = 'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border font-semibold transition-colors hover:border-[var(--heat)]';
  if (pick === undefined) return <span aria-hidden style={{ width: compact ? 36 : 180 }} />;
  if (!pick) {
    return (
      <button type="button" onClick={open} className={`${cls} ${compact ? 'h-9 px-2.5 text-[11px]' : 'h-9 px-3 text-xs'}`}
        style={{ borderColor: 'var(--border)', color: 'var(--text-bright)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--heat)" strokeWidth={2} strokeLinecap="round" aria-hidden>
          <path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" />
        </svg>
        {compact ? 'Cheer for…' : 'Pick who you cheer for'}
      </button>
    );
  }
  return (
    <button type="button" onClick={open} aria-label={`You cheer for the ${pickLabel(pick)} — change`}
      className={`${cls} h-9 px-2 text-xs`}
      style={{ borderColor: 'var(--heat)', background: 'color-mix(in srgb, var(--heat) 8%, transparent)', color: 'var(--text-bright)' }}>
      {pick.kind === 'country' ? <Flag code={pick.code} width={21} /> : <TeamChip abbrev={pick.abbrev} size={20} />}
      {!compact && pickLabel(pick)}
    </button>
  );
}
