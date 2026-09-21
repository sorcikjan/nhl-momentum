import Link from 'next/link';
import { teamUrl } from '@/lib/urls';

interface TeamSide {
  id: number;
  abbrev: string;
  name: string;
  logo: string;
  score: number | null;
}

export interface PeriodScore {
  period: number;
  label: string;
  away: number;
  home: number;
  played: boolean;
  isCurrent: boolean;
}

export default function GameHero({
  state,
  away,
  home,
  periodScores,
  clock,
  dateLabel,
  seriesLabel,
  pickResult,
  storyline,
  favoredIsHome,
}: {
  state: 'LIVE' | 'FINAL' | 'UPCOMING';
  away: TeamSide;
  home: TeamSide;
  periodScores?: PeriodScore[];
  clock?: string | null;
  dateLabel: string;
  seriesLabel?: string | null;
  pickResult?: 'hit' | 'miss' | null;
  storyline?: string | null;
  favoredIsHome?: boolean | null;
}) {
  const isLive = state === 'LIVE';
  const isFinal = state === 'FINAL';
  const glowColor = favoredIsHome === null || favoredIsHome === undefined
    ? 'transparent'
    : favoredIsHome ? 'var(--heat-glow)' : 'var(--cold-glow)';

  return (
    <div
      className="rounded-xl border mb-4 overflow-hidden"
      style={{
        borderColor: isLive ? 'var(--heat)' : 'var(--border)',
        background: isLive
          ? `linear-gradient(120deg, var(--cold-glow), var(--bg-card) 45%, var(--heat-glow))`
          : isFinal
          ? `linear-gradient(120deg, var(--bg-card), ${glowColor})`
          : 'var(--bg-card)',
      }}
    >
      {/* Status strip */}
      <div className="px-4 sm:px-6 pt-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2" style={{ color: isLive ? 'var(--heat)' : 'var(--text)' }}>
          {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--heat)' }} />}
          <span className="font-semibold tracking-wide">
            {isLive ? `LIVE${clock ? ` · ${clock}` : ''}` : isFinal ? `FINAL · ${dateLabel}` : dateLabel}
          </span>
          {seriesLabel && <span style={{ color: 'var(--text)', opacity: 0.7 }}>· {seriesLabel}</span>}
          {isFinal && pickResult && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: pickResult === 'hit' ? 'rgba(0,229,160,0.15)' : 'rgba(239,68,68,0.15)',
                color: pickResult === 'hit' ? 'var(--rise)' : 'var(--red)',
              }}
            >
              {pickResult === 'hit' ? '✓ OUR PICK HIT' : '✗ OUR PICK MISSED'}
            </span>
          )}
        </div>
      </div>

      {/* Score row */}
      <div className="px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
        <Link href={teamUrl(away.id, away.name)} className="flex flex-col items-center gap-2 flex-1 min-w-0 hover:opacity-80">
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: favoredIsHome === false ? 'var(--heat-glow)' : 'var(--bg)', border: `1px solid ${favoredIsHome === false ? 'var(--heat)' : 'var(--border)'}` }}
          >
            <img src={away.logo} alt={away.abbrev} className="w-8 h-8 sm:w-11 sm:h-11 object-contain" />
          </div>
          <span className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--text-bright)' }}>{away.name}</span>
        </Link>

        <div className="text-center flex-shrink-0 px-2">
          {(isLive || isFinal) && away.score !== null && home.score !== null ? (
            <div className="flex items-center gap-3 sm:gap-4 font-editorial">
              <span className="text-4xl sm:text-6xl font-bold" style={{ color: favoredIsHome === false ? 'var(--heat)' : 'var(--text-bright)' }}>{away.score}</span>
              <span className="text-xl sm:text-3xl" style={{ color: 'var(--border)' }}>–</span>
              <span className="text-4xl sm:text-6xl font-bold" style={{ color: favoredIsHome ? 'var(--heat)' : 'var(--text-bright)' }}>{home.score}</span>
            </div>
          ) : (
            <span className="text-2xl sm:text-3xl font-bold font-editorial" style={{ color: 'var(--text)' }}>vs</span>
          )}
        </div>

        <Link href={teamUrl(home.id, home.name)} className="flex flex-col items-center gap-2 flex-1 min-w-0 hover:opacity-80">
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: favoredIsHome === true ? 'var(--heat-glow)' : 'var(--bg)', border: `1px solid ${favoredIsHome === true ? 'var(--heat)' : 'var(--border)'}` }}
          >
            <img src={home.logo} alt={home.abbrev} className="w-8 h-8 sm:w-11 sm:h-11 object-contain" />
          </div>
          <span className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--text-bright)' }}>{home.name}</span>
        </Link>
      </div>

      {/* Storyline (FINAL only) */}
      {isFinal && storyline && (
        <div className="px-4 sm:px-6 pb-4 text-sm leading-snug" style={{ color: 'var(--text)' }}>
          <span className="font-semibold" style={{ color: 'var(--heat)' }}>The story: </span>
          {storyline}
        </div>
      )}

      {/* Period breakdown */}
      {periodScores && periodScores.length > 0 && (isLive || isFinal) && (
        <div className="flex gap-2 px-4 sm:px-6 pb-4">
          {periodScores.map(p => (
            <div
              key={p.period}
              className="flex-1 text-center rounded-lg py-1.5 text-xs font-mono"
              style={{
                background: p.isCurrent ? 'var(--heat-glow)' : 'var(--bg)',
                border: `1px solid ${p.isCurrent ? 'var(--heat)' : 'var(--border)'}`,
                color: p.played || p.isCurrent ? 'var(--text-bright)' : 'var(--text)',
                opacity: p.played || p.isCurrent ? 1 : 0.4,
              }}
            >
              <div className="opacity-60">{p.label}</div>
              <div className="font-semibold">
                {p.played || p.isCurrent ? `${p.away}-${p.home}` : '–'}
                {p.isCurrent && isLive && <span style={{ color: 'var(--heat)' }}> ●</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
