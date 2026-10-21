import Link from 'next/link';
import { Headshot, HeatPill, TeamChip } from '@/components/ds';
import { gameView } from '@/lib/game-state';
import { lastName, type CardPlayer, type CardSide, type GameCardData } from '@/lib/game-card';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

const timeET = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET' : 'TBD';

function Header({ g }: { g: GameCardData }) {
  const view = gameView(g.state);
  const status = view === 'live' ? '● LIVE' : view === 'final' ? 'FINAL' : timeET(g.startTimeUTC);
  const pick = view === 'final' && g.pickResult
    ? { text: `${g.pickResult === 'hit' ? '✓ PICK HIT' : '✗ PICK MISS'}${g.pick ? ` · ${g.pick.abbrev} ${g.pick.pct}%` : ''}`, color: g.pickResult === 'hit' ? 'var(--rise)' : 'var(--cold)' }
    : g.pick ? { text: `OUR PICK · ${g.pick.abbrev} ${g.pick.pct}%`, color: 'var(--heat)' } : null;
  return (
    <div className="mb-3 flex items-center justify-between gap-2 text-[10px] font-bold" style={{ ...MONO, letterSpacing: 0.8 }}>
      <span style={{ color: view === 'live' ? 'var(--heat)' : 'var(--text-bright)' }}>{status}</span>
      {pick && <span className="truncate" style={{ color: pick.color }}>{pick.text}</span>}
    </div>
  );
}

function TeamHead({ s, g, other }: { s: CardSide; g: GameCardData; other: CardSide }) {
  const view = gameView(g.state);
  const scored = view !== 'upcoming' && s.score != null && other.score != null;
  const won = scored && s.score! > other.score!;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamChip abbrev={s.abbrev} size={26} ringed={view === 'upcoming' && g.pick?.abbrev === s.abbrev} />
      <span className="min-w-0 flex-1 truncate text-[13px] lg:text-sm" style={{ fontWeight: !scored || won ? 700 : 500, color: !scored || won ? 'var(--text-bright)' : 'var(--text)' }}>{s.name}</span>
      {scored ? (
        <span className="text-xl font-extrabold" style={{ ...MONO, color: won ? 'var(--text-bright)' : 'var(--text-muted)' }}>{s.score}</span>
      ) : s.pct != null ? (
        <span className="text-[11px] font-bold" style={{ ...MONO, color: g.pick?.abbrev === s.abbrev ? 'var(--heat)' : 'var(--text-muted)' }}>{s.pct}%</span>
      ) : null}
    </div>
  );
}

// Key-player rows: photo, last name, what they did (or why to watch), Heat.
// Shared by the game cards and the game page. `link` makes each row a player
// link (not inside a card, which is itself one link).
export function PlayerRows({ team, players, link = false }: { team: string; players: CardPlayer[]; link?: boolean }) {
  if (!players.length) return <p className="py-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>Lineup pending</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {players.map(p => {
        const row = (
          <>
            <Headshot src={p.photo} name={p.name} team={team} size={24} />
            <span className="min-w-0 flex-1 lg:flex lg:items-baseline lg:gap-1.5">
              <span className="block truncate text-[12px] font-semibold lg:text-[13px]" style={{ color: 'var(--text-bright)' }}>{lastName(p.name)}</span>
              {p.stat && <span className="block truncate text-[10px]" style={{ ...MONO, color: p.stat === 'DNP' || p.stat === '–' ? 'var(--text-muted)' : 'var(--text)' }}>{p.stat}</span>}
            </span>
            {p.heat != null && <HeatPill heat={p.heat} size="sm" />}
          </>
        );
        return (
          <li key={p.playerId} data-card-player title={p.name}>
            {link
              ? <Link href={p.href} className="flex min-w-0 items-center gap-2 rounded-md hover:bg-[var(--bg-hover)]">{row}</Link>
              : <span className="flex min-w-0 items-center gap-2">{row}</span>}
          </li>
        );
      })}
    </ul>
  );
}

// One game, any state: status + pick, both teams, then each team's three
// highest-Heat players directly under it. Same layout everywhere.
export function GameCard({ g }: { g: GameCardData }) {
  const view = gameView(g.state);
  const footer = g.watchability != null || g.recapHref || g.marquee;
  return (
    <article
      className="overflow-hidden rounded-xl border"
      style={{ background: 'var(--bg-card)', borderColor: g.marquee ? 'rgba(255, 90, 36, 0.45)' : 'var(--border)' }}
    >
      <Link href={g.href} className="block px-4 pb-3.5 pt-3 transition-colors hover:bg-[var(--bg-hover)]">
        <Header g={g} />
        <div className="grid grid-cols-2 gap-x-4">
          <TeamHead s={g.away} g={g} other={g.home} />
          <TeamHead s={g.home} g={g} other={g.away} />
        </div>
        {view === 'upcoming' && g.away.pct != null && g.home.pct != null && (
          <div className="mt-2.5 flex h-1 overflow-hidden rounded-sm">
            <div style={{ flex: g.away.pct, background: g.pick?.abbrev === g.away.abbrev ? 'var(--heat)' : 'var(--border-soft)' }} />
            <div style={{ flex: g.home.pct, background: g.pick?.abbrev === g.home.abbrev ? 'var(--heat)' : 'var(--border-soft)' }} />
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-x-4 border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
          <PlayerRows team={g.away.abbrev} players={g.away.players} />
          <PlayerRows team={g.home.abbrev} players={g.home.players} />
        </div>
      </Link>
      {footer && (
        <div className="flex items-center justify-between gap-2 border-t px-4 py-2 text-[10px] font-bold" style={{ ...MONO, borderColor: 'var(--border-soft)', letterSpacing: 0.8 }}>
          <span style={{ color: 'var(--gold)' }}>{g.watchability != null ? `WATCHABILITY ${g.watchability}/100` : ''}</span>
          {g.recapHref ? <Link href={g.recapHref} style={{ color: 'var(--heat)' }}>RECAP →</Link>
            : g.marquee ? <span style={{ color: 'var(--gold)' }}>★ GAME OF THE NIGHT</span> : null}
        </div>
      )}
    </article>
  );
}
