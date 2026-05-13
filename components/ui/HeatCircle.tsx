'use client';

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

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,90,36,0.12)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--heat)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1,
      }}>
        {label && (
          <span style={{
            color: 'rgba(255,90,36,0.6)', fontSize: size * 0.1,
            fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1,
          }}>
            {label}
          </span>
        )}
        <span style={{
          color: 'var(--heat)', fontWeight: 900,
          fontSize: size * 0.3, lineHeight: 1,
        }}>
          {heat}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span style={{
            color: delta > 0 ? 'var(--green)' : 'var(--red)',
            fontSize: size * 0.11, fontWeight: 600, lineHeight: 1,
          }}>
            {delta > 0 ? '↑ +' : '↓ '}{delta} today
          </span>
        )}
      </div>
    </div>
  );
}
