import Link from 'next/link';
import HeatBadge from '@/components/ui/HeatBadge';

const MEDAL_LABEL = { 1: '★1', 2: '★2', 3: '★3' } as const;
const MEDAL_COLOR = { 1: 'var(--heat)', 2: '#c9a961', 3: 'var(--silver)' } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ThreeStarsRow({ stars, heatByPlayerId }: { stars: any[]; heatByPlayerId?: Map<number, number> }) {
  if (!stars.length) return null;
  return (
    <div>
      <div className="text-[11px] font-mono font-bold uppercase mb-1.5" style={{ color: 'var(--heat)', letterSpacing: '0.12em' }}>Three Stars · Official</div>
      <div className="font-sans font-extrabold mb-3" style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', color: 'var(--text-bright)', letterSpacing: '-0.03em' }}>
        Tonight&apos;s best.
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stars.map((star) => {
          const medal = (star.star as 1 | 2 | 3) ?? 3;
          const heat = heatByPlayerId?.get(star.playerId) ?? null;
          const statLine = star.position === 'G'
            ? `${star.savePctg !== undefined ? (star.savePctg * 100).toFixed(1) + '% SV%' : '—'}`
            : `${star.goals ?? 0}G ${star.assists ?? 0}A${star.plusMinus != null ? ` · ${star.plusMinus > 0 ? '+' : ''}${star.plusMinus}` : ''}`;
          return (
            <Link
              key={star.star}
              href={star.playerId ? `/players/${star.playerId}` : '#'}
              className="hover:opacity-80 transition-opacity relative"
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${medal === 1 ? 'rgba(255,90,36,0.35)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: 18,
                boxShadow: medal === 1 ? '0 0 16px rgba(255,90,36,0.12)' : 'none',
                display: 'block',
              }}
            >
              {/* Star medal — top right */}
              <div
                className="font-sans font-black absolute"
                style={{
                  top: 14, right: 14,
                  fontSize: 28,
                  color: MEDAL_COLOR[medal],
                  opacity: 0.85,
                  lineHeight: 1,
                }}
              >
                {MEDAL_LABEL[medal]}
              </div>

              {/* Team logo or headshot */}
              {star.headshot ? (
                <img src={star.headshot} alt={star.name?.default ?? ''} className="w-8 h-8 rounded-full object-cover mb-2.5" />
              ) : (
                <div className="w-8 h-8 rounded-lg mb-2.5 flex items-center justify-center text-xs font-bold" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {(star.name?.default ?? '?')[0]}
                </div>
              )}

              {/* Name */}
              <div
                className="font-sans font-extrabold leading-tight mb-1"
                style={{ fontSize: 17, color: 'var(--text-bright)', letterSpacing: '-0.02em', paddingRight: 36 }}
              >
                {star.name?.default ?? ''}
              </div>

              {/* Stat line */}
              <div className="font-mono mb-3" style={{ fontSize: 10, color: 'var(--text)', letterSpacing: '0.02em' }}>
                {statLine}
              </div>

              {/* Heat badge */}
              {heat !== null && (
                <div className="flex items-center gap-1.5">
                  <HeatBadge heat={heat} size="sm" />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
