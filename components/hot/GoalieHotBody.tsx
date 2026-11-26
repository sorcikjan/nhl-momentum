import { SectionHeading, SectionLink, TeamChip } from '@/components/ds';
import { RECENT_STARTS, svPctText, type GoalieHotRow, type GoalieHotView } from '@/lib/goalie-hot-view';
import Link from 'next/link';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

export const GOALIE_HOT_FAQ = [
  { q: 'How are goalies ranked?', a: `By save percentage over each goalie's last ${RECENT_STARTS} starts: saves divided by shots against, all five games together. Relief appearances don't count, and a goalie needs at least three starts in the last 30 days to be listed.` },
  { q: 'Why save percentage and not wins?', a: 'Wins depend on the team in front of the goalie. Save percentage is the share of shots he stopped, the closest single number to how well he is playing himself.' },
  { q: 'What does "vs season" mean?', a: "His last five starts minus his own season save percentage. +.020 means he is stopping two more shots in every hundred than he has all season: he is on a run, not just good." },
];

// Save % bar from .850 to .950: the league lives in that band, so the
// differences that matter are visible. Tick = league average.
const LOW = 0.85, HIGH = 0.95;
const pos = (v: number) => Math.min(100, Math.max(0, ((v - LOW) / (HIGH - LOW)) * 100));
const signed = (k: number) => `${k > 0 ? '+' : k < 0 ? '−' : '±'}.${String(Math.abs(k)).padStart(3, '0')}`;
const tone = (k: number | null) => k == null || k === 0 ? 'var(--text-muted)' : k > 0 ? 'var(--rise)' : 'var(--cold)';

function GoalieRow({ g, league }: { g: GoalieHotRow; league: number }) {
  return (
    <Link href={g.href} className="flex min-h-[64px] items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:bg-[var(--bg-hover)] lg:px-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
      <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums" style={{ ...MONO, color: 'var(--text-muted)' }}>{g.rank}</span>
      <TeamChip abbrev={g.team} size={30} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[14px] font-bold" style={{ color: 'var(--text-bright)' }}>{g.name}</span>
        <span className="relative block h-1.5 w-full max-w-[260px] rounded-full lg:max-w-[520px]" style={{ background: 'var(--border)' }}>
          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos(g.svPct)}%`, background: tone(g.vsLeague) }} />
          <span aria-hidden className="absolute -top-1 h-3.5 w-px" style={{ left: `${pos(league)}%`, background: 'var(--text-muted)' }} />
        </span>
        <span className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {[`${g.starts} starts ${g.record}`, g.gaa != null && `${g.gaa.toFixed(2)} GAA`, g.seasonSvPct != null && `season ${svPctText(g.seasonSvPct)}`].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--text-bright)' }}>{svPctText(g.svPct)}</span>
        {g.vsSeason != null && (
          <span className="text-[11px] font-bold tabular-nums" style={{ ...MONO, color: tone(g.vsSeason) }}>{signed(g.vsSeason)} vs season</span>
        )}
      </span>
    </Link>
  );
}

export function GoalieHotBody({ view, updated }: { view: GoalieHotView; updated: string }) {
  const { rows, leagueSvPct } = view;
  const leader = rows[0];
  return (
    <div className="flex flex-col gap-10 pb-20 lg:gap-14 lg:pb-0">
      <section data-section="goalies" className="flex flex-col gap-4">
        <SectionHeading
          as="h1" size="page"
          kicker={`GOALIES · LAST ${RECENT_STARTS} STARTS · ${updated}`}
          title="The hottest goalies in the NHL right now."
          sub={leader && leagueSvPct != null
            ? `Every goalie by save % over his last ${RECENT_STARTS} starts. ${leader.name} leads at ${svPctText(leader.svPct)}; the league average this season is ${svPctText(leagueSvPct)} (the tick on each bar).`
            : `Every goalie by save % over his last ${RECENT_STARTS} starts.`}
          right={<SectionLink href="/hot">Hottest players</SectionLink>}
        />
        {!rows.length || leagueSvPct == null ? (
          <p className="rounded-xl border p-6 text-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Not enough starts yet this season.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map(g => <GoalieRow key={g.playerId} g={g} league={leagueSvPct} />)}
          </div>
        )}
      </section>

      <section data-section="faq">
        <SectionHeading kicker="ABOUT THIS LIST" title="Questions, answered." right={<SectionLink href="/hot/teams">Hottest teams</SectionLink>} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {GOALIE_HOT_FAQ.map(f => (
            <div key={f.q} className="rounded-xl border px-5 py-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h2 className="mb-1.5 text-[15px] font-extrabold" style={{ color: 'var(--text-bright)' }}>{f.q}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
