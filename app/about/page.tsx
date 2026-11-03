import type { Metadata } from 'next';
import Link from 'next/link';
import { SHARE_IMAGE } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { PPM_MAX, heatColor } from '@/lib/heat';
import { SectionHeading, SectionLink } from '@/components/ds';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'About momentum. — How Heat Works and How the Stories Are Made',
  description: 'What momentum. is, how the Heat score is calculated (points per minute of ice time over the last five games), how the nightly stories are written and where the data comes from.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: { images: [SHARE_IMAGE], title: 'About momentum.', description: 'How the Heat score works, how the stories are made, and where the data comes from.' },
};

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const P60 = (PPM_MAX * 60).toFixed(1);   // points per 60 minutes at Heat 100

// The Heat bands, as heatColor() draws them.
const BANDS: [number, string, string][] = [
  [85, '85–100', 'White-hot'],
  [70, '70–84', 'On fire'],
  [55, '55–69', 'Hot'],
  [40, '40–54', 'Warm'],
  [25, '25–39', 'Neutral'],
  [0, '0–24', 'Ice cold'],
];

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t pt-8" style={{ borderColor: 'var(--border-soft)' }}>
      <SectionHeading kicker={kicker} title={title} />
      <div className="flex flex-col gap-4 text-[15px] leading-[1.7]" style={{ color: 'var(--text)' }}>{children}</div>
    </section>
  );
}

const B = ({ children }: { children: React.ReactNode }) => <strong style={{ color: 'var(--text-bright)' }}>{children}</strong>;

export default function AboutPage() {
  return (
    <div className="flex max-w-[760px] flex-col gap-10 pb-20 lg:pb-0">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About momentum.',
        url: `${SITE_URL}/about`,
        about: { '@type': 'Organization', name: 'momentum.', url: SITE_URL, description: 'Independent NHL analytics: a Heat score for every player and a story for every game night.' },
      }} />

      <SectionHeading as="h1" size="page" kicker="ABOUT · HOW IT WORKS" title="Who's hot, and how we know."
        sub="momentum. is an independent NHL analytics site. Every player gets a Heat score after every game, and every game night gets its story." />

      <Section id="what" kicker="WHAT IT IS" title="Hockey intelligence, daily.">
        <p>
          Box scores tell you what happened. We try to tell you <B>who is playing well right now</B> — not on paper, not over a whole season,
          but over the last few games — and what that meant for last night and means for tonight.
        </p>
        <p>
          Every morning the site updates with last night&apos;s results, a story for the night and for each game, the best goals with their
          clips, and fresh Heat for every skater in the league.
        </p>
      </Section>

      <Section id="heat" kicker="HEAT · METHODOLOGY" title="How Heat is calculated.">
        <p>
          Heat is a player&apos;s <B>points per minute of ice time over his last five games</B>, put on a scale from 0 to 100.
          A player producing {PPM_MAX} points per minute — {P60} points per 60 minutes on the ice — is at 100. Anything above stays at 100.
        </p>
        <p>
          Ice time matters because the same point means more in less time: a winger with a goal and an assist in 12 minutes is hotter
          than one with the same line in 22. Five games is long enough to smooth out a lucky night and short enough to catch a streak
          while it is still happening.
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BANDS.map(([h, range, label]) => (
            <li key={label} className="flex items-center gap-2.5 rounded-lg border px-3 py-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: heatColor(h) }} />
              <span className="text-xs font-bold" style={{ ...MONO, color: heatColor(h) }}>{range}</span>
              <span className="text-xs" style={{ color: 'var(--text)' }}>{label}</span>
            </li>
          ))}
        </ul>
        <p>
          <B>Rankings</B> only include skaters with at least three games in the window, so one big night after an injury doesn&apos;t top the board.
          <B> Team Heat</B> is the average of a team&apos;s five hottest skaters. <B>Goalies</B> aren&apos;t measured in points: they are ranked by
          save percentage over their recent starts.
        </p>
        <p>
          Next to Heat we always show the comparison that gives it meaning — the player&apos;s own season pace, his position&apos;s league
          average, his last five games — because a number on its own says little.
        </p>
      </Section>

      <Section id="stories" kicker="STORIES · HOW THEY ARE MADE" title="Written by AI, from the numbers only.">
        <p>
          The nightly recap and the story of each game are written by an AI model, from our own data: the final score, every goal in the
          NHL&apos;s score feed, the box score, the three stars, Heat and our pre-game pick. The model gets no rumours, no quotes and nothing
          we can&apos;t check.
        </p>
        <p>
          Before a story is published, its claims are checked against the official score feed — who scored, when and how many. A draft
          that fails the check goes back to be rewritten.
        </p>
      </Section>

      <Section id="predictions" kicker="PREDICTIONS" title="A pick for every game, with its record in public.">
        <p>
          Each game gets a pre-game pick from our model, built on Heat, goaltending, rest and home ice. Its full record — every pick, hit or
          miss — is public on the <Link href="/accuracy" className="recap-inline-link">accuracy page</Link>. Hockey is hard to predict, and we
          would rather show the real number than a flattering one.
        </p>
      </Section>

      <Section id="data" kicker="DATA & RIGHTS" title="Where it comes from.">
        <p>
          Stats come from the NHL&apos;s public stats API and update throughout the night. Goal clips play in NHL.com&apos;s own player, and game
          highlights are the NHL&apos;s own YouTube videos — we embed them, we don&apos;t host them.
        </p>
        <p>
          momentum. is independent and not affiliated with, endorsed by or sponsored by the National Hockey League or any of its teams. NHL
          and team names and logos are trademarks of the NHL and its teams.
        </p>
      </Section>

      <div className="flex flex-wrap gap-5 border-t pt-5" style={{ borderColor: 'var(--border-soft)' }}>
        <SectionLink href="/hot">Who&apos;s hot now</SectionLink>
        <SectionLink href="/recaps">Last night&apos;s stories</SectionLink>
      </div>
    </div>
  );
}
