// The character radar: one curve for the season (white, dashed) and one for
// the last three weeks (orange), percentiles of his position; the dashed ring
// is the league average. Situations he isn't used in are listed below it,
// never drawn as a zero.
import type { Axis } from '@/lib/profile-v3';

type Props = { axes: Axis[]; unused: string[]; emptyNote?: { have: number; need: number }; labels?: string[] };

const W = 310, H = 290, CX = 155, CY = 148, R = 92;

export function Radar({ axes, unused, emptyNote, labels }: Props) {
  const names = axes.length ? axes.map(a => a.label) : labels ?? [];
  const n = Math.max(names.length, 3);
  const pt = (i: number, v: number, r = R) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [CX + Math.cos(a) * r * v / 100, CY + Math.sin(a) * r * v / 100] as const;
  };
  const ring = (v: number) => Array.from({ length: n }, (_, i) => pt(i, v).map(c => c.toFixed(1)).join(',')).join(' ');
  const curve = (f: (a: Axis) => number) => axes.map((a, i) => pt(i, f(a)).map(c => c.toFixed(1)).join(',')).join(' ');
  const hasRecent = axes.some(a => a.recent != null);
  const shown = (a: Axis) => a.recent ?? a.season;
  return (
    <div>
      {axes.length > 0 && (
        <div className="mb-0.5 flex gap-3.5 text-[11px]" style={{ color: 'var(--text-bright)' }}>
          <span><i className="mr-1.5 inline-block h-2 w-3.5 rounded-sm align-[0px]" style={{ border: '2px dashed #fff', background: 'rgba(255,255,255,.1)' }} />Season</span>
          {hasRecent && <span><i className="mr-1.5 inline-block h-2 w-3.5 rounded-sm" style={{ border: '2px solid var(--heat)', background: 'var(--heat-dim)' }} />Last 3 weeks</span>}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Percentiles among NHL players at his position" style={{ display: 'block', overflow: 'visible', maxWidth: 420, margin: '0 auto' }}>
        {[25, 75, 100].map(v => <polygon key={v} points={ring(v)} fill="none" stroke={v === 100 ? 'var(--border)' : 'var(--border-soft)'} />)}
        <polygon points={ring(50)} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />
        {Array.from({ length: n }, (_, i) => { const [x, y] = pt(i, 100); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--border-soft)" />; })}
        {axes.length > 0 && <>
          <text x={pt(0, 50)[0] + 4} y={pt(0, 50)[1] + 3} fontSize="8" fill="var(--text-dim, #8a94a6)" fontFamily="ui-monospace,monospace">AVG</text>
          <polygon points={curve(a => a.season)} fill="rgba(255,255,255,.07)" stroke="#fff" strokeWidth="2" strokeDasharray="5 3" strokeLinejoin="round" />
          {hasRecent && <polygon points={curve(a => a.recent ?? a.season)} fill="var(--heat-dim)" stroke="var(--heat)" strokeWidth="2" strokeLinejoin="round" />}
          {hasRecent && axes.map((a, i) => { const [x, y] = pt(i, a.recent ?? a.season); return <circle key={a.key} cx={x} cy={y} r="3.5" fill="var(--heat)" stroke="var(--bg-card)" strokeWidth="2" />; })}
        </>}
        {names.map((name, i) => {
          const [x, y] = pt(i, 100, R + 16);
          const anchor = Math.abs(x - CX) < 12 ? 'middle' : x > CX ? 'start' : 'end';
          const dy = y < CY - 40 ? -4 : y > CY + 40 ? 6 : 0;
          const a = axes[i];
          const d = a && a.recent != null ? a.recent - a.season : 0;
          return (
            <g key={name}>
              {a && <title>{`${name}: season ${a.season}${a.recent != null ? `, last 3 weeks ${a.recent}` : ''}`}</title>}
              <text x={x} y={y + dy} textAnchor={anchor} fontSize="10.5" fontWeight="600" fill={a ? 'var(--text-bright)' : 'var(--border)'}>{name}</text>
              {a && (
                <text x={x} y={y + dy + 12} textAnchor={anchor} fontSize="10" fontWeight="800" fill={hasRecent ? 'var(--heat)' : '#fff'}>
                  {shown(a)}
                  {Math.abs(d) >= 5 && <tspan dx="3" fontSize="8" fill={d > 0 ? 'var(--rise)' : 'var(--red)'}>{d > 0 ? '▲' : '▼'}{Math.abs(d)}</tspan>}
                </text>
              )}
            </g>
          );
        })}
        {!axes.length && emptyNote && <>
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize="20" fontWeight="900" fill="var(--text-bright)">{emptyNote.have} of {emptyNote.need}</text>
          <text x={CX} y={CY + 12} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-muted)" fontFamily="ui-monospace,monospace" letterSpacing="1">NHL GAMES</text>
        </>}
      </svg>
      {unused.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-center gap-1.5">
          {unused.map(u => <span key={u} className="rounded-md border border-dashed px-2 py-1 text-[10px]" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>{u} · not used</span>)}
        </div>
      )}
    </div>
  );
}
