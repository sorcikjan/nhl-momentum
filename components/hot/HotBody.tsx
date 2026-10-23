import { PlayerList, SectionHeading, SectionLink, TeamChip } from '@/components/ds';
import { LeaderCard } from '@/components/home/HeatHero';
import ShareButton from '@/components/ui/ShareButton';
import { heatColor } from '@/lib/heat';
import type { HotView } from '@/lib/hot-view';
import { hotShareText } from '@/lib/share';
import Link from 'next/link';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// The scale, as heatColor() draws it — so a first-time visitor can read any
// number on the site.
const SCALE = [
  { from: 0, label: 'Ice cold' }, { from: 25, label: 'Neutral' }, { from: 40, label: 'Warm' },
  { from: 55, label: 'Hot' }, { from: 70, label: 'On fire' }, { from: 85, label: 'White-hot' },
];

export const HEAT_FAQ = [
  { q: 'What is Heat?', a: "Heat is one number from 0 to 100 for a player's current form: his points per minute on ice over his last five games, scaled so an elite multi-point stretch reaches 100. It is recalculated after every game." },
  { q: 'How is Heat different from season stats?', a: 'Season totals tell you who has been good. Heat tells you who is good right now. A player can lead the league in points and be cooling off, or sit outside the top 100 and be the hottest player of the week.' },
  { q: 'Who counts?', a: 'Skaters who played at least three of their team\'s last five games and have a meaningful sample this season. Goalies are ranked separately, by save percentage.' },
];

function HowToRead() {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border px-4 py-3.5 lg:flex-row lg:items-center lg:gap-6 lg:px-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1.4 }}>HOW TO READ HEAT</span>
      <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1.5">
        {SCALE.map(s => (
          <span key={s.from} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: heatColor(s.from) }} />
            <span className="font-bold tabular-nums" style={{ color: heatColor(s.from) }}>{s.from}+</span> {s.label}
          </span>
        ))}
      </div>
      <Link href="/welcome" className="text-xs font-bold" style={{ color: 'var(--heat)' }}>How Heat works →</Link>
    </div>
  );
}

// Heat page: the same building blocks as the homepage (SectionHeading,
// LeaderCard, PlayerRow), top to bottom in the order a visitor asks:
// what is this, who leads, who's moving, who's hot on my team, everyone else.
export function HotBody({ view, updated }: { view: HotView; updated: string }) {
  const { leader, top, more, heatingUp, coolingOff, teams } = view;
  return (
    <div className="flex flex-col gap-10 pb-20 lg:gap-14 lg:pb-0">
      <section data-section="index" className="flex flex-col gap-4">
        <SectionHeading
          as="h1" size="page"
          kicker={`NHL HEAT INDEX · LAST 5 GAMES · ${updated}`}
          title="The hottest players in the NHL right now."
          sub="Heat rates every skater's current form from 0 to 100, from his last five games. Recalculated after every game night."
          right={leader ? <ShareButton path="/hot" text={hotShareText([{ name: `${leader.first} ${leader.last}`, heat: leader.heat }, ...top.slice(0, 2).map(p => ({ name: p.name, heat: Number(p.value) }))])} /> : undefined}
        />
        <HowToRead />
        {!leader ? (
          <p className="rounded-xl border p-6 text-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Not enough games yet this season.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr] lg:gap-6">
            <LeaderCard p={leader} />
            <PlayerList rows={top} />
          </div>
        )}
      </section>

      {(heatingUp.length > 0 || coolingOff.length > 0) && (
        <section data-section="movers" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading as="h2" kicker="BREAKING OUT · L5 VS SEASON PACE" title="Heating up." sub="Furthest above their own season pace." />
            <PlayerList rows={heatingUp} />
          </div>
          <div>
            <SectionHeading as="h2" kicker="COOLING OFF · L5 VS SEASON PACE" title="Going cold." sub="Furthest below their own season pace." />
            <PlayerList rows={coolingOff} />
          </div>
        </section>
      )}

      {teams.length > 0 && (
        <section data-section="teams">
          <SectionHeading kicker="ALL 32 TEAMS" title="Who's hot on every team." sub="Each team's hottest skater right now." right={<SectionLink href="/standings">Standings</SectionLink>} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {teams.map(t => (
              <Link key={t.team} href={t.row.href} className="flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
                <TeamChip abbrev={t.team} size={26} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-bold" style={{ color: 'var(--text-bright)' }}>{t.row.name}</span>
                  <span className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.teamName || t.team} · {t.row.l5}</span>
                </span>
                <span className="text-lg font-extrabold tabular-nums" style={{ color: heatColor(t.row.valueHeat ?? 0) }}>{t.row.value}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section data-section="more">
          <SectionHeading kicker={`HEAT INDEX · 11–${more.length + 10}`} title="The rest of the Heat Index." sub="Ranked by Heat. Season totals and every filter are in the rankings." right={<SectionLink href="/rankings">All rankings</SectionLink>} />
          <PlayerList rows={more.slice(0, 15)} />
          {more.length > 15 && (
            <details className="group mt-2">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-center gap-2 rounded-xl border text-[13px] font-bold [&::-webkit-details-marker]:hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }}>
                <span className="group-open:hidden">Show {more.length - 15} more</span>
                <span className="hidden group-open:inline">Show fewer</span>
              </summary>
              <div className="mt-2"><PlayerList rows={more.slice(15)} /></div>
            </details>
          )}
        </section>
      )}

      <section data-section="faq">
        <SectionHeading kicker="ABOUT HEAT" title="Questions, answered." />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {HEAT_FAQ.map(f => (
            <div key={f.q} className="rounded-xl border px-5 py-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="mb-1.5 text-[15px] font-extrabold" style={{ color: 'var(--text-bright)' }}>{f.q}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
