import Link from 'next/link';
import { AvatarStack, Headshot, HeatPill, SectionHeading, TeamChip } from '@/components/ds';
import { gameView } from '@/lib/game-state';
import type { SlateGame } from '@/lib/home';
import { dayLabel, MONO, timeET } from './format';

// Start time before the game; live / final state with the score once it starts.
function Status({ g }: { g: SlateGame }) {
  const view = gameView(g.state);
  const scored = view !== 'upcoming' && g.awayScore != null && g.homeScore != null;
  if (view === 'upcoming' || !scored) {
    return <span className="text-[10px] font-semibold lg:text-[13px]" style={{ ...MONO, color: view === 'live' ? 'var(--heat)' : 'var(--text-bright)' }}>{view === 'live' ? '● LIVE' : view === 'final' ? 'FINAL' : timeET(g.startTimeUTC)}</span>;
  }
  return (
    <span className="text-[10px] font-bold lg:text-[13px]" style={{ ...MONO, color: view === 'live' ? 'var(--heat)' : 'var(--text)' }}>
      {view === 'live' ? '● LIVE' : 'FINAL'} · <span style={{ color: 'var(--text-bright)' }}>{g.awayScore}–{g.homeScore}</span>
    </span>
  );
}

function PickBar({ g }: { g: SlateGame }) {
  if (g.pickSide == null || g.pickPct == null) {
    return <span className="text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>Pick pending</span>;
  }
  const pick = g.pickSide === 'home' ? g.home.abbrev : g.away.abbrev;
  const other = g.pickSide === 'home' ? g.away.abbrev : g.home.abbrev;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] font-bold" style={MONO}>
        <span style={{ color: 'var(--heat)' }}>{pick} {g.pickPct}%</span>
        <span style={{ color: 'var(--text-muted)' }}>{other} {100 - g.pickPct}%</span>
      </div>
      <div className="flex h-1 overflow-hidden rounded-sm">
        <div style={{ flex: g.pickPct, background: 'var(--heat)' }} />
        <div style={{ flex: 100 - g.pickPct, background: 'var(--border-soft)' }} />
      </div>
    </div>
  );
}

// Tonight's games with our pick (design TonightSlate; mobile cards per MobileHomeFinal).
export function TonightSlate({ games, nextGameDate }: { games: SlateGame[]; nextGameDate: string | null }) {
  return (
    <section data-section="tonight">
      <SectionHeading
        kicker={games.length ? `TONIGHT · ${games.length} GAME${games.length === 1 ? '' : 'S'}` : 'TONIGHT'}
        title={games.length ? "What's on tonight." : 'No games tonight.'}
        size="feature"
        right={<Link href="/games" className="text-[11px] font-semibold" style={{ ...MONO, color: 'var(--heat)' }}>FULL SCHEDULE →</Link>}
      />
      {games.length === 0 ? (
        <div className="rounded-xl border px-5 py-4 text-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          {nextGameDate ? <>Next games: <Link href="/games?range=week" className="font-semibold" style={{ color: 'var(--text-bright)' }}>{dayLabel(nextGameDate)}</Link></> : 'No games scheduled this week.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {games.map((g, i) => (
            <Link
              key={g.id}
              href={g.href}
              className="grid grid-cols-1 items-center gap-x-4 gap-y-2 px-3 py-3 transition-colors hover:bg-[var(--bg-hover)] lg:grid-cols-[96px_1fr_240px_200px_24px] lg:px-6 lg:py-[18px]"
              style={{ borderTop: i ? '1px solid var(--border-soft)' : undefined }}
            >
              <Status g={g} />
              <div className="flex min-w-0 items-center gap-2.5">
                <TeamChip abbrev={g.away.abbrev} size={32} ringed={g.pickSide === 'away'} />
                <span className="truncate text-[13px] font-bold lg:text-[15px]" style={{ color: 'var(--text-bright)' }}>{g.away.name}</span>
                <span className="mx-1 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>at</span>
                <TeamChip abbrev={g.home.abbrev} size={32} ringed={g.pickSide === 'home'} />
                <span className="truncate text-[13px] font-bold lg:text-[15px]" style={{ color: 'var(--text-bright)' }}>{g.home.name}</span>
              </div>
              <PickBar g={g} />
              <div className="hidden lg:block">
                {(g.keyAway?.length || g.keyHome?.length) ? (
                  <div className="mb-1.5 flex items-center gap-3">
                    <AvatarStack team={g.away.abbrev} players={g.keyAway ?? []} />
                    <AvatarStack team={g.home.abbrev} players={g.keyHome ?? []} />
                  </div>
                ) : null}
                {g.watch && (
                  <>
                    <div className="mb-0.5 text-[10px] font-semibold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.5 }}>WATCH FOR</div>
                    <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--text-bright)' }}>
                      <Headshot src={g.watch.photo} name={g.watch.name} team={g.watch.team} size={24} />
                      <span className="truncate">{g.watch.name}</span>
                      <HeatPill heat={g.watch.heat} size="sm" />
                    </div>
                  </>
                )}
              </div>
              <span className="hidden text-lg lg:block" style={{ color: 'var(--text-muted)' }}>›</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
