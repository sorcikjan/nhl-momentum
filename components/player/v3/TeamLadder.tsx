// His role: every forward (or defenseman) of his team by ice time a game,
// him in orange with his place and time on the bar.
import type { Ladder } from '@/lib/profile-v3';
import { ordinal } from '@/lib/profile-context';

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

export function TeamLadder({ bars, myRank, max, min, teamName }: Ladder & { teamName: string }) {
  if (!bars.length) return <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Ice time not available</div>;
  return (
    <div>
      <div className="mt-[18px] flex h-[58px] items-end gap-[3px]" role="img" aria-label={myRank ? `${ordinal(myRank)} of ${bars.length} ${teamName} by ice time` : `${teamName} by ice time`}>
        {bars.map(b => (
          <i key={b.id} className="relative block flex-1 rounded-t-sm" style={{ height: `${Math.round((b.toiPerGame / max) * 100)}%`, background: b.me ? 'var(--heat)' : 'var(--border)' }}>
            {b.me && myRank && (
              <em className="absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-extrabold not-italic" style={{ color: '#ff8a4c' }}>
                {ordinal(myRank)} · {mmss(b.toiPerGame)}
              </em>
            )}
          </i>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'var(--text-muted)' }}>
        <span>most · {mmss(max)}</span><span>{bars.length} {teamName}</span><span>fewest · {mmss(min)}</span>
      </div>
    </div>
  );
}
