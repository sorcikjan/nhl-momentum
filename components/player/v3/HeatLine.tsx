// A value after each game this season (Heat for skaters, save % for goalies)
// with the league average drawn in. Games still missing to the 5-game
// minimum show as empty dashed circles.
type Props = {
  values: number[]; lo: number; hi: number; avg: number | null; avgLabel: string;
  format: (v: number) => string; slots?: number; firstLabel: string; color?: string;
};

const W = 300, H = 96, L = 4, R = 34, T = 16, B = 14;

export function HeatLine({ values, lo, hi, avg, avgLabel, format, slots, firstLabel, color = 'var(--heat)' }: Props) {
  const n = Math.max(slots ?? 0, values.length, 2);
  const x = (i: number) => L + ((W - L - R) * i) / (n - 1);
  const y = (v: number) => T + (H - T - B) * (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo));
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;
  const ya = avg != null ? y(avg) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${values.length} games${values.length ? `, last ${format(values[last])}` : ''}`} style={{ display: 'block', overflow: 'visible' }}>
      {ya != null && <>
        <line x1={L} x2={W - R} y1={ya} y2={ya} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <text x={W - R + 4} y={ya + 3} fontSize="9" fill="var(--text-dim, #8a94a6)">{avgLabel}</text>
      </>}
      {values.length > 2 && <polygon points={`${x(0)},${H - B} ${pts} ${x(last)},${H - B}`} fill={color} opacity=".12" />}
      {values.length > 1 && <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />}
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === last ? 4 : 2.5} fill={color} stroke="var(--bg-card)" strokeWidth="2"><title>{format(v)}</title></circle>
      ))}
      {Array.from({ length: Math.max(0, (slots ?? 0) - values.length) }, (_, k) => (
        <circle key={`e${k}`} data-slot="empty" cx={x(values.length + k)} cy={ya ?? H / 2} r="4" fill="none" stroke="var(--border)" strokeDasharray="2 2" />
      ))}
      {last >= 0 && <text x={x(last)} y={y(values[last]) - 8} textAnchor="middle" fontSize="11" fontWeight="900" fill={color}>{format(values[last])}</text>}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--border-soft)" />
      <text x={L} y={H - 2} fontSize="9" fill="var(--text-muted)">{firstLabel}</text>
      {values.length > 2 && <text x={x(last)} y={H - 2} textAnchor="end" fontSize="9" fill="var(--text-muted)">last game</text>}
    </svg>
  );
}
