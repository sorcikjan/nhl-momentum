'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TeamChip } from '@/components/ds';
import { GoalButtons, GoalStrip } from '@/components/home/BestGoals';
import { Flag } from '@/components/nation/Flag';
import type { CheerNation, CheerTeam, FormNote } from '@/lib/cheer-data';
import { COLLAPSED_KEY, ENGLISH, NICKNAMES, openCheer, store, type CheerPick } from '@/lib/cheer';
import type { NightGame } from '@/lib/nation-data';
import { usePick, useStored } from './usePick';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const LINE = { borderColor: 'var(--border-soft)' } as const;
const MAX_ROWS = 6;

const Kicker = ({ children, heat = false }: { children: React.ReactNode; heat?: boolean }) =>
  <span className="text-[10px] font-bold" style={{ ...MONO, letterSpacing: 1.1, color: heat ? 'var(--heat)' : 'var(--text-muted)' }}>{children}</span>;

// The visitor's own clock, in the site's English.
const local = (utc: string) => utc.includes('T')
  ? new Date(utc).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
  : '';
const localDay = (utc: string) => new Date(utc).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

// The homepage's first section for a browser that picked a country or a team:
// last night in one sentence, then the detail — or one line, collapsed.
// Nothing at all without a pick: the header button is the only invitation.
export function CheerSection() {
  const pick = usePick();
  const collapsed = useStored(COLLAPSED_KEY) === '1';
  const q = pick ? (pick.kind === 'country' ? `country=${pick.code}` : `team=${pick.abbrev}`) : null;
  // The answer for the current pick only: a changed pick shows the skeleton, not the old team.
  const [answer, setAnswer] = useState<{ q: string; data: CheerNation | CheerTeam | null } | null>(null);

  useEffect(() => {
    if (!q) return;
    let live = true;
    fetch(`/api/cheer?${q}`).then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { if (live) setAnswer({ q, data: d }); }, () => { if (live) setAnswer({ q, data: null }); });
    return () => { live = false; };
  }, [q]);

  const data = answer?.q === q ? answer.data : null;
  const failed = answer?.q === q && answer.data == null;
  if (!pick || failed) return null;
  const toggle = () => store(COLLAPSED_KEY, collapsed ? null : '1');

  return (
    <section data-section="cheer" aria-label={`Your ${title(pick)}`} className="overflow-hidden rounded-2xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex flex-col gap-2 px-4 py-4 lg:px-6 lg:py-5" style={collapsed ? undefined : { borderBottom: '1px solid var(--border-soft)' }}>
        <div className="flex items-center gap-2.5">
          {pick.kind === 'country' ? <Flag code={pick.code} width={27} /> : <TeamChip abbrev={pick.abbrev} size={26} />}
          <span className="flex-1 text-[10px] font-bold" style={{ ...MONO, letterSpacing: 1, color: 'var(--heat)' }}>
            YOUR {title(pick).toUpperCase()}{data ? ` · ${kickerDate(data).toUpperCase()}` : ''}
          </span>
          <button type="button" onClick={openCheer} className="hidden h-9 px-2 text-xs sm:block" style={{ color: 'var(--text-muted)' }}>Change</button>
          <button type="button" onClick={toggle} aria-expanded={!collapsed} aria-label={collapsed ? 'Show the detail' : 'Collapse to one line'}
            className="-my-2 -mr-2 flex h-11 w-11 items-center justify-center rounded-lg" style={{ color: 'var(--text)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden
              style={{ transform: collapsed ? 'rotate(180deg)' : undefined }}><path d="M6 15l6-6 6 6" /></svg>
          </button>
        </div>
        {data
          ? <h2 className={`font-extrabold leading-tight ${collapsed ? 'text-base' : 'text-[21px] lg:text-[26px]'}`} style={{ color: 'var(--text-bright)' }}>{data.headline}</h2>
          : <span className="block h-7 w-3/4 animate-pulse rounded" style={{ background: 'var(--bg-raised)' }} />}
        {data && !collapsed && data.sub && <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text)' }}>{data.sub}</p>}
      </div>
      {data && !collapsed && (data.kind === 'nation' ? <NationDetail d={data} /> : <TeamDetail d={data} />)}
    </section>
  );
}

const title = (p: CheerPick) => p.kind === 'country' ? ENGLISH[p.code].people[1] : NICKNAMES[p.abbrev];
function kickerDate(d: CheerNation | CheerTeam): string {
  if (d.kind === 'team') return d.last?.label ?? '';
  return d.night ? 'last night' : '';
}

function FormList({ rows }: { rows: FormNote[] }) {
  if (!rows.length) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <Kicker>WHO&apos;S HOT · WHO&apos;S NOT</Kicker>
      {rows.map(r => (
        <Link key={r.href} href={r.href} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] hover:opacity-80">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={r.hot ? 'var(--heat)' : 'var(--cold, #7ba7ff)'} strokeWidth={2.5} aria-hidden>
            <path d={r.hot ? 'M5 15l7-7 7 7' : 'M5 9l7 7 7-7'} />
          </svg>
          <span className="flex-1 whitespace-nowrap" style={{ color: 'var(--text-bright)' }}><b>{r.name}</b> Heat {r.heat}</span>
          <span className="pl-5 text-[11px] font-semibold sm:pl-0" style={{ ...MONO, color: r.hot ? 'var(--heat)' : 'var(--cold, #9dbbff)' }}>{r.note}</span>
        </Link>
      ))}
    </div>
  );
}

