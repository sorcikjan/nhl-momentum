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
  const isUpcoming = state === 'UPCOMING';

  return (
    <div
      className="border mb-4 overflow-hidden"
      style={{
        borderRadius: 16,
        borderColor: isLive ? 'var(--heat)' : 'var(--border)',
        position: 'relative',
      }}
    >
      {/* ── Team-color gradient bleed background ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
        <div style={{
          flex: 1,
          background: 'linear-gradient(120deg, rgba(255,90,36,0.13) 0%, var(--bg-card) 75%)',
        }} />
        <div style={{
          flex: 1,
          background: 'linear-gradient(240deg, rgba(100,120,200,0.10) 0%, var(--bg-card) 75%)',
        }} />
      </div>
      {isLive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 30%, rgba(255,90,36,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ position: 'relative', background: isLive ? 'transparent' : isFinal ? 'transparent' : 'transparent' }}>

        {/* ── Eyebrow / status strip ── */}
        <div
          className="flex items-center gap-3 flex-wrap"
          style={{ padding: '16px 20px 0', paddingBottom: 0 }}
        >
          {isLive && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
              style={{ background: 'var(--heat)', boxShadow: '0 0 10px var(--heat)' }}
            />
          )}
          <span
            className="text-[11px] font-mono font-bold tracking-widest uppercase"
            style={{
              color: isLive ? 'var(--heat)' : isFinal ? 'var(--text)' : 'var(--heat)',
              letterSpacing: '0.12em',
            }}
          >
            {isLive
              ? `LIVE${clock ? ` · ${clock}` : ''}`
              : isFinal
              ? `FINAL · ${dateLabel}`
              : dateLabel}
          </span>
          {seriesLabel && (
            <span className="text-[11px] font-mono" style={{ color: 'var(--text)', opacity: 0.55 }}>
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
          <span className="flex-1 h-px" style={{ background: 'var(--border)', minWidth: 16 }} />
        </div>

        {/* ── Main matchup row — MOBILE (< lg) ── */}
        <div
          className="flex items-center lg:hidden"
          style={{ padding: '14px 20px 0', gap: 8 }}
        >
          {/* Away side — mobile */}
          <Link
            href={teamUrl(away.id, away.name)}
            className="flex flex-col items-center flex-1 min-w-0 hover:opacity-80"
            style={{ gap: 6 }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 52, height: 52, borderRadius: 10,
                background: favoredIsHome === false ? 'var(--heat-glow)' : 'var(--bg)',
                border: `1px solid ${favoredIsHome === false ? 'var(--heat)' : 'var(--border)'}`,
              }}
            >
              <img src={away.logo} alt={away.abbrev} style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
            <div
              className="font-sans font-extrabold leading-none text-center"
              style={{ fontSize: 20, color: favoredIsHome === false ? 'var(--heat)' : 'var(--text-bright)', letterSpacing: '-0.03em' }}
            >
              {away.abbrev}
            </div>
            {isFinal && (
              <div className="font-mono font-bold text-center" style={{ fontSize: 9, color: favoredIsHome === false ? 'var(--heat)' : 'var(--text)', letterSpacing: '0.06em' }}>
                {(away.score ?? 0) > (home.score ?? 0) ? 'WON' : 'LOST'}
              </div>
            )}
          </Link>

          {/* Center: score or at — mobile */}
          <div className="flex-shrink-0 text-center flex flex-col items-center" style={{ minWidth: 80 }}>
            {(isLive || isFinal) && away.score !== null && home.score !== null ? (
              <div className="flex items-center" style={{ gap: 6 }}>
                <span
                  className="font-sans font-extrabold leading-none"
                  style={{ fontSize: 52, color: favoredIsHome === false ? 'var(--heat)' : 'var(--text-bright)', letterSpacing: '-0.05em' }}
                >
                  {away.score}
                </span>
                <span className="font-mono font-bold" style={{ fontSize: 16, color: 'var(--border)' }}>—</span>
                <span
                  className="font-sans font-extrabold leading-none"
                  style={{ fontSize: 52, color: favoredIsHome === true ? 'var(--heat)' : 'var(--text-bright)', letterSpacing: '-0.05em' }}
                >
                  {home.score}
                </span>
              </div>
            ) : (
              <span className="font-sans italic font-normal" style={{ fontSize: 28, color: 'var(--text)', opacity: 0.45 }}>at</span>
            )}
          </div>

          {/* Home side — mobile */}
          <Link
            href={teamUrl(home.id, home.name)}
            className="flex flex-col items-center flex-1 min-w-0 hover:opacity-80"
            style={{ gap: 6 }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 52, height: 52, borderRadius: 10,
                background: favoredIsHome === true ? 'var(--heat-glow)' : 'var(--bg)',
                border: `1px solid ${favoredIsHome === true ? 'var(--heat)' : 'var(--border)'}`,
              }}
            >
              <img src={home.logo} alt={home.abbrev} style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
            <div
              className="font-sans font-extrabold leading-none text-center"
              style={{ fontSize: 20, color: favoredIsHome === true ? 'var(--heat)' : 'var(--text-bright)', letterSpacing: '-0.03em' }}
            >
              {home.abbrev}
            </div>
            {isFinal && (
              <div className="font-mono font-bold text-center" style={{ fontSize: 9, color: favoredIsHome === true ? 'var(--heat)' : 'var(--text)', letterSpacing: '0.06em' }}>
                {(home.score ?? 0) > (away.score ?? 0) ? 'WON' : 'LOST'}
              </div>
            )}
          </Link>
        </div>

        {/* ── Main matchup row — DESKTOP (lg+) ── */}
        <div
          className="hidden lg:flex items-center"
          style={{ padding: '18px 24px 0', gap: 16 }}
        >

          {/* Away side */}
          <Link
            href={teamUrl(away.id, away.name)}
            className="flex items-center flex-1 min-w-0 hover:opacity-80"
            style={{ gap: 14 }}
          >
            {/* Logo */}
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: isFinal ? 80 : 72,
                height: isFinal ? 80 : 72,
                borderRadius: 14,
                background: favoredIsHome === false ? 'var(--heat-glow)' : 'var(--bg)',
                border: `1px solid ${favoredIsHome === false ? 'var(--heat)' : 'var(--border)'}`,
              }}
            >
              <img
                src={away.logo}
                alt={away.abbrev}
                style={{ width: isFinal ? 58 : 52, height: isFinal ? 58 : 52, objectFit: 'contain' }}
              />
            </div>
            {/* Name */}
            <div className="min-w-0">
              <div
                className="font-sans font-extrabold leading-none"
                style={{
                  fontSize: isLive ? 'clamp(22px, 3.5vw, 34px)' : isFinal ? 'clamp(28px, 4.2vw, 48px)' : 'clamp(28px, 5vw, 56px)',
                  color: favoredIsHome === false ? 'var(--heat)' : 'var(--text-bright)',
                  letterSpacing: '-0.04em',
                }}
              >
                {away.abbrev}
              </div>
              <div
                className="font-medium mt-1 truncate"
                style={{ fontSize: 12, color: 'var(--text)', opacity: 0.6 }}
              >
                {away.name}
              </div>
              {isFinal && (
                <div className="text-[10px] font-mono font-bold mt-1" style={{ color: favoredIsHome === false ? 'var(--heat)' : 'var(--text)', letterSpacing: '0.08em' }}>
                  {(away.score ?? 0) > (home.score ?? 0) ? 'WON · LEADS' : 'LOST · TRAILS'}
                </div>
              )}
            </div>
          </Link>

          {/* Center: score or at */}
          <div className="flex-shrink-0 text-center flex items-center" style={{ gap: 10 }}>
            {(isLive || isFinal) && away.score !== null && home.score !== null ? (
              <>
                <span
                  className="font-sans font-extrabold leading-none"
                  style={{
                    fontSize: isLive ? 'clamp(48px, 8vw, 80px)' : 'clamp(64px, 9vw, 120px)',
                    color: favoredIsHome === false ? 'var(--heat)' : 'var(--text-bright)',
                    letterSpacing: '-0.05em',
                  }}
                >
                  {away.score}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', color: 'var(--border)' }}
                >
                  —
                </span>
                <span
                  className="font-sans font-extrabold leading-none"
                  style={{
                    fontSize: isLive ? 'clamp(48px, 8vw, 80px)' : 'clamp(64px, 9vw, 120px)',
                    color: favoredIsHome === true ? 'var(--heat)' : 'var(--text-bright)',
                    letterSpacing: '-0.05em',
                  }}
                >
                  {home.score}
                </span>
              </>
            ) : (
              <span
                className="font-sans italic font-normal"
                style={{ fontSize: 'clamp(20px, 3vw, 38px)', color: 'var(--text)', opacity: 0.45, fontStyle: 'italic' }}
              >
                at
              </span>
            )}
          </div>

          {/* Home side */}
          <Link
            href={teamUrl(home.id, home.name)}
            className="flex items-center flex-1 min-w-0 hover:opacity-80 justify-end"
            style={{ gap: 14 }}
          >
            {/* Name (right-aligned) */}
            <div className="min-w-0 text-right">
              <div
                className="font-sans font-extrabold leading-none"
                style={{
                  fontSize: isLive ? 'clamp(22px, 3.5vw, 34px)' : isFinal ? 'clamp(28px, 4.2vw, 48px)' : 'clamp(28px, 5vw, 56px)',
                  color: favoredIsHome === true ? 'var(--heat)' : 'var(--text)',
                  letterSpacing: '-0.04em',
                }}
              >
                {home.abbrev}
              </div>
              <div
                className="font-medium mt-1 truncate text-right"
                style={{ fontSize: 12, color: 'var(--text)', opacity: 0.6 }}
              >
                {home.name}
              </div>
              {isFinal && (
                <div className="text-[10px] font-mono font-bold mt-1 text-right" style={{ color: favoredIsHome === true ? 'var(--heat)' : 'var(--text)', letterSpacing: '0.08em' }}>
                  {(home.score ?? 0) > (away.score ?? 0) ? 'WON · LEADS' : 'LOST · TRAILS'}
                </div>
              )}
            </div>
            {/* Logo */}
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: isFinal ? 80 : 72,
                height: isFinal ? 80 : 72,
                borderRadius: 14,
                background: favoredIsHome === true ? 'var(--heat-glow)' : 'var(--bg)',
                border: `1px solid ${favoredIsHome === true ? 'var(--heat)' : 'var(--border)'}`,
              }}
            >
              <img
                src={home.logo}
                alt={home.abbrev}
                style={{ width: isFinal ? 58 : 52, height: isFinal ? 58 : 52, objectFit: 'contain' }}
              />
            </div>
          </Link>
        </div>

        {/* ── Storyline (FINAL or UPCOMING with content) ── */}
        {storyline && (
          <div
            className="font-sans leading-snug"
            style={{
              padding: '14px 20px',
              fontSize: 'clamp(12px, 1.5vw, 17px)',
              fontWeight: 700,
              color: 'var(--text-bright)',
              letterSpacing: '-0.01em',
              maxWidth: 760,
            }}
          >
            <span className="hidden lg:inline" style={{ color: 'var(--heat)' }}>The story: </span>
            <span className="lg:hidden" style={{ color: 'var(--heat)' }}>Story: </span>
            {storyline}
          </div>
        )}

        {/* ── Period breakdown (LIVE / FINAL) ── */}
        {periodScores && periodScores.length > 0 && (isLive || isFinal) && (
          <div className="flex gap-1.5 lg:gap-2" style={{ padding: storyline ? '0 20px 16px' : '10px 20px 16px' }}>
            {periodScores.map(p => (
              <div
                key={p.period}
                className="flex-1 text-center rounded-lg py-1.5 lg:py-2 text-xs font-mono"
                style={{
                  background: p.isCurrent ? 'var(--heat-glow)' : 'var(--bg)',
                  border: `1px solid ${p.isCurrent ? 'var(--heat)' : 'var(--border)'}`,
                  color: p.played || p.isCurrent ? 'var(--text-bright)' : 'var(--text)',
                  opacity: p.played || p.isCurrent ? 1 : 0.4,
                }}
              >
                <div className="opacity-60 text-[9px] lg:text-[10px] font-bold tracking-wider uppercase">{p.label}</div>
                <div className="font-bold mt-0.5">
                  {p.played || p.isCurrent ? `${p.away}-${p.home}` : '–'}
                  {p.isCurrent && isLive && <span style={{ color: 'var(--heat)' }}> ●</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Bottom padding when no story/periods ── */}
        {!storyline && (!periodScores || !periodScores.length || (!isLive && !isFinal)) && (
          <div style={{ paddingBottom: 16 }} />
        )}
      </div>
    </div>
  );
}
