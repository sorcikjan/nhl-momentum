import { heatBg, heatBorderColor } from '@/lib/heat';

interface HeatBadgeProps {
  heat: number;
  size?: 'sm' | 'md';
}

export default function HeatBadge({ heat, size = 'md' }: HeatBadgeProps) {
  const fontSize = size === 'sm' ? 12 : 14;
  const px = size === 'sm' ? 8 : 10;
  const py = size === 'sm' ? 3 : 5;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      paddingLeft: px, paddingRight: px, paddingTop: py, paddingBottom: py,
      borderRadius: 6,
      background: heatBg(heat),
      border: `1px solid ${heatBorderColor(heat)}`,
      minWidth: size === 'sm' ? 36 : 44,
    }}>
      <span style={{
        color: 'var(--heat)', fontWeight: 700,
        fontFamily: 'var(--font-mono, monospace)', fontSize,
        lineHeight: 1,
      }}>
        {heat}
      </span>
    </div>
  );
}
