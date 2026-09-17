import type { RecentPlay } from '@/lib/play-by-play';

const TYPE_META: Record<RecentPlay['type'], { label: string; color: string }> = {
  goal: { label: 'GOAL', color: 'var(--heat)' },
  'shot-on-goal': { label: 'SHOT', color: 'var(--cold)' },
  'missed-shot': { label: 'SHOT', color: 'var(--text)' },
  penalty: { label: 'PEN', color: 'var(--amber)' },
  hit: { label: 'HIT', color: 'var(--silver)' },
};

export default function RecentActionFeed({ plays }: { plays: RecentPlay[] }) {
  if (!plays.length) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--text)' }}>
        Play-by-play will appear here once the game starts.
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
      {plays.map(p => {
        const meta = TYPE_META[p.type];
        return (
          <div key={p.eventId} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="font-mono text-xs w-14 flex-shrink-0" style={{ color: 'var(--text)', opacity: 0.6 }}>
              P{p.period} {p.timeInPeriod}
            </span>
            {p.teamAbbrev && (
              <span className="text-xs font-bold w-9 flex-shrink-0" style={{ color: 'var(--text-bright)' }}>{p.teamAbbrev}</span>
            )}
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: `color-mix(in srgb, ${meta.color} 18%, transparent)`, color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="truncate" style={{ color: 'var(--text-bright)' }}>{p.description}</span>
          </div>
        );
      })}
    </div>
  );
}
