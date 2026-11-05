import Link from 'next/link';
import { PlayerList, SectionHeading, SectionLink, TeamChip } from '@/components/ds';
import { GoalButtons, GoalStrip } from '@/components/home/BestGoals';
import { Flag } from '@/components/nation/Flag';
import type { NationData, NightGame, TonightGame } from '@/lib/nation-data';
import { pct, type Nation } from '@/lib/nations';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const CARD = { background: 'var(--bg-card)', borderColor: 'var(--border-soft)' } as const;
// Only strings cross to the client goal player.
const goalLabels = ({ t: { ui } }: Nation) => ({ watch: ui.watch, onNhl: ui.onNhl, close: ui.close });

function Teams({ away, home, awayScore, homeScore, right }: { away: string; home: string; awayScore?: number; homeScore?: number; right: string }) {
  const score = { ...MONO, color: 'var(--text-bright)' } as const;
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <TeamChip abbrev={away} size={24} />
      <span className="font-bold" style={{ color: 'var(--text-bright)' }}>{away}</span>
      {awayScore != null && <span className="font-bold" style={score}>{awayScore}</span>}
      <span className="text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>@</span>
      <TeamChip abbrev={home} size={24} />
      <span className="font-bold" style={{ color: 'var(--text-bright)' }}>{home}</span>
      {homeScore != null && <span className="font-bold" style={score}>{homeScore}</span>}
      <span className="flex-1" />
      <span className="text-[10px] font-semibold" style={{ ...MONO, color: 'var(--text)' }}>{right}</span>
    </div>
  );
}

function NightCard({ g, n }: { g: NightGame; n: Nation }) {
  const ui = n.t.ui;
  return (
    <div className="flex flex-col gap-3 rounded-xl border px-4 py-3.5" style={CARD}>
      <Link href={g.href} className="hover:opacity-80">
        <Teams away={g.away} home={g.home} awayScore={g.awayScore} homeScore={g.homeScore} right={g.suffix ? `${ui.final} · ${g.suffix}` : ui.final} />
      </Link>
      <ul className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
        {g.players.map(p => (
          <li key={p.href} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <Link href={p.href} className="font-bold hover:underline" style={{ color: 'var(--text-bright)' }}>{p.name}</Link>
            {p.phrase && <span style={{ color: p.points > 0 ? 'var(--heat)' : 'var(--text)' }}>{p.phrase}</span>}
            <span className="text-xs" style={{ ...MONO, color: 'var(--text-muted)' }}>{p.line}</span>
            {p.goals.length > 0 && <span className="flex flex-wrap gap-1.5"><GoalButtons moments={p.goals} labels={goalLabels(n)} /></span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TonightCard({ g, n }: { g: TonightGame; n: Nation }) {
  const names = (list: string[]) => list.length ? list.join(', ') : '—';
  return (
    <Link href={g.href} className="flex flex-col gap-2.5 rounded-xl border px-4 py-3.5 transition-colors hover:bg-[var(--bg-hover)]"
      style={{ ...CARD, borderColor: g.derby ? 'var(--heat)' : CARD.borderColor }}>
      {g.derby && <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.1 }}>{n.t.ui.derby}</span>}
      <Teams away={g.away} home={g.home} right={g.time ?? ''} />
      <span className="text-xs" style={{ color: 'var(--text)' }}>
        {g.awayPlayers.length > 0 && <>{g.away}: <b style={{ color: 'var(--text-bright)' }}>{names(g.awayPlayers)}</b></>}
        {g.awayPlayers.length > 0 && g.homePlayers.length > 0 && ' · '}
        {g.homePlayers.length > 0 && <>{g.home}: <b style={{ color: 'var(--text-bright)' }}>{names(g.homePlayers)}</b></>}
      </span>
    </Link>
  );
}

const Note = ({ children }: { children: React.ReactNode }) =>
  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{children}</p>;

// A nation's page body ("Češi v NHL", "Svenskar i NHL"): the homepage's
// morning — results, goals, form, tonight — for one nation's players, in
// their language.
export function NationBody({ n, data, updated }: { n: Nation; data: NationData; updated: string }) {
  const { night, goals, skaters, goalies, tonight, league } = data;
  const ui = n.t.ui;
  // The league around them, so their numbers read against the whole NHL.
  const vsLeague = [
    league.leader ? ui.leader(league.leader.name, league.leader.heat) : null,
    league.medianHeat != null ? ui.median(league.medianHeat) : null,
  ].filter(Boolean);
  const skaterSub = ui.heatSub + (vsLeague.length ? ` ${ui.vsLeague} ${vsLeague.join(` ${ui.and} `)}.` : '');
  const goalieSub = ui.goalieSub + (league.goalieAvg != null ? ` ${ui.goalieAvg(pct(league.goalieAvg))}` : '');
  return (
    <div lang={n.lang} className="flex flex-col gap-12 pb-20 lg:pb-0">
      <SectionHeading as="h1" size="page"
        kicker={<span className="inline-flex items-center gap-2"><Flag code={n.code} width={18} />{ui.name.toUpperCase()} · {updated}</span>}
        title={`${ui.name}.`} sub={ui.sub(data.count)} />
      {data.partial && <Note>{ui.partial}</Note>}

      {night && night.games.length > 0 && (
        <section data-section="nation-night">
          <SectionHeading kicker={`${ui.results} · ${night.label.toUpperCase()}`} title={ui.nightTitle} size="feature"
            sub={night.summary || undefined} />
          <div className="grid gap-3 lg:grid-cols-2">
            {night.games.map(g => <NightCard key={g.href} g={g} n={n} />)}
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {night.scratched.length > 0 && <Note>{ui.scratched}: {night.scratched.join(', ')}.</Note>}
            {night.idle.length > 0 && <Note>{ui.idle}: {night.idle.join(', ')}.</Note>}
          </div>
        </section>
      )}

      {goals.length > 0 && (
        <section data-section="nation-goals">
          <SectionHeading kicker={ui.goalsKicker(goals.length)} title={ui.goalsTitle} size="feature" />
          <GoalStrip moments={goals} cols={3} labels={goalLabels(n)} />
        </section>
      )}

      {tonight && (
        <section data-section="nation-tonight">
          <SectionHeading kicker={`${ui.schedule} · ${tonight.label.toUpperCase()} · ${ui.localTime}`} title={ui.nextTitle} size="feature" />
          <div className="grid gap-3 lg:grid-cols-2">
            {tonight.games.map(g => <TonightCard key={g.href} g={g} n={n} />)}
          </div>
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <section data-section="nation-heat">
          <SectionHeading kicker={ui.formKicker} title={ui.formTitle}
            sub={skaterSub}
            right={<SectionLink href="/about#heat">{ui.howHeat}</SectionLink>} />
          <PlayerList rows={skaters} empty={ui.empty} />
          {data.notPlayed.length > 0 && <div className="mt-3"><Note>{ui.notPlayed}: {data.notPlayed.join(', ')}.</Note></div>}
        </section>
        <section data-section="nation-goalies">
          <SectionHeading kicker={ui.goalieKicker} title={ui.goalieTitle}
            sub={goalieSub} />
          <PlayerList rows={goalies} empty={ui.goalieEmpty} />
        </section>
      </div>

      <div className="flex flex-wrap gap-5 border-t pt-5" style={{ borderColor: 'var(--border-soft)' }}>
        <SectionLink href="/hot">{ui.bestInNhl}</SectionLink>
        <SectionLink href="/">{ui.allResults}</SectionLink>
      </div>
    </div>
  );
}
