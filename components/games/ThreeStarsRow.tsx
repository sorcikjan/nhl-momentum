import Link from 'next/link';
import HeatBadge from '@/components/ui/HeatBadge';

const MEDAL = { 1: '★1', 2: '★2', 3: '★3' } as const;
const MEDAL_COLOR = { 1: 'var(--heat)', 2: '#c9a961', 3: 'var(--silver)' } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ThreeStarsRow({ stars, heatByPlayerId }: { stars: any[]; heatByPlayerId?: Map<number, number> }) {
  if (!stars.length) return null;
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--heat)', letterSpacing: '0.1em' }}>Three Stars</div>
      <div className="grid grid-cols-3 gap-3">
        {stars.map((star) => {
          const medal = (star.star as 1 | 2 | 3) ?? 3;
          const heat = heatByPlayerId?.get(star.playerId) ?? null;
          return (
            <Link
              key={star.star}
              href={star.playerId ? `/players/${star.playerId}` : '#'}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <span className="text-xs font-mono font-bold" style={{ color: MEDAL_COLOR[medal] }}>{MEDAL[medal]}</span>
              {star.headshot && (
                <img src={star.headshot} alt={star.name?.default ?? ''} className="w-12 h-12 rounded-full object-cover" />
              )}
              <span className="text-xs font-semibold text-center leading-tight" style={{ color: 'var(--text-bright)' }}>
                {star.name?.default ?? ''}
              </span>
              <span className="text-xs" style={{ color: 'var(--text)' }}>
                {star.position === 'G'
                  ? `${star.savePctg !== undefined ? (star.savePctg * 100).toFixed(1) + '% SV' : ''}`
                  : `${star.points ?? 0}pts (${star.goals ?? 0}G ${star.assists ?? 0}A)`}
              </span>
              {heat !== null && <HeatBadge heat={heat} size="sm" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
