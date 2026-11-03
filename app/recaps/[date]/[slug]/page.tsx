import type { Metadata } from 'next';
import { img } from '@/lib/img';
import { SHARE_IMAGE } from '@/lib/seo';
import React, { cache, Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchFinishedGamesBetween, fetchGameStoriesByDate, fetchRecap, fetchRecapData } from '@/lib/data';
import { coverUrl, featuredGameId, type FinishedGame } from '@/lib/stories';
import { recapUrl, gameUrl, playerUrl, teamUrl } from '@/lib/urls';
import { SITE_URL } from '@/lib/site';
import { assertDatabaseUp, databaseDown } from '@/lib/supabase';
import { PlayerList, ScoreRow, SectionHeading, SectionLink, TeamChip } from '@/components/ds';
import { BestGoals } from '@/components/home/BestGoals';
import { bestGoals, withClips, type Moment } from '@/lib/moments';
import { getScore } from '@/lib/nhl-api';
import { ppmToHeat } from '@/lib/heat';
import { posLabel, type PlayerRowData } from '@/lib/player-row';

export const revalidate = 3600;

// Render on first visit, then serve from the ISR cache for `revalidate` seconds.
// Without this, a dynamic-segment page is rendered on every request.
export function generateStaticParams() {
  return [];
}

// Deduplicate fetchRecap between generateMetadata and the page component.
const cachedFetchRecap = cache((date: string) => fetchRecap(date).catch(() => null));
// The night's cover: the cover of the game the recap is about.
const cachedCover = cache(async (date: string, heroImageUrl: string | null) => {
  const games = await fetchFinishedGamesBetween(date, date).catch(() => []);
  const id = featuredGameId(heroImageUrl, games as FinishedGame[]);
  return id ? coverUrl(id) : null;
});

