// Now: who he is in four tiles, one objective sentence, then three cards —
// how he's doing, his role, where he's heading — each leading to its tab,
// and the next game with Energy (or his status when he isn't playing).
import { heatColor } from '@/lib/heat';
import { Card, ResultBox } from './Card';
import { HeatLine } from './HeatLine';
import { SeasonColumns } from './SeasonColumns';
import { TeamLadder } from './TeamLadder';
import { GoalieStarts } from './GoalieStarts';
import type { ProfileV3View } from './types';

const fmt = (v: ProfileV3View) => (x: number) => (v.goalie ? x.toFixed(3).replace(/^0/, '') : String(Math.round(x)));

export function NowTab({ v }: { v: ProfileV3View }) {
  const m = v.metric, f = fmt(v);
  const rated = m.current != null;
  return (
    <div className="pb-4">
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {v.bio.map(b => (
          <div key={b.sub + b.value} className="rounded-[10px] px-1.5 py-2 text-center" style={{ background: 'var(--bg-card)' }}>
            <b className="block whitespace-nowrap text-[13px] font-black" style={{ color: 'var(--text-bright)' }}>{b.value}</b>
            <span className="mt-0.5 block text-[9px] leading-tight" style={{ color: 'var(--text-dim)' }}>{b.sub}</span>
          </div>
        ))}
      </div>
      <p className="mx-1 mb-1 mt-3.5 text-[15px] font-extrabold leading-snug" style={{ color: 'var(--text-bright)' }}>{v.verdict}</p>

      {v.status && (
        <div className="mt-2.5 flex items-center rounded-[14px] border p-3" style={{ background: '#241c08', borderColor: '#4a3a10' }}>
          <div className="text-sm"><b className="font-extrabold" style={{ color: '#ffb000' }}>{v.status.text}</b><span className="block text-[11px]" style={{ color: 'var(--text-dim)' }}>{v.status.sub}</span></div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-2.5">
        <Card title="How he's doing" goto={{ tab: 'games', label: 'Games' }}>
          <div className="mb-1.5 flex items-end gap-2.5">
            <span className="text-[56px] font-black leading-[.8] tracking-[-2px]" style={{ color: rated ? (v.goalie ? 'var(--text-bright)' : heatColor(m.current!)) : '#2e3442' }}>{rated ? f(m.current!) : '–'}</span>
            {rated && m.delta != null && m.delta !== 0 && (
              <span className="pb-0.5 text-[13px] font-extrabold" style={{ color: m.delta > 0 ? 'var(--rise)' : 'var(--cold)' }}>
                {m.delta > 0 ? '▲' : '▼'} {v.goalie ? f(Math.abs(m.delta)) : Math.abs(m.delta)}<small className="block text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{m.deltaNote}</small>
              </span>
            )}
            {!rated && <span className="pb-0.5 text-[13px] font-extrabold" style={{ color: 'var(--text-dim)' }}>{m.have} of {m.need}<small className="block text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>NHL games to rate</small></span>}
            <span className="ml-auto text-right text-[8px] font-bold leading-snug tracking-[1px]" style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>{m.label}<br />after each game</span>
          </div>
          <HeatLine values={m.series} lo={m.lo} hi={m.hi} avg={m.avg} avgLabel={m.avg != null ? `avg ${f(m.avg)}` : ''} format={f}
            slots={m.have < m.need ? m.need : undefined} firstLabel={m.firstLabel} color={v.goalie ? '#e8ecf2' : 'var(--heat)'} />
          <div className="mt-2.5 border-t pt-2.5 text-[9px] font-bold uppercase tracking-[1.2px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>
            {v.goalie && m.have < 5 ? 'NHL games' : 'Last 5 games'}
          </div>
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: 5 }, (_, i) => {
              const t = v.last5[i];
              if (!t) return <div key={i} className="min-h-[38px] flex-1 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)' }} />;
              const last = i === v.last5.length - 1;
              return (
                <div key={i} className="min-h-[38px] flex-1 rounded-lg py-1.5 text-center" style={{ background: 'var(--bg)', outline: last ? '1.5px solid var(--heat)' : undefined, outlineOffset: -1.5 }}>
                  <b className="block text-xs font-black leading-tight" style={{ color: '#ff8a4c' }}>{t.top}</b>
                  <span className="mt-1 flex items-center justify-center gap-[3px] text-[9px]" style={{ color: 'var(--text-dim)' }}><ResultBox r={t.result} small />{t.opp}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div>
          <Card title="His role" goto={{ tab: 'player', label: 'Player' }}>
            {v.role.kind === 'ladder' ? <TeamLadder {...v.role.ladder} teamName={v.role.teamName} /> : <GoalieStarts rows={v.role.rows} />}
          </Card>
          <Card title="Where he's heading" goto={{ tab: 'career', label: 'Career' }}>
            <SeasonColumns columns={v.career.columns} goalie={v.goalie} mini />
            <div className="mt-1.5 text-center text-[9px]" style={{ color: 'var(--text-muted)' }}>{v.goalie ? 'save % · each season, every league' : 'points a game · rank among NHL players at his position'}</div>
          </Card>
        </div>
      </div>

      {!v.status && (
        <div className="mt-2.5 flex items-center gap-3 rounded-[14px] p-3" style={{ background: 'var(--bg-card)' }}>
          <div className="flex-1 text-sm">
            <b className="font-extrabold" style={{ color: 'var(--text-bright)' }}>{v.next ?? 'No game scheduled'}</b>
            <span className="block text-[11px]" style={{ color: 'var(--text-dim)' }}>next game</span>
          </div>
          {v.energy && (
            <div className="w-[110px]">
              <div className="text-[8px] font-bold tracking-[1px]" style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>ENERGY</div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-[3px]" style={{ background: 'var(--border)' }}><i className="block h-1.5 rounded-[3px]" style={{ width: `${v.energy.value}%`, background: 'var(--rise)' }} /></div>
              <div className="mt-0.5 flex justify-between text-[11px]" style={{ color: 'var(--text-dim)' }}><b style={{ color: 'var(--text-bright)' }}>{v.energy.value}</b><span>{v.energy.note}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
