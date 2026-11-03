import Link from 'next/link';
import { PlayerList, SectionHeading, SectionLink, TeamChip } from '@/components/ds';
import { GoalStrip } from '@/components/home/BestGoals';
import type { NationData, NightGame, TonightGame } from '@/lib/nation-data';
import { plural } from '@/lib/nations';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const CARD = { background: 'var(--bg-card)', borderColor: 'var(--border-soft)' } as const;
const GOAL_LABELS = { watch: 'přehrát gól', onNhl: 'PŘEHRÁT NA NHL.COM', close: 'Zavřít' };

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

function NightCard({ g }: { g: NightGame }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border px-4 py-3.5" style={CARD}>
      <Link href={g.href} className="hover:opacity-80">
        <Teams away={g.away} home={g.home} awayScore={g.awayScore} homeScore={g.homeScore} right={g.suffix ? `KONEC · ${g.suffix}` : 'KONEC'} />
      </Link>
      <ul className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
        {g.players.map(p => (
          <li key={p.href} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <Link href={p.href} className="font-bold hover:underline" style={{ color: 'var(--text-bright)' }}>{p.name}</Link>
            {p.phrase && <span style={{ color: p.points > 0 ? 'var(--heat)' : 'var(--text)' }}>{p.phrase}</span>}
            <span className="text-xs" style={{ ...MONO, color: 'var(--text-muted)' }}>{p.line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TonightCard({ g }: { g: TonightGame }) {
  const names = (list: string[]) => list.length ? list.join(', ') : '—';
  return (
    <Link href={g.href} className="flex flex-col gap-2.5 rounded-xl border px-4 py-3.5 transition-colors hover:bg-[var(--bg-hover)]"
      style={{ ...CARD, borderColor: g.derby ? 'var(--heat)' : CARD.borderColor }}>
      {g.derby && <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.1 }}>ČESKÉ DERBY</span>}
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

// "Czechs in the NHL": the homepage's morning — results, goals, form, tonight —
// for one nation's players, in Czech.
export function NationBody({ data, updated }: { data: NationData; updated: string }) {
  const { night, goals, skaters, goalies, tonight } = data;
  return (
    <div lang="cs" className="flex flex-col gap-12 pb-20 lg:pb-0">
      <SectionHeading as="h1" size="page" kicker={`🇨🇿 ČEŠI V NHL · ${updated}`} title="Češi v NHL."
        sub={`Jak hráli v noci, jejich góly, forma a kdo hraje dnes. ${data.count} ${plural(data.count, 'hráč', 'hráči', 'hráčů')} na soupiskách NHL, aktualizováno po každém zápase.`} />
      {data.partial && <Note>Část dat z NHL se teď nepodařilo načíst — chybějící hráči se doplní při další aktualizaci za pár minut.</Note>}

      {night && night.games.length > 0 && (
        <section data-section="nation-night">
          <SectionHeading kicker={`VÝSLEDKY · ${night.label.toUpperCase()}`} title="Jak hráli v noci." size="feature" />
          <div className="grid gap-3 lg:grid-cols-2">
            {night.games.map(g => <NightCard key={g.href} g={g} />)}
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {night.scratched.length > 0 && <Note>Nenastoupili: {night.scratched.join(', ')}.</Note>}
            {night.idle.length > 0 && <Note>Jejich tým nehrál: {night.idle.join(', ')}.</Note>}
          </div>
        </section>
      )}

      {goals.length > 0 && (
        <section data-section="nation-goals">
          <SectionHeading kicker={`GÓLY · ${goals.length} ${plural(goals.length, 'GÓL', 'GÓLY', 'GÓLŮ').toUpperCase()} S VIDEEM`} title="České góly posledních dnů." size="feature" />
          <GoalStrip moments={goals} cols={3} labels={GOAL_LABELS} />
        </section>
      )}

      {tonight && (
        <section data-section="nation-tonight">
          <SectionHeading kicker={`PROGRAM · ${tonight.label.toUpperCase()} · ČAS V PRAZE`} title="Kdo hraje příště." size="feature" />
          <div className="grid gap-3 lg:grid-cols-2">
            {tonight.games.map(g => <TonightCard key={g.href} g={g} />)}
          </div>
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <section data-section="nation-heat">
          <SectionHeading kicker="FORMA · HEAT 0–100" title="Kdo je ve formě."
            sub="Heat = body za minutu na ledě v posledních 5 zápasech. Procento je rozdíl proti jeho tempu v celé sezoně."
            right={<SectionLink href="/about#heat">Jak funguje Heat</SectionLink>} />
          <PlayerList rows={skaters} empty="Zatím žádné zápasy." />
          {data.notPlayed.length > 0 && <div className="mt-3"><Note>V sezoně zatím nehráli: {data.notPlayed.join(', ')}.</Note></div>}
        </section>
        <section data-section="nation-goalies">
          <SectionHeading kicker="BRANKÁŘI · POSLEDNÍCH 5 STARTŮ" title="Čeští gólmani."
            sub="Úspěšnost zákroků v posledních pěti startech, bilance výher, proher a proher po prodloužení." />
          <PlayerList rows={goalies} empty="Zatím žádné starty." />
        </section>
      </div>

      <div className="flex flex-wrap gap-5 border-t pt-5" style={{ borderColor: 'var(--border-soft)' }}>
        <SectionLink href="/hot">Nejlepší forma v celé NHL</SectionLink>
        <SectionLink href="/">Všechny výsledky</SectionLink>
      </div>
    </div>
  );
}
