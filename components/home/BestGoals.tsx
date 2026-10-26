'use client';

import { useEffect, useState } from 'react';
import type { Moment } from '@/lib/moments';
import { teamColor } from '@/lib/team-colors';
import { MONO } from './format';

function PlayIcon({ size }: { size: number }) {
  return (
    <span className="flex items-center justify-center rounded-full transition-transform group-hover:scale-110" style={{ width: size, height: size, background: 'var(--heat)' }}>
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="var(--bg)" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
    </span>
  );
}

// The clip in a popup: NHL.com's own player, with NHL.com one click away
// in case the player won't start here.
function ClipModal({ m, onClose }: { m: Moment; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={m.title ?? m.scorer} onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,6,9,0.86)' }}>
      <div className="flex w-full max-w-[960px] flex-col gap-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.1 }}>{m.kicker} · {m.score} · {m.when}</span>
            <span className="text-base font-extrabold leading-snug lg:text-lg" style={{ color: '#fff' }}>{m.title ?? m.scorer}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>×</button>
        </div>
        <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16/9', background: '#000' }}>
          <iframe src={`${m.embed}&autoplay=true`} title={m.title ?? m.scorer} className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
        </div>
        <a href={m.href} target="_blank" rel="noopener noreferrer" className="self-end text-xs font-bold" style={{ ...MONO, color: 'var(--text)' }}>WATCH ON NHL.COM ↗</a>
      </div>
    </div>
  );
}

// The night's best goals: each card shows the clip's still and opens it in a
// popup (or on NHL.com when we have no player for it). Scrolls sideways on phones.
export function BestGoals({ moments }: { moments: Moment[] }) {
  const [open, setOpen] = useState<Moment | null>(null);
  if (moments.length < 2) return null;
  return (
    <div data-section="best-goals" className="flex flex-col gap-2.5">
      <span className="text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>BEST GOALS LAST NIGHT</span>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:px-0" style={{ gridTemplateColumns: `repeat(${moments.length}, minmax(0, 1fr))` }}>
        {moments.map(m => {
          const still = (
            <span className="relative block aspect-video overflow-hidden" style={{ background: `linear-gradient(140deg, ${teamColor(m.team).bg} 0%, var(--bg-raised) 85%)` }}>
              {m.thumb
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={m.thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                // eslint-disable-next-line @next/next/no-img-element
                : m.photo && <img src={m.photo} alt="" loading="lazy" className="absolute bottom-0 right-2 h-[92%] w-auto object-contain" />}
              <span className="absolute inset-0 flex items-center justify-center" style={{ background: m.thumb ? 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)' : undefined }}>
                <PlayIcon size={44} />
              </span>
              <span className="absolute bottom-2 left-2.5 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ ...MONO, background: 'rgba(0,0,0,0.6)', color: '#fff', letterSpacing: 0.6 }}>{m.when}</span>
            </span>
          );
          const text = (
            <span className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3 text-left">
              <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.1 }}>{m.kicker}</span>
              <span className="text-[15px] font-extrabold leading-tight" style={{ color: 'var(--text-bright)' }}>{m.scorer}</span>
              <span className="text-xs" style={{ ...MONO, color: 'var(--text)' }}>{m.score}</span>
              {m.line && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.line}</span>}
            </span>
          );
          const cls = 'group flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-[14px] border transition-colors hover:border-[var(--heat)] lg:w-auto';
          const style = { background: 'var(--bg-card)', borderColor: 'var(--border)' };
          const label = `${m.kicker}: ${m.scorer}, ${m.score} — watch the goal`;
          return m.embed
            ? <button key={m.href} type="button" onClick={() => setOpen(m)} className={cls} style={style} aria-label={label}>{still}{text}</button>
            : <a key={m.href} href={m.href} target="_blank" rel="noopener noreferrer" className={cls} style={style} aria-label={label}>{still}{text}</a>;
        })}
      </div>
      {open && <ClipModal m={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
