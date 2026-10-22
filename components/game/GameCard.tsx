import Link from 'next/link';
import { Headshot, TeamChip } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import { gameView } from '@/lib/game-state';
import { lastName, type CardPlayer, type CardSide, type GameCardData } from '@/lib/game-card';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

const timeET = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET' : 'TBD';

// 1. Status: time before the game, LIVE / FINAL after — small, it frames the card.
// The game of the night carries its badge here.
function Status({ g }: { g: GameCardData }) {
  const view = gameView(g.state);
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2 text-[10px] font-bold" style={{ ...MONO, letterSpacing: 0.8 }}>
      <span style={{ color: view === 'live' ? 'var(--heat)' : 'var(--text-muted)' }}>
        {view === 'live' ? '● LIVE' : view === 'final' ? 'FINAL' : timeET(g.startTimeUTC)}
      </span>
      {g.marquee && <span className="rounded-full px-2 py-0.5" style={{ color: 'var(--gold)', background: 'rgba(255, 181, 71, 0.12)' }}>★ GAME OF THE NIGHT</span>}
    </div>
  );
}

// 2. The result and the teams — the biggest thing on the card.
function TeamHead({ s, g, other }: { s: CardSide; g: GameCardData; other: CardSide }) {
  const view = gameView(g.state);
  const scored = view !== 'upcoming' && s.score != null && other.score != null;
  const won = scored && s.score! > other.score!;
  const lit = !scored || won;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TeamChip abbrev={s.abbrev} size={34} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] lg:text-base" style={{ fontWeight: lit ? 800 : 600, color: lit ? 'var(--text-bright)' : 'var(--text-muted)' }}>{s.name}</span>
        {s.teamHeat != null && (
          <span className="text-[10px] font-bold" style={{ ...MONO, letterSpacing: 0.8, color: heatColor(s.teamHeat) }} title="Team Heat: average of its five hottest skaters">HEAT {s.teamHeat}</span>
        )}
      </span>
      {scored && <span className="text-[28px] font-extrabold leading-none" style={{ ...MONO, color: lit ? 'var(--text-bright)' : 'var(--text-muted)' }}>{s.score}</span>}
    </div>
  );
}

// 3. Our prediction — one quiet line. Before/during: the split bar; after: hit or miss.
function Prediction({ g }: { g: GameCardData }) {
  const view = gameView(g.state);
  if (!g.pick) return null;
  if (view === 'final') {
    if (!g.pickResult) return null;
    const hit = g.pickResult === 'hit';
    return (
      <div className="mt-3 text-[10px] font-bold" style={{ ...MONO, letterSpacing: 0.8, color: hit ? 'var(--rise)' : 'var(--cold)' }}>
        {hit ? '✓ PICK HIT' : '✗ PICK MISS'} <span style={{ color: 'var(--text-muted)' }}>· {g.pick.abbrev} {g.pick.pct}%</span>
      </div>
    );
  }
  const a = g.away, h = g.home;
  if (a.pct == null || h.pct == null) return null;
  const pickAway = g.pick.abbrev === a.abbrev;
  const label = (side: CardSide, picked: boolean) => (
    <span className="shrink-0 text-[10px] font-bold" style={{ ...MONO, color: picked ? 'var(--heat)' : 'var(--text-muted)' }}>{side.abbrev} {side.pct}%</span>
  );
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="shrink-0 text-[9px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.8 }}>PICK</span>
      {label(a, pickAway)}
      <span className="flex h-[3px] flex-1 overflow-hidden rounded-sm">
        <span style={{ flex: a.pct, background: pickAway ? 'var(--heat)' : 'var(--border-soft)' }} />
        <span style={{ flex: h.pct, background: pickAway ? 'var(--border-soft)' : 'var(--heat)' }} />
      </span>
      {label(h, !pickAway)}
    </div>
  );
}

// Key-player rows: photo, last name, what they did (or why to watch), Heat.
// Shared by the game cards and the game page. `link` makes each row a player
// link (not inside a card, which is itself one link).
export function PlayerRows({ team, players, link = false }: { team: string; players: CardPlayer[]; link?: boolean }) {
  if (!players.length) return <p className="py-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>Lineup pending</p>;
  return (
    <ul className="flex flex-col gap-1">
      {players.map(p => {
        const row = (
          <>
            <Headshot src={p.photo} name={p.name} team={team} size={20} />
            <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
              <span className="truncate text-[12px] font-medium" style={{ color: 'var(--text)' }}>{lastName(p.name)}</span>
              {p.stat && <span className="shrink-0 text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{p.stat}</span>}
            </span>
            {p.heat != null && <span className="text-[11px] font-bold" style={{ ...MONO, color: heatColor(p.heat) }}>{p.heat}</span>}
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
  return (
    <article
      className="overflow-hidden rounded-xl border"
      style={{
        background: 'var(--bg-card)',
        borderColor: g.marquee ? 'rgba(255, 90, 36, 0.45)' : 'var(--border)',
        boxShadow: g.marquee ? '0 0 32px rgba(255, 90, 36, 0.12)' : undefined,
      }}
    >
      <Link href={g.href} className="block px-4 pb-3.5 pt-3 transition-colors hover:bg-[var(--bg-hover)]">
        <Status g={g} />
        <div className="grid grid-cols-2 gap-x-4">
          <TeamHead s={g.away} g={g} other={g.home} />
          <TeamHead s={g.home} g={g} other={g.away} />
        </div>
        <Prediction g={g} />
        <div className="mt-3 grid grid-cols-2 gap-x-4 border-t pt-2.5" style={{ borderColor: 'var(--border-soft)' }}>
          <PlayerRows team={g.away.abbrev} players={g.away.players} />
          <PlayerRows team={g.home.abbrev} players={g.home.players} />
        </div>
      </Link>
      {g.recapHref && (
        <div className="flex items-center justify-end border-t px-4 py-2 text-[10px] font-bold" style={{ ...MONO, borderColor: 'var(--border-soft)', letterSpacing: 0.8 }}>
          <Link href={g.recapHref} style={{ color: 'var(--heat)' }}>RECAP →</Link>
        </div>
      )}
    </article>
  );
}
