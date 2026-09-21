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

  return (
    <div
      className="rounded-xl border mb-4 overflow-hidden"
      style={{
        borderColor: isLive ? 'var(--heat)' : 'var(--border)',
        background: isLive
          ? `linear-gradient(135deg, var(--cold-glow) 0%, var(--bg-card) 50%, var(--heat-glow) 100%)`
          : isFinal
          ? `linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card) 60%, rgba(255,90,36,0.08) 100%)`
          : 'var(--bg-card)',
      }}
    >
      {/* ── Eyebrow / status strip ──────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 pb-2 flex items-center gap-3">
        {isLive && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: 'var(--heat)', boxShadow: '0 0 10px var(--heat)' }}
          />
        )}
        <span
          className="text-xs font-mono font-bold tracking-widest uppercase"
          style={{ color: isLive ? 'var(--heat)' : isFinal ? 'var(--text)' : 'var(--text)', letterSpacing: '0.1em' }}
        >
          {isLive
            ? `LIVE${clock ? ` · ${clock}` : ''}`
            : isFinal
            ? `FINAL · ${dateLabel}`
            : dateLabel}
        </span>
        {seriesLabel && (
          <span className="text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.55 }}>
            · {seriesLabel}
          </span>
        )}
        {isFinal && pickResult && (
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
            style={{
              background: pickResult === 'hit' ? 'rgba(0,229,160,0.15)' : 'rgba(239,68,68,0.15)',
              color: pickResult === 'hit' ? 'var(--rise)' : 'var(--red)',
              border: `1px solid ${pickResult === 'hit' ? 'rgba(0,229,160,0.35)' : 'rgba(239,68,68,0.35)'}`,
            }}
          >
            {pickResult === 'hit' ? '✓ OUR PICK HIT' : '✗ OUR PICK MISSED'}
          </span>
        )}
        <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* ── Main matchup row ────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 flex items-center gap-4 sm:gap-6">

        {/* Away side */}
        <Link
          href={teamUrl(away.id, away.name)}
          className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 hover:opacity-80 group"
        >
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: favoredIsHome === false ? 'var(--heat-glow)' : 'var(--bg)',
              border: `1px solid ${favoredIsHome === false ? 'var(--heat)' : 'var(--border)'}`,
            }}
          >
            <img src={away.logo} alt={away.abbrev} className="w-8 h-8 sm:w-11 sm:h-11 object-contain" />
          </div>
          <div className="min-w-0">
            <div
              className="font-sans font-extrabold leading-none tracking-tight"
              style={{
                fontSize: isLive ? 'clamp(20px, 4vw, 32px)' : isFinal ? 'clamp(22px, 4.5vw, 40px)' : 'clamp(24px, 5vw, 48px)',
                color: favoredIsHome === false ? 'var(--heat)' : 'var(--text-bright)',
                letterSpacing: '-0.03em',
              }}
            >
              {away.abbrev}
            </div>
            <div className="text-xs sm:text-sm font-medium mt-1 truncate" style={{ color: 'var(--text)', opacity: 0.65 }}>
              {away.name}
            </div>
          </div>
        </Link>

        {/* Center: score or vs */}
        <div className="flex-shrink-0 text-center flex items-center gap-2 sm:gap-3">
          {(isLive || isFinal) && away.score !== null && home.score !== null ? (
            <>
              <span
                className="font-sans font-extrabold leading-none"
                style={{
                  fontSize: isLive ? 'clamp(48px, 8vw, 80px)' : 'clamp(52px, 9vw, 96px)',
                  color: favoredIsHome === false ? 'var(--heat)' : 'var(--text-bright)',
                  letterSpacing: '-0.05em',
                }}
              >
                {away.score}
              </span>
              <span
                className="font-mono font-bold"
                style={{ fontSize: 'clamp(18px, 3vw, 28px)', color: 'var(--border)' }}
              >
                —
              </span>
              <span
                className="font-sans font-extrabold leading-none"
                style={{
                  fontSize: isLive ? 'clamp(48px, 8vw, 80px)' : 'clamp(52px, 9vw, 96px)',
                  color: favoredIsHome === true ? 'var(--heat)' : 'var(--text-bright)',
                  letterSpacing: '-0.05em',
                }}
              >
                {home.score}
              </span>
            </>
          ) : (
            <span
              className="font-mono font-bold"
              style={{ fontSize: 'clamp(18px, 3vw, 26px)', color: 'var(--text)', opacity: 0.5 }}
            >
              vs
            </span>
          )}
        </div>

        {/* Home side */}
        <Link
          href={teamUrl(home.id, home.name)}
          className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 hover:opacity-80 justify-end group"
        >
          <div className="min-w-0 text-right">
            <div
              className="font-sans font-extrabold leading-none tracking-tight"
              style={{
                fontSize: isLive ? 'clamp(20px, 4vw, 32px)' : isFinal ? 'clamp(22px, 4.5vw, 40px)' : 'clamp(24px, 5vw, 48px)',
                color: favoredIsHome === true ? 'var(--heat)' : 'var(--text-bright)',
                letterSpacing: '-0.03em',
              }}
            >
              {home.abbrev}
            </div>
            <div className="text-xs sm:text-sm font-medium mt-1 truncate text-right" style={{ color: 'var(--text)', opacity: 0.65 }}>
              {home.name}
            </div>
          </div>
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: favoredIsHome === true ? 'var(--heat-glow)' : 'var(--bg)',
              border: `1px solid ${favoredIsHome === true ? 'var(--heat)' : 'var(--border)'}`,
            }}
          >
            <img src={home.logo} alt={home.abbrev} className="w-8 h-8 sm:w-11 sm:h-11 object-contain" />
          </div>
        </Link>
      </div>

      {/* ── Storyline (FINAL only) ────────────────────────────────────── */}
      {isFinal && storyline && (
        <div
          className="px-4 sm:px-6 pb-4 text-sm font-sans leading-relaxed"
          style={{ color: 'var(--text)' }}
        >
          <span className="font-semibold" style={{ color: 'var(--heat)' }}>The story: </span>
          {storyline}
        </div>
      )}

      {/* ── Period breakdown (LIVE / FINAL) ──────────────────────────── */}
      {periodScores && periodScores.length > 0 && (isLive || isFinal) && (
        <div className="flex gap-2 px-4 sm:px-6 pb-4">
          {periodScores.map(p => (
            <div
              key={p.period}
              className="flex-1 text-center rounded-lg py-2 text-xs font-mono"
              style={{
                background: p.isCurrent ? 'var(--heat-glow)' : 'var(--bg)',
                border: `1px solid ${p.isCurrent ? 'var(--heat)' : 'var(--border)'}`,
                color: p.played || p.isCurrent ? 'var(--text-bright)' : 'var(--text)',
                opacity: p.played || p.isCurrent ? 1 : 0.4,
              }}
            >
              <div className="opacity-60 text-[10px] font-bold tracking-wider uppercase">{p.label}</div>
              <div className="font-bold mt-0.5">
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
