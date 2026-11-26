import Link from 'next/link';
import { PlayerList, SectionHeading, SectionLink } from '@/components/ds';
import { Flag } from '@/components/nation/Flag';
import { Note, TonightCard } from '@/components/nation/NationBody';
import { TopicNav } from '@/components/nation/TopicNav';
import type { NationData, SeasonGoalieLine, SeasonLine } from '@/lib/nation-data';
import { topicLabels, type Labels, type Topic } from '@/lib/nation-topics';
import { pct, type Nation } from '@/lib/nations';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const CARD = { background: 'var(--bg-card)', borderColor: 'var(--border-soft)' } as const;

const toi = (sec: number | null) => sec == null ? '–' : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const signed = (v: number) => v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0';

function Th({ children, left }: { children: React.ReactNode; left?: boolean }) {
  return <th className={`px-2 py-2 text-[10px] font-semibold ${left ? 'text-left' : 'text-right'}`} style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.6 }}>{children}</th>;
}
function Td({ children, strong, left }: { children: React.ReactNode; strong?: boolean; left?: boolean }) {
  return <td className={`px-2 py-2 tabular-nums ${left ? 'text-left' : 'text-right'} ${strong ? 'font-extrabold' : ''}`} style={{ color: strong ? 'var(--text-bright)' : 'var(--text)' }}>{children}</td>;
}

function SkaterTable({ rows, l }: { rows: SeasonLine[]; l: Labels }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={CARD}>
      <table className="w-full min-w-[560px] text-sm">
        <thead><tr className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <Th left>#</Th><Th left>{l.player}</Th><Th>{l.gp}</Th><Th>{l.g}</Th><Th>{l.a}</Th><Th>{l.p}</Th><Th>+/−</Th><Th>{l.toi}</Th><Th>{l.league}</Th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.href} className="border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
              <Td left>{i + 1}</Td>
              <td className="px-2 py-2 text-left">
                <Link href={r.href} className="font-bold hover:underline" style={{ color: 'var(--text-bright)' }}>{r.name}</Link>
                <span className="ml-2 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{r.team} · {r.pos}</span>
              </td>
              <Td>{r.games}</Td><Td>{r.goals}</Td><Td>{r.assists}</Td><Td strong>{r.points}</Td>
              <Td>{signed(r.plusMinus)}</Td><Td>{toi(r.toiPerGame)}</Td><Td>{r.pointsRank}.</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GoalieTable({ rows, n, l }: { rows: SeasonGoalieLine[]; n: Nation; l: Labels }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={CARD}>
      <table className="w-full min-w-[520px] text-sm">
        <thead><tr className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <Th left>{l.goalie}</Th><Th>{l.gp}</Th><Th>{l.w}</Th><Th>{l.sv}</Th><Th>{l.gaa}</Th><Th>{l.so}</Th><Th>{l.league}</Th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.href} className="border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
              <td className="px-2 py-2 text-left">
                <Link href={r.href} className="font-bold hover:underline" style={{ color: 'var(--text-bright)' }}>{r.name}</Link>
                <span className="ml-2 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{r.team}</span>
              </td>
              <Td>{r.games}</Td><Td>{r.wins}</Td><Td strong>{pct(r.svPct, n)}</Td>
              <Td>{r.gaa == null ? '–' : r.gaa.toLocaleString(n.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td><Td>{r.shutouts}</Td>
              <Td>{r.svRank == null ? '–' : `${r.svRank}.`}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Faq({ faq, l }: { faq: Topic['faq']; l: Labels }) {
  return (
    <section data-section="faq">
      <SectionHeading kicker={l.faqKicker} title={l.faqTitle} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {faq.map(f => (
          <div key={f.q} className="rounded-xl border px-5 py-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="mb-1.5 text-[15px] font-extrabold" style={{ color: 'var(--text-bright)' }}>{f.q}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// One topic page: heading that answers the query, the matching part of the
// nation's data, links to the rest, a short FAQ. One column, as on mobile.
export function NationTopicBody({ n, topic, topics, data, updated }: { n: Nation; topic: Topic; topics: Topic[]; data: NationData; updated: string }) {
  const ui = n.t.ui;
  const l = topicLabels(n);
  const { league } = data;
  return (
    <div lang={n.lang} className="flex flex-col gap-10 pb-20 lg:pb-0">
      <div className="flex flex-col gap-4">
        <SectionHeading as="h1" size="page"
          kicker={<span className="inline-flex items-center gap-2"><Flag code={n.code} width={18} />{topic.kicker} · {updated}</span>}
          title={topic.h1} sub={topic.sub} />
        <TopicNav n={n} topics={topics} current={topic.key} />
      </div>

      {topic.key === 'forma' && (
        <section data-section="nation-heat">
          <SectionHeading kicker={ui.formKicker} title={ui.formTitle}
            sub={league.medianHeat != null ? ui.median(league.medianHeat) : undefined}
            right={<SectionLink href="/about#heat">{ui.howHeat}</SectionLink>} />
          <PlayerList rows={data.skaters} empty={ui.empty} />
          {data.notPlayed.length > 0 && <div className="mt-3"><Note>{ui.notPlayed}: {data.notPlayed.join(', ')}.</Note></div>}
        </section>
      )}

      {topic.key === 'statistiky' && (
        <section data-section="nation-season">
          {data.season.skaters.length
            ? <SkaterTable rows={data.season.skaters} l={l} />
            : <Note>{ui.empty}</Note>}
          <div className="mt-3"><Note>{l.legend}</Note></div>
        </section>
      )}
      {topic.key === 'statistiky' && data.season.goalies.length > 0 && (
        <section data-section="nation-goalie-season">
          <SectionHeading kicker={l.goalieSeasonKicker} title={l.goalieSeasonTitle} size="feature" />
          <GoalieTable rows={data.season.goalies} n={n} l={l} />
        </section>
      )}

      {topic.key === 'brankari' && (
        <>
          <section data-section="nation-goalies">
            <SectionHeading kicker={ui.goalieKicker} title={ui.goalieTitle}
              sub={ui.goalieSub + (league.goalieAvg != null ? ` ${ui.goalieAvg(pct(league.goalieAvg, n))}` : '')} />
            <PlayerList rows={data.goalies} empty={ui.goalieEmpty} />
          </section>
          {data.season.goalies.length > 0 && (
            <section data-section="nation-goalie-season">
              <SectionHeading kicker={l.goalieSeasonKicker} title={l.goalieSeasonTitle} size="feature" />
              <GoalieTable rows={data.season.goalies} n={n} l={l} />
            </section>
          )}
        </>
      )}

      {topic.key === 'dnes' && (
        <section data-section="nation-tonight">
          {data.tonight ? (
            <>
              <SectionHeading kicker={`${ui.schedule} · ${data.tonight.label.toUpperCase()} · ${ui.localTime}`} title={ui.nextTitle} size="feature" />
              <div className="flex flex-col gap-3">
                {data.tonight.games.map(g => <TonightCard key={g.href} g={g} n={n} />)}
              </div>
            </>
          ) : <Note>{l.noTonight}</Note>}
        </section>
      )}

      <Faq faq={topic.faq} l={l} />

      <div className="flex flex-wrap gap-5 border-t pt-5" style={{ borderColor: 'var(--border-soft)' }}>
        <SectionLink href={n.path}>{ui.name}</SectionLink>
        <SectionLink href="/hot">{ui.bestInNhl}</SectionLink>
      </div>
    </div>
  );
}
