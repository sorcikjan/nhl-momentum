'use client';
import { heatColor } from '@/lib/heat';

interface HeatCircleProps {
  heat: number;
  size?: number;
  delta?: number;
  label?: string;
}

export default function HeatCircle({ heat, size = 96, delta, label = 'HEAT · L5' }: HeatCircleProps) {
  const strokeWidth = Math.max(4, size * 0.06);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, heat)) / 100;
  const dashOffset = circumference * (1 - progress);
  const color = heatColor(heat);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,90,36,0.1)" strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1,
      }}>
        {label && (
          <span style={{
            color: 'rgba(255,90,36,0.55)', fontSize: size * 0.1,
            fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1,
          }}>
            {label}
          </span>
        )}
        <span style={{
          color, fontWeight: 900,
          fontSize: size * 0.3, lineHeight: 1,
          transition: 'color 0.4s ease',
        }}>
          {heat}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span style={{
            color: delta > 0 ? 'var(--rise)' : 'var(--red)',
            fontSize: size * 0.11, fontWeight: 600, lineHeight: 1,
          }}>
            {delta > 0 ? '↑ +' : '↓ '}{delta} today
          </span>
        )}
      </div>
    </div>
  );
}
