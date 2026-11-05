'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { TeamChip } from '@/components/ds';
import { Flag } from '@/components/nation/Flag';
import { track } from '@/lib/analytics';
import { ENGLISH, NICKNAMES, OPEN_CHEER_EVENT, readPick, savePick, type CheerPick } from '@/lib/cheer';
import { TEAMS } from '@/lib/team-colors';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const COUNTRIES = Object.keys(ENGLISH);
const TEAM_LIST = Object.keys(TEAMS).sort((a, b) => NICKNAMES[a].localeCompare(NICKNAMES[b]));

// "Who do you cheer for?": a country or a team, one pick, kept in this
// browser. Mounted once in the header; opens on OPEN_CHEER_EVENT.
export function CheerPicker() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'country' | 'team'>('country');
  const [country, setCountry] = useState('CZE');
  const [team, setTeam] = useState('BOS');
  const [current, setCurrent] = useState<CheerPick | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const show = () => {
      const p = readPick();
      setCurrent(p);
      if (p?.kind === 'country') { setTab('country'); setCountry(p.code); }
      if (p?.kind === 'team') { setTab('team'); setTeam(p.abbrev); }
      setOpen(true);
    };
    window.addEventListener(OPEN_CHEER_EVENT, show);
    return () => window.removeEventListener(OPEN_CHEER_EVENT, show);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', onKey); };
  }, [open, close]);

  if (!open) return null;

  const choose = (p: CheerPick | null) => {
    savePick(p);
    track(p ? 'cheer_pick' : 'cheer_clear', p ? { kind: p.kind, pick: p.kind === 'country' ? p.code : p.abbrev } : {});
    setOpen(false);
    // The homepage opens with them: go there, at the top.
    if (p) { if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' }); else router.push('/'); }
  };
  const pick: CheerPick = tab === 'country' ? { kind: 'country', code: country } : { kind: 'team', abbrev: team };
  const cta = tab === 'country' ? `Show me the ${ENGLISH[country].adj} players` : `Show me the ${NICKNAMES[team]}`;
  const tile = (on: boolean) => ({
    borderColor: on ? 'var(--heat)' : 'var(--border)',
    background: on ? 'color-mix(in srgb, var(--heat) 8%, transparent)' : 'var(--bg-raised)',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-labelledby="cheer-title"
      style={{ background: 'rgba(5,6,9,0.8)' }} onClick={close}>
      <div className="flex max-h-[92vh] w-full max-w-[640px] flex-col gap-5 overflow-y-auto rounded-t-2xl border p-5 lg:rounded-2xl lg:p-7"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 id="cheer-title" className="text-2xl font-extrabold" style={{ color: 'var(--text-bright)' }}>Who do you cheer for?</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              Pick your country or your team. Every morning the homepage opens with how they did last night. Saved in this browser only, no account.
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
            style={{ background: 'var(--bg-raised)', color: 'var(--text-bright)' }}>×</button>
        </div>

        <div role="tablist" className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg)' }}>
          {(['country', 'team'] as const).map(t => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className="h-10 flex-1 rounded-md text-sm font-semibold"
              style={{ background: tab === t ? 'var(--bg-raised)' : 'transparent', color: tab === t ? 'var(--text-bright)' : 'var(--text)' }}>
              {t === 'country' ? 'My country' : 'My team'}
            </button>
          ))}
        </div>

        {tab === 'country' ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COUNTRIES.map(c => (
              <button key={c} type="button" onClick={() => setCountry(c)} aria-pressed={country === c}
                className="flex h-14 items-center gap-3 rounded-[10px] border px-3 text-left text-sm font-semibold" style={{ ...tile(country === c), color: 'var(--text-bright)' }}>
                <Flag code={c} width={27} />{ENGLISH[c].country}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {TEAM_LIST.map(t => (
              <button key={t} type="button" onClick={() => setTeam(t)} aria-pressed={team === t} aria-label={NICKNAMES[t]}
                className="flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-[10px] border" style={tile(team === t)}>
                <TeamChip abbrev={t} size={30} />
                <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--text)' }}>{t}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => choose(pick)} className="h-12 rounded-[10px] text-[15px] font-bold"
            style={{ background: 'var(--heat)', color: 'var(--bg)' }}>{cta}</button>
          {current && (
            <button type="button" onClick={() => choose(null)} className="h-10 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Clear my pick
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
