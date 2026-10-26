import Link from 'next/link';
import { Headshot, SectionHeading, SectionLink } from '@/components/ds';
import type { GameStoryCard, NightStory } from '@/lib/stories';
import type { Moment } from '@/lib/moments';
import { BestGoals } from './BestGoals';
import { MONO } from './format';

// A big night (12+ games) stays a summary, not a table of scores.
const SCORE_CHIPS = 6;
// The night: cover, headline, dek and every score of the night. Side by
// side when it has the row to itself, stacked when it shares one.
function NightCard({ n, stacked = false, className = '' }: { n: NightStory; stacked?: boolean; className?: string }) {
  return (
    <article className={`grid overflow-hidden rounded-2xl border ${stacked ? '' : 'lg:grid-cols-2'} ${className}`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {/* The cover is 16:9 at every width — stretched taller it crops the logos and the star */}
      <Link href={n.href} className={`relative block aspect-video ${stacked ? '' : 'lg:self-center'}`} style={{ background: 'var(--bg-raised)' }} aria-label={n.title}>
        {n.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </Link>
      <div className="flex flex-col gap-3.5 p-5 lg:px-7 lg:py-6">
        <div className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>{n.kicker}</div>
        <h3 className="text-2xl font-extrabold leading-tight lg:text-[30px]" style={{ color: 'var(--text-bright)', letterSpacing: '-0.03em', textWrap: 'pretty' }}>
          <Link href={n.href}>{n.title}</Link>
        </h3>
        {n.dek && <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text)' }}>{n.dek}</p>}
        {n.scores.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {n.scores.slice(0, SCORE_CHIPS).map(s => (
              <Link key={s.href} href={s.href} className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition-colors hover:bg-[var(--bg-hover)]" style={{ ...MONO, background: 'var(--bg)', borderColor: 'var(--border)' }}>
                <span style={{ color: s.awayScore > s.homeScore ? 'var(--text-bright)' : 'var(--text-muted)' }}>{s.away} {s.awayScore}</span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: s.homeScore > s.awayScore ? 'var(--text-bright)' : 'var(--text-muted)' }}>{s.homeScore} {s.home}</span>
              </Link>
            ))}
            {n.scores.length > SCORE_CHIPS && (
              <Link href={n.href} className="inline-flex min-h-[30px] items-center rounded-lg px-2 text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)' }}>+{n.scores.length - SCORE_CHIPS} more</Link>
            )}
          </div>
        )}
        <div className="mt-auto pt-1">
          <Link href={n.href} className="text-xs font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 0.5 }}>READ THE NIGHT →</Link>
        </div>
      </div>
    </article>
  );
}

// One game: its cover with the score, its story's headline and dek, its star.
function GameCard({ g }: { g: GameStoryCard }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[14px] border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <Link href={g.href} className="relative block aspect-video" style={{ background: 'var(--bg-raised)' }} aria-label={g.title}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={g.image} alt={g.score} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </Link>
      <Link href={g.href} className="flex flex-1 flex-col gap-2 px-[18px] pb-[18px] pt-4">
        <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.2 }}>{g.kicker}</span>
        <h3 className="text-[19px] font-extrabold leading-snug" style={{ color: 'var(--text-bright)', letterSpacing: '-0.02em', textWrap: 'pretty' }}>{g.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{g.dek}</p>
        {g.star && (
          <span className="mt-auto flex items-center gap-2.5 border-t pt-2.5" style={{ borderColor: 'var(--border-soft)' }}>
            <Headshot src={g.star.photo} name={g.star.name} team={g.star.team} size={30} />
            <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: 'var(--text)' }}>
              <span style={{ color: '#ffc94d' }}>★</span> <span className="font-bold" style={{ color: 'var(--text-bright)' }}>{g.star.name}</span> · {g.star.line}
            </span>
            <span className="text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)' }}>READ →</span>
          </span>
        )}
      </Link>
    </article>
  );
}

// Last night in stories: the night recap, its best goals (clips), then the best games, each linking to
// its game page (where its full story lives). Three game cards get their own
// row under the night; one or two share the night's row, so a short night
// doesn't leave a lone card under a wide box.
export function ArticleGrid({ night, games, moments = [] }: { night: NightStory | null; games: GameStoryCard[]; moments?: Moment[] }) {
  if (!night) return null;
  const heading = <SectionHeading kicker={`STORIES · ${night.scores.length} GAME${night.scores.length === 1 ? '' : 'S'}`} title="The night in stories." sub="What happened, told through the numbers." size="feature" right={<SectionLink href="/recaps">All stories</SectionLink>} />;
  if (games.length === 1 || games.length === 2) {
    return (
      <section data-section="stories" className="flex flex-col gap-3.5">
        {heading}
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          <NightCard n={night} stacked={games.length === 2} className={games.length === 1 ? 'lg:col-span-2' : ''} />
          {games.map(g => <GameCard key={g.id} g={g} />)}
        </div>
        <BestGoals moments={moments} />
      </section>
    );
  }
  return (
    <section data-section="stories" className="flex flex-col gap-3.5">
      {heading}
      <NightCard n={night} />
      <BestGoals moments={moments} />
      {games.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map(g => <GameCard key={g.id} g={g} />)}
        </div>
      )}
    </section>
  );
}
