// Season by season. Skaters: column height = rank among NHL players at his
// position (top = best, dashed = average), points a game on top. Goalies:
// save % on a labeled scale, every league. Team written out under each column.
import type { Column } from '@/lib/profile-v3';
import { TEAMS } from '@/lib/team-colors';

const SV_LO = 0.88, SV_HI = 0.95;
const fmtSv = (v: number) => v.toFixed(3).replace(/^0/, '');
const shortName = (c: Column) => (c.team ? TEAMS[c.team]?.name ?? c.teamName : c.teamName.replace(/^HC\s+/, ''));

export function SeasonColumns({ columns, goalie, mini = false }: { columns: Column[]; goalie: boolean; mini?: boolean }) {
  if (!columns.length) {
    return <div className="py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No NHL season yet</div>;
  }
  const height = (c: Column) => goalie
    ? Math.round(Math.max(0, Math.min(1, (c.value - SV_LO) / (SV_HI - SV_LO))) * 100)
    : c.pct ?? 0;
  const color = (c: Column) => goalie
    ? (c.team ? TEAMS[c.team]?.bg ?? 'var(--text-muted)' : 'var(--text-muted)')
    : (c.pct ?? 0) >= 95 ? 'var(--heat)' : (c.pct ?? 0) >= 80 ? '#ff7a3a' : (c.pct ?? 0) >= 50 ? '#ffb27a' : '#5a6378';
  const guides = goalie
    ? [0.95, 0.93, 0.91, 0.89].map(v => ({ top: `${(1 - (v - SV_LO) / (SV_HI - SV_LO)) * 100}%`, label: fmtSv(v), dashed: false }))
    : [{ top: '0%', label: 'BEST', dashed: false }, { top: '50%', label: 'AVG', dashed: true }];
  return (
    <div>
      <div className="relative flex gap-2 pl-[30px] pr-1" style={{ height: mini ? 84 : 140, marginTop: mini ? 30 : 40 }}>
        {guides.map(g => (
          <div key={g.label} className="absolute inset-x-0" style={{ top: g.top, borderTop: `1px ${g.dashed ? 'dashed var(--text-muted)' : 'solid var(--border-soft)'}` }}>
            <span className="absolute left-0 -top-1 pr-1 text-[8px] font-bold" style={{ background: 'var(--bg-card)', color: g.dashed ? 'var(--text-dim, #8a94a6)' : 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>{g.label}</span>
          </div>
        ))}
        {columns.map((c, i) => {
          const h = height(c);
          return (
            <div key={i} className="relative z-[1] flex-1">
              <i data-thin={c.thin ? 'true' : undefined} className="absolute bottom-0 left-[12%] right-[12%] block rounded-t" style={{
                height: `${h}%`,
                background: c.thin ? `repeating-linear-gradient(135deg, ${color(c)} 0 3px, transparent 3px 6px)` : color(c),
              }} />
              <div className="absolute -inset-x-1.5 text-center leading-tight" style={{ bottom: `calc(${h}% + 4px)` }}>
                <b className={`block font-black ${mini ? 'text-[11px]' : 'text-[13px]'}`} style={{ color: 'var(--text-bright)' }}>{goalie ? fmtSv(c.value) : c.value.toFixed(2)}</b>
                {!mini && <small className="text-[9px] font-bold" style={{ color: 'var(--text-dim, #8a94a6)' }}>{goalie ? `${c.gp} gp` : c.top != null ? `top ${c.top}%` : `${c.gp} gp`}</small>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 border-t pl-[30px] pr-1 pt-1.5" style={{ borderColor: 'var(--border)' }}>
        {columns.map((c, i) => (
          <div key={i} className="flex-1 text-center text-[9px] leading-tight" style={{ color: 'var(--text-dim, #8a94a6)' }}>
            {!mini && (c.team
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={`https://assets.nhle.com/logos/nhl/svg/${c.team}_dark.svg`} alt="" className="mx-auto mb-0.5 block h-[22px]" />
              : <span className="mx-auto mb-1 mt-0.5 block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--text-muted)' }} />)}
            {!mini && <b className="block text-[9.5px] font-bold" style={{ color: 'var(--text-bright)' }}>{shortName(c)}</b>}
            {!mini && goalie && c.league !== 'NHL' && <>{c.league}<br /></>}
            {c.season}
          </div>
        ))}
      </div>
    </div>
  );
}