export async function generateMetadata(
  { params }: { params: Promise<{ date: string; slug: string }> }
): Promise<Metadata> {
  const { date } = await params;
  const recap = await cachedFetchRecap(date);
  if (!recap) return { title: 'NHL Recap' };

  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const canonical = `${SITE_URL}${recapUrl(date, recap.title)}`;
  const cover = await cachedCover(date, recap.hero_image_url ?? null);

  return {
    title: recap.title,
    description: recap.summary ?? `NHL recap for ${dateLabel} — top performers, momentum analytics, and prediction results.`,
    alternates: { canonical },
    openGraph: {
      title: `${recap.title} — momentum.`,
      description: recap.summary ?? undefined,
      type: 'article',
      publishedTime: recap.generated_at,
      images: cover ? [{ url: `${SITE_URL}${cover}`, width: 1200, height: 675, alt: recap.title }] : [SHARE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: recap.title,
      description: recap.summary ?? undefined,
      images: [cover ? `${SITE_URL}${cover}` : SHARE_IMAGE.url],
    },
  };
}

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// ─── Linkify text ─────────────────────────────────────────────────────────────

// Player names and team abbrevs in the prose become quiet links.
function linkifyText(text: string, playerLinks: Map<string, string>, teamLinks: Map<string, string>): React.ReactNode[] {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keys = [...teamLinks.keys(), ...playerLinks.keys()].map(esc);
  if (!keys.length) return [text];
  // Longest first, so a full name wins over a last name alone.
  const regex = new RegExp(`\\b(${keys.sort((a, b) => b.length - a.length).join('|')})\\b`, 'gi');
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const word = match[0];
    const href = playerLinks.get(word.toLowerCase()) ?? teamLinks.get(word.toUpperCase());
    parts.push(href ? <Link key={match.index} href={href} className="recap-inline-link">{word}</Link> : word);
    last = match.index + word.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ─── Article parser ───────────────────────────────────────────────────────────

interface ArticleSection {
  type: 'paragraph' | 'section';
  header?: string;
  bodies: string[];  // paragraph-type: [text]; section-type: [p1, p2, ...]
  awayAbbrev?: string;
  homeAbbrev?: string;
}

function parseArticle(content: string): ArticleSection[] {
  const blocks = content.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
  const sections: ArticleSection[] = [];
  for (const block of blocks) {
    if (block.startsWith('### ')) {
      const header = block.replace(/^###\s+/, '').trim();
      const gameMatch = header.match(/^([A-Z]{2,4})\s+\d+\s*@\s*([A-Z]{2,4})\s+\d+/);
      sections.push({ type: 'section', header, bodies: [], awayAbbrev: gameMatch?.[1], homeAbbrev: gameMatch?.[2] });
    } else if (sections.length > 0 && sections[sections.length - 1].type === 'section') {
      // All paragraphs until the next ### belong to the current section
      sections[sections.length - 1].bodies.push(block);
    } else {
      sections.push({ type: 'paragraph', bodies: [block] });
    }
  }
  return sections;
}

// ─── Game result card ─────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function Side({ abbrev, name, score, won }: { abbrev: string; name: string; score: number; won: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TeamChip abbrev={abbrev} size={34} />
      <span className="min-w-0 flex-1 truncate text-[15px] lg:text-base" style={{ fontWeight: won ? 800 : 600, color: won ? 'var(--text-bright)' : 'var(--text-muted)' }}>{name}</span>
      <span className="text-[28px] font-extrabold leading-none" style={{ ...MONO, color: won ? 'var(--text-bright)' : 'var(--text-muted)' }}>{score}</span>
    </div>
  );
}

// The result the section is about, as on the game cards: both teams and the
// score, our pick and how it went, the three stars. The whole card opens the game.
function ResultCard({ game, pred, href }: { game: any; pred: any; href: string }) {
  const as = game.away_score ?? 0, hs = game.home_score ?? 0;
  const outcome = Array.isArray(pred?.prediction_outcomes) ? pred.prediction_outcomes[0] : pred?.prediction_outcomes;
  const hit: boolean | null = outcome?.correct_winner ?? null;
  const homeProb: number | null = pred?.home_win_probability ?? null;
  const pick = homeProb == null ? null : homeProb >= 0.5
    ? { abbrev: game.home_team?.abbrev, pct: Math.round(homeProb * 100) }
    : { abbrev: game.away_team?.abbrev, pct: Math.round((1 - homeProb) * 100) };
  const stars: any[] = game.three_stars ?? [];
  const starLine = (s: any) => s.position === 'G'
    ? (s.savePctg != null ? `${(s.savePctg * 100).toFixed(1)} SV%` : 'G')
    : `${s.goals ?? 0}G ${s.assists ?? 0}A`;
  const lastName = (s: any) => String(s.name?.default ?? '').replace(/^\S+\.\s*/, '');
  return (
    <Link href={href} className="block rounded-[14px] border px-4 pb-3.5 pt-3 transition-colors hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="mb-2.5 text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.8 }}>FINAL</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-4">
        <Side abbrev={game.away_team?.abbrev ?? ''} name={game.away_team?.name ?? game.away_team?.abbrev ?? ''} score={as} won={as > hs} />
        <Side abbrev={game.home_team?.abbrev ?? ''} name={game.home_team?.name ?? game.home_team?.abbrev ?? ''} score={hs} won={hs > as} />
      </div>
      {(pick || stars.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t pt-2.5 text-[10px] font-bold" style={{ ...MONO, borderColor: 'var(--border-soft)', letterSpacing: 0.8 }}>
          {pick && hit != null ? (
            <span style={{ color: hit ? 'var(--rise)' : 'var(--cold)' }}>
              {hit ? '✓ PICK HIT' : '✗ PICK MISS'} <span style={{ color: 'var(--text-muted)' }}>· {pick.abbrev} {pick.pct}%</span>
            </span>
          ) : <span />}
          {stars.length > 0 && (
            <span className="flex flex-wrap gap-x-3 gap-y-1" style={{ color: 'var(--text)' }}>
              {stars.map(s => (
                <span key={s.star}><span style={{ color: s.star === 1 ? 'var(--heat)' : 'var(--text-muted)' }}>★{s.star}</span> {lastName(s).toUpperCase()} {starLine(s)}</span>
              ))}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

// ─── Article body (streaming) ─────────────────────────────────────────────────

async function ArticleBody({ date, content, dek, cover, title }: { date: string; content: string; dek: string | null; cover: string | null; title: string }) {
  const [raw, gameStories, moments] = await Promise.all([
    fetchRecapData(date).catch(() => null),
    fetchGameStoriesByDate(date).catch(() => new Map<number, { headline: string; dek: string }>()),
    // The night's best goals: one NHL call, cached; nothing on failure.
    getScore(date).then(feed => withClips(bestGoals(feed))).catch(() => [] as Moment[]),
  ]);

  const games = (raw?.games ?? []) as any[];
  const topPerformers = (raw?.topPerformers ?? []) as any[];
  const gameHref = (g: any) => gameUrl(g.id, g.away_team?.abbrev ?? '', g.home_team?.abbrev ?? '', g.game_date);
  const gameByTeams = new Map<string, any>(games.map(g => [`${g.away_team?.abbrev}:${g.home_team?.abbrev}`, g]));

  // Player links keyed by full name and by last name (lowercase); team links by abbrev.
  const playerLinks = new Map<string, string>();
  for (const p of topPerformers) {
    if (!p.player_id || !p.players?.last_name) continue;
    const href = playerUrl(p.player_id, p.players.first_name ?? '', p.players.last_name);
    playerLinks.set(`${p.players.first_name ?? ''} ${p.players.last_name}`.trim().toLowerCase(), href);
    playerLinks.set(p.players.last_name.toLowerCase(), href);
  }
  const teamLinks = new Map<string, string>();
  for (const g of games) for (const t of [g.away_team, g.home_team]) {
    if (t?.id && t?.abbrev) teamLinks.set(t.abbrev, teamUrl(t.id, t.name ?? t.abbrev));
  }

  const performers: PlayerRowData[] = topPerformers.slice(0, 6).map((p, i) => {
    const heat = p.snapshot?.momentum_ppm != null ? ppmToHeat(p.snapshot.momentum_ppm) : null;
    return {
      playerId: p.player_id, href: playerUrl(p.player_id, p.players?.first_name ?? '', p.players?.last_name ?? ''),
      name: `${p.players?.first_name ?? ''} ${p.players?.last_name ?? ''}`.trim(), photo: p.players?.headshot_url ?? null,
      team: p.teams?.abbrev ?? '', mark: String(i + 1), markTone: null, pos: posLabel(p.players?.position_code),
      l5: `${p.goals ?? 0}G ${p.assists ?? 0}A tonight`, chip: null,
      value: heat == null ? '—' : String(heat), valueHeat: heat,
    };
  });

  const sections = parseArticle(content);
  const prose = 'text-[15px] leading-[1.7]';

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <article className="flex min-w-0 flex-col gap-5">
        {/* The night's cover: the game the headline is about */}
        {cover && (
          <div className="relative mb-2 w-full overflow-hidden rounded-[18px] border" style={{ aspectRatio: '16/9', background: 'var(--bg-raised)', borderColor: 'var(--border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(cover, 860)} alt={title} className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        {dek && <p className="text-base font-semibold leading-relaxed lg:text-lg" style={{ color: 'var(--text-bright)' }}>{dek}</p>}
        {sections.filter(s => s.type === 'paragraph').map((s, i) => (
          <p key={i} className={prose} style={{ color: 'var(--text)' }}>{linkifyText(s.bodies[0], playerLinks, teamLinks)}</p>
        ))}

        {moments.length >= 2 && (
          <section className="my-3"><BestGoals moments={moments} heading="BEST GOALS OF THE NIGHT" cols={Math.min(3, moments.length)} /></section>
        )}

        {sections.map((section, i) => {
          if (section.type !== 'section') return null;
          const game = section.awayAbbrev ? gameByTeams.get(`${section.awayAbbrev}:${section.homeAbbrev}`) : null;
          const story = game ? gameStories.get(game.id) : undefined;
          const href = game ? gameHref(game) : null;
          // A game section reads under the game's own headline; other sections under theirs.
          const title = game
            ? story?.headline ?? `${game.away_team?.name ?? section.awayAbbrev} ${game.away_score}, ${game.home_team?.name ?? section.homeAbbrev} ${game.home_score}`
            : section.header;
          return (
            <section key={i} className="mt-6 flex flex-col gap-4 border-t pt-7" style={{ borderColor: 'var(--border-soft)' }}>
              <SectionHeading kicker={game ? `${section.awayAbbrev} @ ${section.homeAbbrev}` : 'THE NIGHT'} title={title} />
              {game && href && <ResultCard game={game} pred={raw?.predMap?.get(game.id)} href={href} />}
              {section.bodies.map((body, bi) => (
                <p key={bi} className={prose} style={{ color: 'var(--text)' }}>{linkifyText(body, playerLinks, teamLinks)}</p>
              ))}
              {game && href && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold" style={{ ...MONO, letterSpacing: 0.5 }}>
                  <Link href={`${href}#story`} style={{ color: 'var(--heat)' }}>{story ? 'READ THE GAME STORY →' : 'THE GAME →'}</Link>
                  <Link href={`${href}#goals`} style={{ color: 'var(--text-bright)' }}>▶ WATCH EVERY GOAL</Link>
                </div>
              )}
            </section>
          );
        })}
      </article>

      <aside className="flex min-w-0 flex-col gap-8">
        {games.length > 0 && (
          <section>
            <SectionHeading kicker={`EVERY SCORE · ${games.length} GAME${games.length === 1 ? '' : 'S'}`} title="The scoreboard." />
            <div className="flex flex-col gap-2">
              {games.map(g => (
                <Link key={g.id} href={gameHref(g)} className="block transition-opacity hover:opacity-80">
                  <ScoreRow away={g.away_team?.abbrev ?? ''} home={g.home_team?.abbrev ?? ''} awayScore={g.away_score} homeScore={g.home_score} status="FINAL" />
                </Link>
              ))}
            </div>
          </section>
        )}
        {performers.length > 0 && (
          <section>
            <SectionHeading kicker="TOP PERFORMERS · HEAT" title="Who carried the night." />
            <PlayerList rows={performers} />
          </section>
        )}
        <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
          <SectionLink href="/recaps">All nights</SectionLink>
          <SectionLink href="/">Today</SectionLink>
        </div>
      </aside>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function ArticleSkeleton() {
  return (
    <div className="flex flex-col gap-3 lg:max-w-[calc(100%-380px)]">
      <div className="mb-4 w-full animate-pulse rounded-[18px]" style={{ aspectRatio: '16/9', background: 'var(--bg-card)' }} />
      {[100, 100, 82, 100, 67].map((w, i) => (
        <div key={i} className="h-4 animate-pulse rounded" style={{ background: 'var(--border)', width: `${w}%` }} />
      ))}
      <div className="mt-6 animate-pulse rounded-[14px]" style={{ height: 120, background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RecapSlugPage({ params }: { params: Promise<{ date: string; slug: string }> }) {
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const recap = await cachedFetchRecap(date);
  if (!recap) { if (databaseDown()) throw new Error('Database unavailable'); notFound(); }

  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

  const cover = await cachedCover(date, recap.hero_image_url ?? null);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: recap.title,
    description: recap.summary,
    datePublished: recap.generated_at,
    dateModified: recap.generated_at,
    ...(cover && { image: `${SITE_URL}${cover}` }),
    author: { '@type': 'Organization', name: 'momentum.', url: `${SITE_URL}/about` },
    publisher: { '@type': 'Organization', name: 'momentum.', url: SITE_URL },
  };

  const cleanTitle = recap.title.replace(/^NHL Recap[^:]*:\s*/i, '');
  const published = recap.generated_at
    ? new Date(recap.generated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex flex-col gap-8 pb-20 lg:pb-0">
        <header className="max-w-[860px]">
          <SectionHeading
            as="h1"
            size="page"
            kicker={<><Link href="/recaps">STORIES</Link> <span style={{ color: 'var(--text-muted)' }}>·</span> <span style={{ color: 'var(--text-bright)' }}>THE NIGHT · {dateLabel.toUpperCase()}</span></>}
            title={cleanTitle}
            sub={<span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{[recap.games_count != null ? `${recap.games_count} GAMES` : null, 'momentum.', published].filter(Boolean).join(' · ')}</span>}
          />
        </header>

        {/* Cover, article, game cards, scoreboard, top performers — stream in while fetchRecapData resolves */}
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleBody date={date} content={recap.content} dek={recap.summary ?? null} cover={cover} title={cleanTitle} />
        </Suspense>
      </div>
    </>
  );
}
