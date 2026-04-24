import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchRecap, fetchRecapData, teamLogoUrl } from '@/lib/data';
import { recapUrl, gameUrl } from '@/lib/urls';

export const revalidate = 3600;


export async function generateMetadata(
  { params }: { params: Promise<{ date: string; slug: string }> }
): Promise<Metadata> {
  const { date } = await params;
  const recap = await fetchRecap(date).catch(() => null);
  if (!recap) return { title: 'NHL Recap' };

  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const canonical = `https://nhl-momentum.netlify.app${recapUrl(date, recap.title)}`;

  return {
    title: recap.title,
    description: recap.summary ?? `NHL recap for ${dateLabel} — top performers, momentum analytics, and prediction results.`,
    alternates: { canonical },
    openGraph: {
      title: `${recap.title} — NHL Momentum`,
      description: recap.summary ?? undefined,
      type: 'article',
      publishedTime: recap.generated_at,
      ...(recap.hero_image_url && { images: [{ url: recap.hero_image_url, width: 1200, height: 500, alt: recap.title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: recap.title,
      description: recap.summary ?? undefined,
      ...(recap.hero_image_url && { images: [recap.hero_image_url] }),
    },
  };
}

// Linkify plain text: replace player last names and team abbreviations with anchor tags.
// Returns an array of strings and <a> elements for use in JSX.
function linkifyText(
  text: string,
  playerLinks: Map<string, string>,  // lastName (lower) → href
  teamLinks: Map<string, string>,    // abbrev (upper) → href
): React.ReactNode[] {
  // Build a combined regex: team abbrevs (word-boundary) | player last names (word-boundary)
  const abbrevs = [...teamLinks.keys()].map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const names   = [...playerLinks.keys()].map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!abbrevs.length && !names.length) return [text];

  // Match longest first to avoid partial matches
  const pattern = [...abbrevs, ...names]
    .sort((a, b) => b.length - a.length)
    .join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const word = match[0];
    const href = teamLinks.get(word.toUpperCase()) ?? playerLinks.get(word.toLowerCase());
    if (href) {
      parts.push(
        <a key={match.index} href={href}
          style={{ color: 'var(--neon)', textDecoration: 'none', borderBottom: '1px solid rgba(99,202,183,0.3)' }}
          onMouseOver={e => (e.currentTarget.style.borderBottomColor = 'var(--neon)')}
          onMouseOut={e => (e.currentTarget.style.borderBottomColor = 'rgba(99,202,183,0.3)')}>
          {word}
        </a>
      );
    } else {
      parts.push(word);
    }
    last = match.index + word.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// Parse article content into sections.
// Sections starting with "### " become headers; the rest are paragraphs.
interface ArticleSection {
  type: 'paragraph' | 'section';
  header?: string;
  body: string;
  // Parsed from "### MTL 4 @ TBL 2" headers
  awayAbbrev?: string;
  homeAbbrev?: string;
}

function parseArticle(content: string): ArticleSection[] {
  const blocks = content.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
  const sections: ArticleSection[] = [];

  for (const block of blocks) {
    if (block.startsWith('### ')) {
      const header = block.replace(/^###\s+/, '').trim();
      // Match "MTL 4 @ TBL 2" or "MTL 4 @ TBL 2 — subtitle"
      const gameMatch = header.match(/^([A-Z]{2,4})\s+\d+\s*@\s*([A-Z]{2,4})\s+\d+/);
      sections.push({
        type: 'section',
        header,
        body: '',
        awayAbbrev: gameMatch?.[1],
        homeAbbrev: gameMatch?.[2],
      });
    } else if (sections.length > 0 && sections[sections.length - 1].type === 'section' && !sections[sections.length - 1].body) {
      // Body paragraph immediately following a section header
      sections[sections.length - 1].body = block;
    } else {
      sections.push({ type: 'paragraph', body: block });
    }
  }

  return sections;
}

export default async function RecapSlugPage({ params }: { params: Promise<{ date: string; slug: string }> }) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const [recap, raw] = await Promise.all([
    fetchRecap(date).catch(() => null),
    fetchRecapData(date).catch(() => null),
  ]);

  if (!recap) notFound();

  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const games = (raw?.games ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPerformers = (raw?.topPerformers ?? []) as any[];

  // Build a lookup: "AWAY:HOME" → game object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameByTeams = new Map<string, any>();
  for (const g of games) {
    const key = `${g.away_team?.abbrev}:${g.home_team?.abbrev}`;
    gameByTeams.set(key, g);
  }

  // Build player last-name → playerUrl map (for article body linkification)
  const playerLinks = new Map<string, string>();
  for (const p of topPerformers) {
    if (p.player_id && p.players?.last_name) {
      playerLinks.set(
        p.players.last_name.toLowerCase(),
        playerUrl(p.player_id, p.players.first_name ?? '', p.players.last_name)
      );
    }
  }

  // Build team abbrev → teamUrl map from games data
  const teamLinks = new Map<string, string>();
  for (const g of games) {
    if (g.away_team?.id && g.away_team?.abbrev)
      teamLinks.set(g.away_team.abbrev, teamUrl(g.away_team.id, g.away_team.name ?? g.away_team.abbrev));
    if (g.home_team?.id && g.home_team?.abbrev)
      teamLinks.set(g.home_team.abbrev, teamUrl(g.home_team.id, g.home_team.name ?? g.home_team.abbrev));
  }

  const sections = parseArticle(recap.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: recap.title,
    description: recap.summary,
    datePublished: recap.generated_at,
    dateModified: recap.generated_at,
    ...(recap.hero_image_url && { image: recap.hero_image_url }),
    author: { '@type': 'Organization', name: 'NHL Momentum' },
    publisher: {
      '@type': 'Organization',
      name: 'NHL Momentum',
      url: 'https://nhl-momentum.netlify.app',
    },
  };

  const cleanTitle = recap.title.replace(/^NHL Recap[^:]*:\s*/i, '');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto pb-20 md:pb-0">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text)' }}>
          <Link href="/recaps" className="hover:underline" style={{ color: 'var(--neon)' }}>
            Recaps
          </Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>{dateLabel}</span>
        </div>

        {/* Article header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--neon)' }}>
            NHL Recap · {dateLabel}
          </p>
          <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3" style={{ color: 'var(--text-bright)' }}>
            {cleanTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--text)' }}>
            {recap.games_count != null && <span>{recap.games_count} games</span>}
            <span style={{ opacity: 0.4 }}>·</span>
            <span>NHL Momentum Analytics</span>
            {recap.generated_at && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>
                  {new Date(recap.generated_at).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Hero image */}
        <div className="relative w-full rounded-xl overflow-hidden mb-8"
          style={{ aspectRatio: '12/5', background: 'linear-gradient(135deg, #0d1117 0%, #1a1f35 100%)' }}>
          {recap.hero_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recap.hero_image_url}
              alt={cleanTitle}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.3) 100%)' }} />
          {/* Featured game logos */}
          {games.length > 0 && (() => {
            const featured = games[0];
            return (
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamLogoUrl(featured.away_team?.abbrev ?? '')} alt={featured.away_team?.abbrev} className="w-10 h-10 drop-shadow-lg" />
                <span className="text-lg font-black font-mono" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  {featured.away_score} – {featured.home_score}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamLogoUrl(featured.home_team?.abbrev ?? '')} alt={featured.home_team?.abbrev} className="w-10 h-10 drop-shadow-lg" />
              </div>
            );
          })()}
        </div>

        {/* Score grid */}
        {games.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10">
            {games.map((g) => {
              const awayWon = (g.away_score ?? 0) > (g.home_score ?? 0);
              const pred = raw?.predMap?.get(g.id);
              const homeWinProb = pred?.home_win_probability;
              const ytId = g.youtube_highlight_id as string | null;
              const gUrl = gameUrl(g.id, g.away_team?.abbrev ?? '', g.home_team?.abbrev ?? '', g.game_date);
              return (
                <div key={g.id} className="rounded-xl border flex flex-col overflow-hidden"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <Link href={gUrl} className="p-3 hover:opacity-80 transition-opacity flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={teamLogoUrl(g.away_team?.abbrev ?? '')} alt={g.away_team?.abbrev} className="w-5 h-5 flex-shrink-0" />
                        <span className="text-xs font-semibold"
                          style={{ color: awayWon ? 'var(--text-bright)' : 'var(--text)', fontWeight: awayWon ? 700 : 400 }}>
                          {g.away_team?.abbrev}
                        </span>
                        <span className="text-sm font-mono font-bold ml-auto"
                          style={{ color: awayWon ? 'var(--text-bright)' : 'var(--text)' }}>
                          {g.away_score}
                        </span>
                      </div>
                      <span className="text-xs mx-0.5" style={{ color: 'var(--text)', opacity: 0.3 }}>–</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-mono font-bold mr-auto"
                          style={{ color: !awayWon ? 'var(--text-bright)' : 'var(--text)' }}>
                          {g.home_score}
                        </span>
                        <span className="text-xs font-semibold"
                          style={{ color: !awayWon ? 'var(--text-bright)' : 'var(--text)', fontWeight: !awayWon ? 700 : 400 }}>
                          {g.home_team?.abbrev}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={teamLogoUrl(g.home_team?.abbrev ?? '')} alt={g.home_team?.abbrev} className="w-5 h-5 flex-shrink-0" />
                      </div>
                    </div>
                    {homeWinProb != null && (
                      <div className="mt-1.5 text-xs text-center" style={{ color: 'var(--text)', opacity: 0.5 }}>
                        Model gave {!awayWon ? g.home_team?.abbrev : g.away_team?.abbrev}{' '}
                        {!awayWon ? (homeWinProb * 100).toFixed(0) : ((1 - homeWinProb) * 100).toFixed(0)}%
                      </div>
                    )}
                  </Link>
                  {ytId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${ytId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold hover:opacity-80 transition-opacity"
                      style={{ borderTop: '1px solid var(--border)', color: 'var(--neon)' }}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Watch Highlights
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Article body — structured sections */}
        <article className="mb-10">
          {sections.map((section, i) => {
            if (section.type === 'paragraph') {
              return (
                <p key={i} className="text-sm leading-relaxed mb-5"
                  style={{ color: i === 0 ? 'var(--text-bright)' : 'var(--text)' }}>
                  {linkifyText(section.body, playerLinks, teamLinks)}
                </p>
              );
            }

            // Section with header
            const isGameSection = !!(section.awayAbbrev && section.homeAbbrev);
            const gameKey = isGameSection ? `${section.awayAbbrev}:${section.homeAbbrev}` : null;
            const game = gameKey ? gameByTeams.get(gameKey) : null;
            const ytId = game?.youtube_highlight_id as string | null | undefined;

            return (
              <div key={i} className="mb-8">
                {/* Section divider + header */}
                <div className="flex items-center gap-3 mb-3"
                  style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  {isGameSection && game && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={teamLogoUrl(game.away_team?.abbrev ?? '')} alt="" className="w-5 h-5 flex-shrink-0" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={teamLogoUrl(game.home_team?.abbrev ?? '')} alt="" className="w-5 h-5 flex-shrink-0" />
                    </>
                  )}
                  <h2 className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>
                    {section.header}
                  </h2>
                </div>

                {/* YouTube embed for game sections */}
                {ytId && (
                  <div className="rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                      title={`${section.header} highlights`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                )}

                {section.body && (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                    {linkifyText(section.body, playerLinks, teamLinks)}
                  </p>
                )}
              </div>
            );
          })}
        </article>

        {/* Top performers */}
        {topPerformers.length > 0 && (
          <div className="rounded-xl border p-4 mb-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--neon)' }}>
              Top Performers
            </h2>
            <div className="flex flex-col gap-2">
              {topPerformers.slice(0, 6).map((p, i: number) => {
                const pts = (p.goals ?? 0) + (p.assists ?? 0);
                const sign = (n: number) => n >= 0 ? `+${n}` : String(n);
                const snap = p.snapshot;
                const surge = snap?.momentum_ppm && snap?.season_ppm && snap.season_ppm > 0
                  ? ((snap.momentum_ppm - snap.season_ppm) / snap.season_ppm * 100)
                  : null;
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold w-4 text-center" style={{ color: 'var(--neon)' }}>{i + 1}</span>
                      <div>
                        <Link
                          href={playerUrl(p.player_id, p.players?.first_name ?? '', p.players?.last_name ?? '')}
                          className="text-sm font-medium hover:underline"
                          style={{ color: 'var(--text-bright)' }}>
                          {p.players?.first_name} {p.players?.last_name}
                        </Link>
                        {p.teams?.id ? (
                          <Link
                            href={teamUrl(p.teams.id, p.teams.name ?? p.teams.abbrev)}
                            className="text-xs ml-1.5 hover:underline"
                            style={{ color: 'var(--neon)' }}>
                            {p.teams?.abbrev}
                          </Link>
                        ) : (
                          <span className="text-xs ml-1.5" style={{ color: 'var(--text)' }}>{p.teams?.abbrev}</span>
                        )}
                        <span className="text-xs ml-1" style={{ color: 'var(--text)' }}>· {p.players?.position_code}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-semibold" style={{ color: 'var(--neon)' }}>
                        {p.goals}G {p.assists}A
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--text)' }}>
                        {pts}pts {sign(p.plus_minus ?? 0)}
                      </span>
                      {surge !== null && (
                        <div className="text-xs mt-0.5" style={{ color: surge > 10 ? 'var(--amber)' : 'var(--text)' }}>
                          {surge > 0 ? '↑' : '↓'} {Math.abs(surge).toFixed(0)}% momentum
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <Link href="/recaps" className="text-xs hover:underline" style={{ color: 'var(--neon)' }}>
            ← All recaps
          </Link>
          <Link href="/" className="text-xs hover:underline" style={{ color: 'var(--text)' }}>
            Today&apos;s dashboard →
          </Link>
        </div>

      </div>
    </>
  );
}
