import { TeamChip } from '@/components/ds';
import { teamColor } from '@/lib/team-colors';
import type { GameView } from '@/lib/game-state';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const DISPLAY = { fontFamily: 'var(--font-fraunces), Georgia, serif' } as const;

type Side = { abbrev: string; name: string; score: number | null };

const nickname = (full: string) => {
  // "New York Rangers" → "Rangers", "Toronto Maple Leafs" → "Maple Leafs"
  const w = full.split(' ');
  return /^(Maple|Red|Blue|Golden)$/.test(w[w.length - 2] ?? '') ? w.slice(-2).join(' ') : w[w.length - 1] ?? full;
};

function Team({ s, align, won, picked, showScore }: { s: Side; align: 'left' | 'right'; won: boolean; picked: boolean; showScore: boolean }) {
  const color = showScore ? (won ? 'var(--text-bright)' : 'var(--text)') : picked ? 'var(--text-bright)' : 'var(--text)';
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 lg:gap-[18px] ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="lg:hidden"><TeamChip abbrev={s.abbrev} size={48} ringed={!showScore && picked} /></span>
      <span className="hidden lg:inline-flex"><TeamChip abbrev={s.abbrev} size={96} ringed={!showScore && picked} /></span>
      <div className="min-w-0">
        <div className="truncate font-extrabold leading-none" style={{ fontSize: 'clamp(22px, 4vw, 56px)', letterSpacing: '-0.032em', color }}>
          {nickname(s.name)}
        </div>
        <div className="mt-1.5 truncate text-[11px] lg:mt-2 lg:text-[13px]" style={{ color: 'var(--text)' }}>{teamColor(s.abbrev).name}</div>
      </div>
    </div>
  );
}

// Game hero (design DesktopGameUpcoming / Live / Final hero), regular season:
// split team gradients, eyebrow, big matchup, one-line story. Full-bleed.
export function GameHero({
  view, away, home, eyebrow, venue, storyline, pickSide, liveLabel,
}: {
  view: GameView;
  away: Side;
  home: Side;
  eyebrow: string;
  venue?: string | null;
  storyline: string | null;
  pickSide: 'home' | 'away' | null;
  liveLabel?: string | null;
}) {
  const showScore = view !== 'upcoming' && away.score != null && home.score != null;
  const awayWon = showScore && away.score! > home.score!;
  const homeWon = showScore && home.score! > away.score!;
  return (
    <section className="relative -mx-4 -mt-4 mb-8 overflow-hidden border-b lg:-mx-12 lg:-mt-8" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="absolute inset-0 flex">
        <div className="flex-1" style={{ background: `linear-gradient(120deg, ${teamColor(away.abbrev).bg} 0%, var(--bg) 80%)` }} />
        <div className="flex-1" style={{ background: `linear-gradient(240deg, ${teamColor(home.abbrev).bg} 0%, var(--bg) 80%)` }} />
      </div>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255, 90, 36, 0.18) 0%, transparent 60%)' }} />

      <div className="relative px-4 pb-6 pt-5 lg:px-12 lg:pb-10 lg:pt-8">
        <div className="mb-4 flex items-center gap-3.5 lg:mb-[22px]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: view === 'live' ? 'var(--heat)' : 'var(--text-muted)', boxShadow: view === 'live' ? '0 0 10px var(--heat)' : undefined }} />
          <span className="text-[10px] font-bold lg:text-[11px]" style={{ ...MONO, color: view === 'live' ? 'var(--heat)' : 'var(--text-bright)', letterSpacing: 1.4 }}>{eyebrow}</span>
          <span className="h-px flex-1" style={{ background: 'var(--border-soft)' }} />
          {venue && <span className="hidden text-[11px] lg:inline" style={{ ...MONO, color: 'var(--text-muted)' }}>{venue}</span>}
        </div>

        <h1 className="mb-4 flex items-center gap-4 lg:mb-[18px] lg:gap-8">
          <Team s={away} align="left" won={awayWon} picked={pickSide === 'away'} showScore={showScore} />
          <span className="flex shrink-0 flex-col items-center gap-1.5">
            {showScore ? (
              <span className="flex items-baseline gap-2 font-extrabold lg:gap-4" style={{ ...MONO, fontSize: 'clamp(28px, 5vw, 64px)', letterSpacing: -1.5 }}>
                <span style={{ color: awayWon ? 'var(--text-bright)' : 'var(--text-muted)' }}>{away.score}</span>
                <span className="text-[0.5em]" style={{ color: 'var(--text-muted)' }}>–</span>
                <span style={{ color: homeWon ? 'var(--text-bright)' : 'var(--text-muted)' }}>{home.score}</span>
              </span>
            ) : (
              <span className="font-normal italic" style={{ ...DISPLAY, fontSize: 'clamp(24px, 3vw, 38px)', color: 'var(--text-muted)' }}>at</span>
            )}
            <span className="text-[10px] font-bold" style={{ ...MONO, color: view === 'live' ? 'var(--heat)' : 'var(--text-muted)', letterSpacing: 1.2 }}>
              {view === 'final' ? 'FINAL' : view === 'live' ? liveLabel ?? 'LIVE' : ''}
            </span>
          </span>
          <Team s={home} align="right" won={homeWon} picked={pickSide === 'home'} showScore={showScore} />
        </h1>

        {storyline && (
          <p className="max-w-[800px] text-base font-bold leading-snug lg:text-[22px]" style={{ color: 'var(--text-bright)', letterSpacing: -0.5, textWrap: 'pretty' }}>
            <span style={{ color: 'var(--heat)' }}>The story:</span> {storyline}
          </p>
        )}
      </div>
    </section>
  );
}
