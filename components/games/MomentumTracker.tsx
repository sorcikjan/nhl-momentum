'use client';
import { ComposedChart, Area, ReferenceLine, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { MomentumPoint } from '@/lib/play-by-play';

export default function MomentumTracker({
  momentum, homeAbbrev, awayAbbrev,
}: {
  momentum: MomentumPoint[];
  homeAbbrev: string;
  awayAbbrev: string;
}) {
  if (momentum.length <= 1) {
    return (
      <div className="py-10 text-center text-sm" style={{ color: 'var(--text)' }}>
        No goals yet — the tracker fills in as the game is played.
      </div>
    );
  }

  const data = momentum.map((pt, i) => ({
    i,
    margin: pt.homeScore - pt.awayScore,
    label: pt.scorerTeamId === null ? 'Start' : `P${pt.period} ${pt.timeInPeriod}`,
    scoreLabel: `${awayAbbrev} ${pt.awayScore}–${pt.homeScore} ${homeAbbrev}`,
  }));

  const finalMargin = data[data.length - 1].margin;
  const lineColor = finalMargin > 0 ? 'var(--heat)' : finalMargin < 0 ? 'var(--cold)' : 'var(--silver)';

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.22} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <ReferenceLine y={0} stroke="var(--border)" />
          <XAxis dataKey="i" hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[number];
              return (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontFamily: 'monospace' }}>
                  <div style={{ color: 'var(--text)' }}>{p.label}</div>
                  <div style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{p.scoreLabel}</div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="margin"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#momentumGrad)"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot={(props: any) => (
              <circle key={props.index} cx={props.cx} cy={props.cy} r={3} fill={lineColor} stroke="var(--bg-card)" strokeWidth={1.5} />
            )}
            activeDot={{ r: 5, fill: lineColor, stroke: 'var(--bg-card)', strokeWidth: 1.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs mt-1 px-1" style={{ color: 'var(--text)', opacity: 0.6 }}>
        <span>{awayAbbrev} pushing</span>
        <span>{homeAbbrev} pushing</span>
      </div>
    </div>
  );
}
