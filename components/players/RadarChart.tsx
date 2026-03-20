'use client';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend,
} from 'recharts';

interface Props {
  momentum: Record<string, number>;
  season: Record<string, number>;
  leagueMax: Record<string, number>;
}

const METRICS = [
  { key: 'ppm',           label: 'PPM' },
  { key: 'shootingPct',   label: 'S%' },
  { key: 'goalsPerGame',  label: 'G/G' },
  { key: 'assistsPerGame',label: 'A/G' },
  { key: 'trend',         label: 'Trend' },
  { key: 'energy',        label: 'Energy' },
];

export default function PlayerRadarChart({ momentum, season, leagueMax }: Props) {
  const data = METRICS.map(m => {
    const max = leagueMax[m.key] || 1;
    return {
      metric: m.label,
      Momentum: Math.round(Math.min(100, ((momentum[m.key] ?? 0) / max) * 100)),
      Season:   Math.round(Math.min(100, ((season[m.key]   ?? 0) / max) * 100)),
    };
  });

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text)' }}>
        Performance Radar
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: 'var(--text)', fontSize: 11 }}
          />
          <Radar
            name="Momentum"
            dataKey="Momentum"
            stroke="var(--neon)"
            fill="var(--neon)"
            fillOpacity={0.25}
          />
          <Radar
            name="Season"
            dataKey="Season"
            stroke="var(--silver)"
            fill="var(--silver)"
            fillOpacity={0.1}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'var(--text)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-xs text-center mt-1" style={{ color: 'var(--text)' }}>
        100% = league leader in each metric
      </p>
    </div>
  );
}