function resultOf(g: NightGame, team: string) {
  const mine = g.away === team ? g.awayScore : g.homeScore, theirs = g.away === team ? g.homeScore : g.awayScore;
  return mine > theirs ? 'W' : 'L';
}

function NationDetail({ d }: { d: CheerNation }) {
  // Scorers first, then winning goalies, then the rest; the nation page has everyone.
  const weight = (p: NightGame['players'][number]) => p.points > 0 ? p.points + 1000 : p.points < 0 && p.line.startsWith('win') ? 500 : p.points;
  const all = (d.night?.games.flatMap(g => g.players.map(p => ({ g, p }))) ?? []).sort((a, b) => weight(b.p) - weight(a.p));
  const rows = all.slice(0, MAX_ROWS);
  const goalBeside = rows.length <= 3;
  const idle = d.night?.idle ?? [];
  return (
    <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-1 border-b px-4 py-4 lg:border-b-0 lg:border-r lg:px-6" style={LINE}>
        <Kicker>HOW EACH OF THEM DID</Kicker>
        {rows.length === 0 && <p className="py-2 text-sm" style={{ color: 'var(--text)' }}>None of them played last night.</p>}
        <ul className="flex flex-col">
          {rows.map(({ g, p }) => {
            const r = resultOf(g, p.team);
            const opp = p.team === g.away ? g.home : g.away;
            const score = `${p.team} ${p.team === g.away ? g.awayScore : g.homeScore}–${p.team === g.away ? g.homeScore : g.awayScore} ${p.team === g.away ? '@' : ''}${opp}`;
            const pts = p.points < 0 ? (p.line.startsWith('win') ? 'W' : '') : `${Math.floor(p.points / 10)}+${p.points % 10}`;
            return (
              <li key={p.href} className="flex items-center gap-2.5 border-b py-2 last:border-b-0" style={LINE}>
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold"
                  style={{ ...MONO, background: r === 'W' ? 'color-mix(in srgb, var(--heat) 14%, transparent)' : 'var(--bg-raised)', color: r === 'W' ? 'var(--heat)' : 'var(--text)' }}>{r}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm" style={{ color: 'var(--text-bright)' }}>
                    <Link href={p.href} className="font-bold hover:underline">{p.name}</Link>{' '}
                    <Link href={g.href} className="text-[11px] font-semibold hover:underline" style={{ ...MONO, color: 'var(--text-muted)' }}>{score}{g.suffix ? ` ${g.suffix}` : ''}</Link>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>
                    {p.line}<GoalButtons moments={p.goals} />
                  </span>
                </span>
                <span className="min-w-[34px] text-right text-[15px] font-extrabold" style={{ ...MONO, color: p.points > 0 || pts === 'W' ? 'var(--text-bright)' : 'var(--text-muted)' }}>{pts}</span>
              </li>
            );
          })}
        </ul>
        {all.length > rows.length && (
          <Link href={d.href} className="py-2 text-xs font-semibold hover:underline" style={{ color: 'var(--heat)' }}>
            +{all.length - rows.length} more {d.people} played →
          </Link>
        )}
        {(d.night?.scratched.length || idle.length) ? (
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {d.night!.scratched.length > 0 && <>Scratched: {d.night!.scratched.join(', ')}. </>}
            {idle.length > 0 && <>Team off: {idle.length > 6 ? `${idle.slice(0, 5).join(', ')} +${idle.length - 5}` : idle.join(', ')}.</>}
          </p>
        ) : null}
        {goalBeside && d.goal && <div className="mt-4"><GoalStrip moments={[d.goal]} cols={1} /></div>}
      </div>
      <div className="flex flex-col gap-6 px-4 py-4 lg:px-6">
        {!goalBeside && d.goal && <GoalStrip moments={[d.goal]} cols={1} />}
        {d.tonight && d.tonight.games.length > 0 && (
          <div className="flex flex-col gap-2">
            <Kicker>{d.tonight.label === 'tonight' ? 'TONIGHT' : d.tonight.label.toUpperCase()} · YOUR TIME</Kicker>
            {d.tonight.games.slice(0, 4).map(g => (
              <Link key={g.href} href={g.href} className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-[var(--bg-hover)]"
                style={{ borderColor: g.derby ? 'var(--heat)' : 'var(--border-soft)' }}>
                <span className="text-[10px] font-bold" style={{ ...MONO, color: g.derby ? 'var(--heat)' : 'var(--text-muted)' }}>
                  {g.derby ? `${ENGLISH[d.code].adj.toUpperCase()} DERBY · ` : ''}{g.time}
                </span>
                <span className="text-[13px]" style={{ color: 'var(--text-bright)' }}>
                  <b>{g.away} @ {g.home}</b> — {[...g.awayPlayers, ...g.homePlayers].slice(0, 4).join(', ')}
                </span>
              </Link>
            ))}
            {d.tonight.games.length > 4 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{d.tonight.games.length - 4} more games with {d.people}</span>}
          </div>
        )}
        <FormList rows={d.form} />
        <Link href={d.href} className="flex h-11 items-center justify-center rounded-[10px] border text-sm font-semibold hover:border-[var(--heat)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-bright)' }}>All {d.people} in the NHL →</Link>
      </div>
    </div>
  );
}

