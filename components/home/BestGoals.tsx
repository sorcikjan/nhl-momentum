import type { Moment } from '@/lib/moments';
import { teamColor } from '@/lib/team-colors';
import { MONO } from './format';

// The night's best goals, each opening its official clip on NHL.com.
// A strip that scrolls sideways on phones, a row on desktop.
export function BestGoals({ moments }: { moments: Moment[] }) {
  if (moments.length < 2) return null;
  return (
    <div data-section="best-goals" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>BEST GOALS LAST NIGHT</span>
        <span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>CLIPS ON NHL.COM ↗</span>
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:px-0" style={{ gridTemplateColumns: `repeat(${moments.length}, minmax(0, 1fr))` }}>
        {moments.map(m => {
          const tc = teamColor(m.team);
          return (
            <a key={m.href} href={m.href} target="_blank" rel="noopener noreferrer"
              className="group flex w-[220px] shrink-0 snap-start flex-col overflow-hidden rounded-[14px] border transition-colors hover:border-[var(--heat)] lg:w-auto"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              aria-label={`${m.kicker}: ${m.scorer}, ${m.score} — watch on NHL.com`}>
              <span className="relative block aspect-video overflow-hidden" style={{ background: `linear-gradient(140deg, ${tc.bg} 0%, var(--bg-raised) 85%)` }}>
                {m.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt="" loading="lazy" className="absolute bottom-0 right-2 h-[92%] w-auto object-contain" />
                )}
                <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-110" style={{ background: 'var(--heat)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--bg)" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
                </span>
                <span className="absolute bottom-2 left-3 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ ...MONO, background: 'rgba(0,0,0,0.55)', color: '#fff', letterSpacing: 0.6 }}>{m.when}</span>
              </span>
              <span className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
                <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.1 }}>{m.kicker}</span>
                <span className="text-[15px] font-extrabold leading-tight" style={{ color: 'var(--text-bright)' }}>{m.scorer}</span>
                <span className="text-xs" style={{ ...MONO, color: 'var(--text)' }}>{m.score}</span>
                {m.line && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.line}</span>}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
