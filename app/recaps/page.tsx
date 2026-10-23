import type { Metadata } from 'next';
import Link from 'next/link';
import { SHARE_IMAGE } from '@/lib/seo';
import { fetchFinishedGamesBetween, fetchGameStoriesByDate, fetchRecentRecaps } from '@/lib/data';
import { assertDatabaseUp } from '@/lib/supabase';
import { SectionHeading } from '@/components/ds';
import { gameStoryCard, groupByWeek, nightCard, nightStories, type FinishedGame, type NightCard } from '@/lib/stories';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'NHL Stories — Every Game Night, Told Through the Numbers',
  description: 'Stories from every NHL game night: who decided each game, the standout performances, and how the numbers saw it coming. Highlights and scores for every game.',
  openGraph: {
    images: [SHARE_IMAGE],
    title: 'NHL Stories — momentum.',
    description: 'Every NHL game night: who decided each game, the standout performances, and how the numbers saw it coming.',
  },
  twitter: {
    images: [SHARE_IMAGE.url],
    card: 'summary_large_image',
    title: 'NHL Stories — momentum.',
    description: 'Every NHL game night: who decided each game, the standout performances, and how the numbers saw it coming.',
  },
};

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const SHADE = 'linear-gradient(180deg, rgba(10,11,15,0) 50%, rgba(10,11,15,0.85) 100%)';

function Play({ size }: { size: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: 'var(--heat)' }}>
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="var(--bg)" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
    </span>
  );
}

function NightTile({ n }: { n: NightCard }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[14px] border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <Link href={n.href} className="flex flex-1 flex-col">
        <span className="relative block aspect-video" style={{ background: 'var(--bg-raised)' }}>
          {n.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span className="absolute bottom-2.5 left-3 rounded-md px-2 py-1 text-[10px] font-bold" style={{ ...MONO, background: 'rgba(10,11,15,0.82)', color: 'var(--text-bright)', letterSpacing: 1 }}>{n.gamesLabel}</span>
        </span>
        <span className="flex flex-1 flex-col gap-2 px-[18px] pb-[18px] pt-4">
          <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.2 }}>{n.kicker}</span>
          <h3 className="text-[19px] font-extrabold leading-snug" style={{ color: 'var(--text-bright)', letterSpacing: '-0.02em', textWrap: 'pretty' }}>{n.title}</h3>
          {n.dek && <span className="line-clamp-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{n.dek}</span>}
          {n.scores.length > 0 && (
            <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
              {[...n.scores, ...(n.more ? [`+${n.more}`] : [])].map(s => (
                <span key={s} className="rounded-md border px-2 py-0.5 text-[10px] font-bold" style={{ ...MONO, background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>{s}</span>
              ))}
            </span>
          )}
        </span>
      </Link>
    </article>
  );
}

export default async function RecapsPage() {
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const recaps = await fetchRecentRecaps(30).catch(() => []);
  const [latest, ...older] = recaps;
  const games = (recaps.length
    ? await fetchFinishedGamesBetween(recaps[recaps.length - 1].date, recaps[0].date).catch(() => [])
    : []) as FinishedGame[];
  const stories = latest ? await fetchGameStoriesByDate(latest.date).catch(() => new Map()) : new Map();
  // The cover: the latest night, its highlight, and every game with its story (or box-score line).
  const { night } = nightStories(latest ?? null, games, stories, new Set(), 0);
  const coverGames = latest ? games.filter(g => g.game_date === latest.date).map(g => gameStoryCard(g, stories.get(g.id), false)) : [];
  const weeks = groupByWeek(older.map(r => nightCard(r, games)));

  return (
    <div className="flex flex-col gap-10 pb-20 lg:pb-0">
      <SectionHeading as="h1" size="page" kicker="STORIES · EVERY GAME NIGHT" title="The nights, in stories." sub="Every NHL game night: what happened, who carried it and how the numbers saw it coming." />

      {!night ? (
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text)' }}>No stories yet — check back after tonight&apos;s games.</p>
        </div>
      ) : (
        <article className="grid overflow-hidden rounded-[18px] border lg:grid-cols-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <Link href={night.href} className="relative block aspect-video lg:aspect-auto lg:min-h-[380px]" style={{ background: 'var(--bg-raised)' }} aria-label={night.title}>
            {night.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={night.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <span className="absolute inset-0" style={{ background: SHADE }} />
            <span className="absolute left-5 top-4 rounded-md px-2.5 py-1 text-[10px] font-bold" style={{ ...MONO, background: 'var(--heat)', color: 'var(--bg)', letterSpacing: 1.2 }}>LATEST</span>
            {night.watchLabel && (
              <span className="absolute bottom-4 left-5 flex items-center gap-2.5 text-[13px] font-bold" style={{ color: 'var(--text-bright)' }}>
                <Play size={42} /> {night.watchLabel}
              </span>
            )}
          </Link>
          <div className="flex flex-col gap-4 p-6 lg:px-8 lg:py-7">
            <div className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>{night.kicker.replace('THE NIGHT · ', '')} · {night.scores.length} GAMES</div>
            <h2 className="text-[28px] font-extrabold leading-tight lg:text-[34px]" style={{ color: 'var(--text-bright)', letterSpacing: '-0.03em', textWrap: 'pretty' }}>
              <Link href={night.href}>{night.title}</Link>
            </h2>
            {night.dek && <p className="text-base leading-relaxed" style={{ color: 'var(--text)' }}>{night.dek}</p>}
            <ul className="flex flex-col">
              {coverGames.map(c => (
                <li key={c.id} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
                  <Link href={c.href} className="flex min-h-[52px] flex-wrap items-center gap-x-3 gap-y-0.5 py-2 hover:opacity-80">
                    <span className="min-w-[112px] text-xs font-bold" style={{ ...MONO, color: 'var(--text-bright)' }}>{c.score.replace(' – ', '–')}</span>
                    <span className="min-w-0 flex-1 text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{c.title}</span>
                    {c.star && <span className="text-xs" style={{ color: 'var(--text)' }}>★ {c.star.name} {c.star.line}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={night.href} className="mt-auto text-xs font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 0.5 }}>READ THE NIGHT →</Link>
          </div>
        </article>
      )}

      {weeks.map(w => (
        <section key={w.title} className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3 border-b pb-2.5" style={{ borderColor: 'var(--border-soft)' }}>
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-bright)', letterSpacing: '-0.02em' }}>{w.title}</h2>
            <span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{w.nights.length} night{w.nights.length === 1 ? '' : 's'}</span>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {w.nights.map(n => <NightTile key={n.date} n={n} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