function TeamDetail({ d }: { d: CheerTeam }) {
  const l = d.last;
  return (
    <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 border-b px-4 py-4 lg:border-b-0 lg:border-r lg:px-6" style={LINE}>
        {l ? (
          <>
            <Link href={l.href} className="hover:underline"><Kicker>THE GAME · {l.away} {l.awayScore}–{l.homeScore} {l.home} · FINAL{l.suffix ? `/${l.suffix}` : ''}</Kicker></Link>
            <ul className="flex flex-col">
              {l.goals.map(m => (
                <li key={m.href} className="flex items-center gap-2.5 border-b py-2 last:border-b-0" style={LINE}>
                  <TeamChip abbrev={m.team} size={20} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-bold" style={{ color: m.team === d.abbrev ? 'var(--text-bright)' : 'var(--text)' }}>{m.scorer}</span>
                    <span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{m.kicker !== 'GOAL' ? `${m.kicker} · ` : ''}{m.score}</span>
                  </span>
                  <GoalButtons moments={[m]} />
                </li>
              ))}
            </ul>
            {l.stars.length > 0 && <p className="text-xs" style={{ color: 'var(--text)' }}><span style={{ color: 'var(--text-muted)' }}>Stars: </span>{l.stars.join(' · ')}</p>}
          </>
        ) : <p className="text-sm" style={{ color: 'var(--text)' }}>No game yet.</p>}
      </div>
      <div className="flex flex-col gap-6 px-4 py-4 lg:px-6">
        {d.changed.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <Kicker>WHERE IT LEAVES THEM</Kicker>
            <div className="grid grid-cols-2 gap-2">
              {d.changed.map(c => (
                <div key={c.label} className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5" style={{ background: 'var(--bg-raised)' }}>
                  <span className="text-lg font-extrabold" style={{ ...MONO, color: 'var(--text-bright)' }}>{c.value}</span>
                  <span className="text-[11px] leading-snug" style={{ color: 'var(--text)' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {d.next && (
          <Link href={d.next.href} className="flex flex-col gap-1 rounded-lg border px-3 py-3 transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border-soft)' }}>
            <Kicker heat>NEXT · {localDay(d.next.time).toUpperCase()} {local(d.next.time)} YOUR TIME</Kicker>
            <span className="text-[15px] font-bold" style={{ color: 'var(--text-bright)' }}>{d.next.away} @ {d.next.home}</span>
            {d.next.pct != null && (
              <span className="text-xs" style={{ color: 'var(--text)' }}>
                Our model: {d.name} <b style={{ ...MONO, color: d.next.pct >= 50 ? 'var(--heat)' : 'var(--text-bright)' }}>{d.next.pct}%</b> to win
              </span>
            )}
          </Link>
        )}
        <FormList rows={d.form} />
        {d.href && (
          <Link href={d.href} className="flex h-11 items-center justify-center rounded-[10px] border text-sm font-semibold hover:border-[var(--heat)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-bright)' }}>{d.name} page →</Link>
        )}
      </div>
    </div>
  );
}
