import { SectionHeading, SectionLink, TeamChip } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import type { TeamHotRow, TeamHotView } from '@/lib/team-hot-view';
import Link from 'next/link';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

export const TEAM_HEAT_FAQ = [
  { q: 'What is Team Heat?', a: "The average Heat of a team's five hottest skaters: how hot its top players are right now, from 0 to 100. Heat is a player's points per minute on ice over his last five games." },
  { q: 'Why not just the standings?', a: 'Standings add up the whole season. Team Heat shows who is rolling this week: a team low in the standings can have the hottest top line in the league. The last-10 record next to it shows whether the wins follow.' },
  { q: 'What does it leave out?', a: "Goaltending and defence. Team Heat measures scoring form only: a team can win tight games with a hot goalie and a cold top line." },
];

// One team: rank, name, record, its hottest skater, and a bar from 0 to 100
// with a tick at the league average, so the number reads at a glance.
function TeamRow({ t, avg }: { t: TeamHotRow; avg: number }) {
  const color = heatColor(t.heat);
  const body = (
    <>
      <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums" style={{ ...MONO, color: 'var(--text-muted)' }}>{t.rank}</span>
      <TeamChip abbrev={t.abbrev} size={30} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[14px] font-bold" style={{ color: 'var(--text-bright)' }}>{t.name}</span>
        <span className="relative block h-1.5 w-full max-w-[260px] lg:max-w-[520px] rounded-full" style={{ background: 'var(--border)' }}>
          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${t.heat}%`, background: color }} />
          <span aria-hidden className="absolute -top-1 h-3.5 w-px" style={{ left: `${avg}%`, background: 'var(--text-muted)' }} />
        </span>
        <span className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {[t.l10 && `L10 ${t.l10}`, t.streak && `streak ${t.streak}`, t.hottest && `hottest: ${t.hottest.name} ${t.hottest.value}`].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="text-xl font-extrabold tabular-nums" style={{ color }}>{t.heat}</span>
        <span className="text-[11px] font-bold tabular-nums" style={{ ...MONO, color: t.vsAvg > 0 ? 'var(--rise)' : t.vsAvg < 0 ? 'var(--cold)' : 'var(--text-muted)' }}>
          {t.vsAvg > 0 ? '+' : t.vsAvg < 0 ? '−' : '±'}{Math.abs(t.vsAvg)} vs avg
        </span>
      </span>
    </>
  );
  const cls = 'flex min-h-[64px] items-center gap-3 rounded-xl border px-3 py-2.5 lg:px-4';
  const style = { background: 'var(--bg-card)', borderColor: 'var(--border-soft)' };
  return t.href
    ? <Link href={t.href} className={`${cls} transition-colors hover:bg-[var(--bg-hover)]`} style={style}>{body}</Link>
    : <div className={cls} style={style}>{body}</div>;
}

export function TeamHotBody({ view, updated }: { view: TeamHotView; updated: string }) {
  const { rows, leagueAvg } = view;
  const leader = rows[0];
  return (
    <div className="flex flex-col gap-10 pb-20 lg:gap-14 lg:pb-0">
      <section data-section="teams" className="flex flex-col gap-4">
        <SectionHeading
          as="h1" size="page"
          kicker={`TEAM HEAT · LAST 5 GAMES · ${updated}`}
          title="The hottest teams in the NHL right now."
          sub={leader && leagueAvg != null
            ? `All 32 teams by Team Heat: how hot their five best skaters are right now. ${leader.name} lead at ${leader.heat}; the league average is ${leagueAvg} (the tick on each bar).`
            : 'All 32 teams by Team Heat: how hot their five best skaters are right now.'}
          right={<SectionLink href="/hot">Hottest players</SectionLink>}
        />
        {!rows.length || leagueAvg == null ? (
          <p className="rounded-xl border p-6 text-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Not enough games yet this season.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map(t => <TeamRow key={t.abbrev} t={t} avg={leagueAvg} />)}
          </div>
        )}
      </section>

      <section data-section="faq">
        <SectionHeading kicker="ABOUT TEAM HEAT" title="Questions, answered." right={<SectionLink href="/standings">Standings</SectionLink>} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {TEAM_HEAT_FAQ.map(f => (
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
