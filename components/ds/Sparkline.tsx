import { heatColor } from '@/lib/heat';

// Small trend line with area fill and an end dot (design primitives.js Sparkline).
export function Sparkline({
  values,
  width = 80,
  height = 24,
  color,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (values.length < 2) return null;
  const pad = 2;
  const min = Math.min(...values);
  const range = Math.max(1, Math.max(...values) - min);
  const step = (width - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * step, height - pad - ((v - min) / range) * (height - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  const c = color ?? heatColor(values[values.length - 1]);
  return (
    <svg width={width} height={height} className="block" aria-hidden>
      <path d={`${line} L${lx.toFixed(1)},${height} L${pad},${height} Z`} fill={c} fillOpacity={0.12} />
      <path d={line} fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={2} fill={c} />
    </svg>
  );
}
