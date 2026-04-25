import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchRecap, fetchRecapData, teamLogoUrl } from '@/lib/data';
import { recapUrl, gameUrl, playerUrl, teamUrl } from '@/lib/urls';

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
      title: `${recap.title} — Hockey Momentum`,
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

// ─── Player mention data ──────────────────────────────────────────────────────

interface PlayerMentionData {
  href: string;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
  headshotUrl: string | null;
  teamAbbrev: string;
  surge: number | null; // momentum % above/below season
}

// Inline player chip — headshot, name, team only
function PlayerMentionCard({ data, word }: { data: PlayerMentionData; word: string }) {
  return (
    <a href={data.href} className="player-mention-card">
      {data.headshotUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.headshotUrl} alt={word} className="player-mention-headshot" />
      )}
      <span className="player-mention-name">{word}</span>
      <span className="player-mention-team">{data.teamAbbrev}</span>
    </a>
  );
}

// ─── Linkify text ─────────────────────────────────────────────────────────────

// Replaces player full/last names with PlayerMentionCard and team abbrevs with links.
function linkifyText(
  text: string,
  playerData: Map<string, PlayerMentionData>,
  teamLinks: Map<string, string>,
): React.ReactNode[] {
  const abbrevs = [...teamLinks.keys()].map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const names   = [...playerData.keys()].map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!abbrevs.length && !names.length) return [text];

  // Sort longest first to prefer full-name matches over last-name-only
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
    const pData = playerData.get(word.toLowerCase());
    const tHref = teamLinks.get(word.toUpperCase());

    if (pData) {
      parts.push(
        <PlayerMentionCard key={match.index} data={pData} word={word} />
      );
    } else if (tHref) {
      parts.push(
        <a key={match.index} href={tHref} className="recap-inline-link">
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
      sections.push({
        type: 'section',
        header,
        bodies: [],
        awayAbbrev: gameMatch?.[1],
        homeAbbrev: gameMatch?.[2],
      });
    } else if (sections.length > 0 && sections[sections.length - 1].type === 'section') {
      // All paragraphs until the next ### belong to the current section
      sections[sections.length - 1].bodies.push(block);
    } else {
      sections.push({ type: 'paragraph', bodies: [block] });
    }
  }

  return sections;
}

// ─── Game card ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCell({ label, away, home }: { label: string; away: string | number; home: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <div className="flex items-center gap-3 w-full justify-between">
        <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-bright)' }}>{away}</span>
        <span className="text-xs font-medium" style={{ color: 'var(--silver)', opacity: 0.6 }}>{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-bright)' }}>{home}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GameCard({ game, pred, gUrl }: { game: any; pred: any; gUrl: string }) {
  const awayWon = (game.away_score ?? 0) > (game.home_score ?? 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outcome = Array.isArray(pred?.prediction_outcomes) ? (pred.prediction_outcomes as any[])[0] : pred?.prediction_outcomes;
  const correctWinner: boolean | null = outcome?.correct_winner ?? null;
  const homeWinProb: number | null = pred?.home_win_probability ?? null;
  const pickedHome = homeWinProb != null ? homeWinProb >= 0.5 : null;
  const pickedAbbrev = pickedHome === true ? game.home_team?.abbrev : pickedHome === false ? game.away_team?.abbrev : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamStats: any[] = game.team_game_stats ?? [];
  const stat = (cat: string) => teamStats.find((s) => s.category === cat);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const threeStars: any[] = game.three_stars ?? [];

  // Venue + game time
  const venue: string | null = game.venue ?? null;
  const gameTime: string | null = game.start_time_utc
    ? new Date(game.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'
    : null;

  const sog = stat('sog');
  const fo = stat('faceoffWins');
  const pp = stat('powerPlay');
  const pim = stat('pim');
  const hits = stat('hits');
  const blocks = stat('blockedShots');
  const gva = stat('giveaways');
  const tka = stat('takeaways');

  const hasStats = sog || fo || pp || pim || hits || blocks;

  return (
    <div className="rounded-2xl border overflow-hidden mb-6"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

      {/* Headline — team names + score */}
      <Link href={gUrl} className="block px-5 pt-5 pb-4 hover:opacity-90 transition-opacity">
        {/* Teams row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Away */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamLogoUrl(game.away_team?.abbrev ?? '')} alt={game.away_team?.abbrev}
              className="w-12 h-12 flex-shrink-0 drop-shadow-lg" />
            <span className="text-xl font-black leading-tight truncate"
              style={{ color: awayWon ? 'var(--text-bright)' : 'var(--text)', opacity: awayWon ? 1 : 0.5 }}>
              {game.away_team?.name ?? game.away_team?.abbrev}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 flex-shrink-0 px-2">
            <span className="text-4xl font-black font-mono leading-none tabular-nums"
              style={{ color: awayWon ? 'var(--text-bright)' : 'var(--text)', opacity: awayWon ? 1 : 0.35 }}>
              {game.away_score}
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--text)', opacity: 0.2 }}>–</span>
            <span className="text-4xl font-black font-mono leading-none tabular-nums"
              style={{ color: !awayWon ? 'var(--text-bright)' : 'var(--text)', opacity: !awayWon ? 1 : 0.35 }}>
              {game.home_score}
            </span>
          </div>

          {/* Home */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <span className="text-xl font-black leading-tight truncate text-right"
              style={{ color: !awayWon ? 'var(--text-bright)' : 'var(--text)', opacity: !awayWon ? 1 : 0.5 }}>
              {game.home_team?.name ?? game.home_team?.abbrev}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamLogoUrl(game.home_team?.abbrev ?? '')} alt={game.home_team?.abbrev}
              className="w-12 h-12 flex-shrink-0 drop-shadow-lg" />
          </div>
        </div>

        {/* Venue + time */}
        {(venue || gameTime) && (
          <div className="text-center text-xs" style={{ color: 'var(--silver)', opacity: 0.5 }}>
            {[venue, gameTime].filter(Boolean).join(' · ')}
          </div>
        )}
      </Link>

      {/* Prediction row */}
      {(pickedAbbrev !== null || correctWinner !== null) && (
        <div className="flex items-center justify-between px-5 py-2 gap-3"
          style={{ borderTop: '1px solid var(--border)' }}>
          {pickedAbbrev && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.5 }}>Picked:</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamLogoUrl(pickedAbbrev)} alt={pickedAbbrev} className="w-4 h-4" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>{pickedAbbrev}</span>
              {homeWinProb != null && (
                <span className="text-xs ml-1" style={{ color: 'var(--text)', opacity: 0.5 }}>
                  ({pickedHome ? (homeWinProb * 100).toFixed(0) : ((1 - homeWinProb) * 100).toFixed(0)}%)
                </span>
              )}
            </div>
          )}
          {correctWinner !== null && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-sm font-bold" style={{ color: correctWinner ? 'var(--green)' : 'var(--red)' }}>
                {correctWinner ? '✓' : '✗'}
              </span>
              <span className="text-xs font-semibold" style={{ color: correctWinner ? 'var(--green)' : 'var(--red)' }}>
                {correctWinner ? 'Correct' : 'Wrong'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stats grid */}
      {hasStats && (
        <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          {sog && <StatCell label="Shots" away={sog.awayValue} home={sog.homeValue} />}
          {fo && <StatCell label="Faceoffs" away={fo.awayValue} home={fo.homeValue} />}
          {pp && <StatCell label="Power Play" away={pp.awayValue} home={pp.homeValue} />}
          {pim && <StatCell label="PIM" away={pim.awayValue} home={pim.homeValue} />}
          {hits && <StatCell label="Hits" away={hits.awayValue} home={hits.homeValue} />}
          {blocks && <StatCell label="Blocks" away={blocks.awayValue} home={blocks.homeValue} />}
          {gva && <StatCell label="Giveaways" away={gva.awayValue} home={gva.homeValue} />}
          {tka && <StatCell label="Takeaways" away={tka.awayValue} home={tka.homeValue} />}
        </div>
      )}

      {/* Three stars */}
      {threeStars.length > 0 && (
        <div className="px-4 py-3 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          {threeStars.map((star) => (
            <a
              key={star.star}
              href={star.playerId ? `/players/${star.playerId}` : '#'}
              className="flex flex-col items-center gap-1 flex-1 rounded-xl p-2 hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className="text-xs font-mono" style={{ color: 'var(--amber)' }}>#{star.star}</span>
              {star.headshot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={star.headshot} alt={star.name?.default ?? ''} className="w-10 h-10 rounded-full object-cover" />
              )}
              <span className="text-xs font-semibold text-center leading-tight" style={{ color: 'var(--text-bright)' }}>
                {star.name?.default ?? ''}
              </span>
              <span className="text-xs text-center" style={{ color: 'var(--text)', opacity: 0.7 }}>
                {star.position === 'G'
                  ? `${star.savePctg !== undefined ? (star.savePctg * 100).toFixed(1) + '% SV' : 'Goalie'}`
                  : `${star.points ?? 0}pts (${star.goals ?? 0}G ${star.assists ?? 0}A)`}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* YouTube highlight */}
      {game.youtube_highlight_id && (
        <div style={{ borderTop: '1px solid var(--border)', aspectRatio: '16/9' }}>
          <iframe
            src={`https://www.youtube.com/embed/${game.youtube_highlight_id}?rel=0&modestbranding=1`}
            title={`${game.away_team?.abbrev} @ ${game.home_team?.abbrev} highlights`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            style={{ border: 'none', display: 'block' }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // Build game lookup: "AWAY:HOME" → game object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameByTeams = new Map<string, any>();
  for (const g of games) {
    const key = `${g.away_team?.abbrev}:${g.home_team?.abbrev}`;
    gameByTeams.set(key, g);
  }

  // Build player data map — keyed by full name (lowercase) AND last name (lowercase)
  const playerData = new Map<string, PlayerMentionData>();
  for (const p of topPerformers) {
    if (!p.player_id || !p.players?.last_name) continue;
    const snap = p.snapshot;
    const surge = snap?.momentum_ppm && snap?.season_ppm && snap.season_ppm > 0
      ? ((snap.momentum_ppm - snap.season_ppm) / snap.season_ppm * 100)
      : null;
    const data: PlayerMentionData = {
      href: playerUrl(p.player_id, p.players.first_name ?? '', p.players.last_name),
      firstName: p.players.first_name ?? '',
      lastName: p.players.last_name,
      goals: p.goals ?? 0,
      assists: p.assists ?? 0,
      headshotUrl: p.players.headshot_url ?? null,
      teamAbbrev: p.teams?.abbrev ?? '',
      surge,
    };
    // Full name key (primary match for AI-generated text with full names)
    const fullName = `${p.players.first_name ?? ''} ${p.players.last_name}`.trim().toLowerCase();
    if (fullName) playerData.set(fullName, data);
    // Last name key (fallback for older articles or when AI uses last name only)
    playerData.set(p.players.last_name.toLowerCase(), data);
  }

  // Build team abbrev → teamUrl map
  const teamLinks = new Map<string, string>();
  for (const g of games) {
    if (g.away_team?.id && g.away_team?.abbrev)
      teamLinks.set(g.away_team.abbrev, teamUrl(g.away_team.id, g.away_team.name ?? g.away_team.abbrev));
    if (g.home_team?.id && g.home_team?.abbrev)
      teamLinks.set(g.home_team.abbrev, teamUrl(g.home_team.id, g.home_team.name ?? g.home_team.abbrev));
  }

  const sections = parseArticle(recap.content);

  // Find first game section — used for hero overlay
  const firstGameSection = sections.find(s => s.type === 'section' && s.awayAbbrev && s.homeAbbrev);
  const featuredGame = firstGameSection
    ? gameByTeams.get(`${firstGameSection.awayAbbrev}:${firstGameSection.homeAbbrev}`)
    : games[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: recap.title,
    description: recap.summary,
    datePublished: recap.generated_at,
    dateModified: recap.generated_at,
    ...(recap.hero_image_url && { image: recap.hero_image_url }),
    author: { '@type': 'Organization', name: 'Hockey Momentum' },
    publisher: {
      '@type': 'Organization',
      name: 'Hockey Momentum',
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
            <span>Hockey Momentum</span>
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

        {/* Hero image — tied to the featured game (first game section in article) */}
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
          {featuredGame && (
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamLogoUrl(featuredGame.away_team?.abbrev ?? '')} alt={featuredGame.away_team?.abbrev} className="w-10 h-10 drop-shadow-lg" />
              <span className="text-lg font-black font-mono" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                {featuredGame.away_score} – {featuredGame.home_score}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamLogoUrl(featuredGame.home_team?.abbrev ?? '')} alt={featuredGame.home_team?.abbrev} className="w-10 h-10 drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* Article body */}
        <article className="mb-10">
          {sections.map((section, i) => {
            if (section.type === 'paragraph') {
              return section.bodies.map((body, bi) => (
                <p key={`${i}-${bi}`} className="text-sm leading-relaxed mb-5"
                  style={{ color: i === 0 && bi === 0 ? 'var(--text-bright)' : 'var(--text)' }}>
                  {linkifyText(body, playerData, teamLinks)}
                </p>
              ));
            }

            const isGameSection = !!(section.awayAbbrev && section.homeAbbrev);
            const gameKey = isGameSection ? `${section.awayAbbrev}:${section.homeAbbrev}` : null;
            const game = gameKey ? gameByTeams.get(gameKey) : null;
            const pred = game ? raw?.predMap?.get(game.id) : null;
            const gUrl = game
              ? gameUrl(game.id, game.away_team?.abbrev ?? '', game.home_team?.abbrev ?? '', game.game_date)
              : '#';

            return (
              <div key={i} className="mb-12">
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.25rem' }}>
                  {!isGameSection && (
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-bright)' }}>
                      {section.header}
                    </h2>
                  )}
                </div>

                {/* 1. GameCard first — acts as the section headline */}
                {isGameSection && game && (
                  <GameCard game={game} pred={pred} gUrl={gUrl} />
                )}
                {isGameSection && !game && (
                  <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-bright)' }}>
                    {section.header}
                  </h2>
                )}

                {/* 2. Prose paragraphs below the card */}
                {section.bodies.map((body, bi) => (
                  <p key={bi} className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
                    {linkifyText(body, playerData, teamLinks)}
                  </p>
                ))}
              </div>
            );
          })}
        </article>

        {/* Top performers of the day */}
        {topPerformers.length > 0 && (
          <div className="rounded-xl border p-4 mb-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--neon)' }}>
              Top performers of the day
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
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    {/* Rank */}
                    <span className="text-xs font-mono font-bold w-4 text-center flex-shrink-0"
                      style={{ color: 'var(--neon)' }}>{i + 1}</span>

                    {/* Headshot */}
                    {p.players?.headshot_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.players.headshot_url}
                        alt={`${p.players?.first_name} ${p.players?.last_name}`}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        style={{ border: '2px solid var(--border)' }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '2px solid var(--border)' }}>
                        {p.players?.first_name?.[0]}{p.players?.last_name?.[0]}
                      </div>
                    )}

                    {/* Name + team */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={playerUrl(p.player_id, p.players?.first_name ?? '', p.players?.last_name ?? '')}
                          className="text-sm font-semibold hover:underline leading-tight"
                          style={{ color: 'var(--text-bright)' }}>
                          {p.players?.first_name} {p.players?.last_name}
                        </Link>
                        <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.5 }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--text)' }}>{p.players?.position_code}</span>
                      </div>
                      {/* Team with logo */}
                      <div className="flex items-center gap-1 mt-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={teamLogoUrl(p.teams?.abbrev ?? '')} alt={p.teams?.abbrev ?? ''} className="w-3.5 h-3.5" />
                        {p.teams?.id ? (
                          <Link
                            href={teamUrl(p.teams.id, p.teams.name ?? p.teams.abbrev)}
                            className="text-xs hover:underline"
                            style={{ color: 'var(--neon)' }}>
                            {p.teams?.abbrev}
                          </Link>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text)' }}>{p.teams?.abbrev}</span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-mono font-semibold" style={{ color: 'var(--neon)' }}>
                        {p.goals}G {p.assists}A
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text)' }}>
                        {pts}pts {sign(p.plus_minus ?? 0)}
                      </div>
                      {surge !== null && (
                        <div className="text-xs mt-0.5"
                          style={{ color: surge > 10 ? 'var(--heat)' : surge < -10 ? 'var(--silver)' : 'var(--text)' }}>
                          {surge > 0 ? '↑' : '↓'}{Math.abs(surge).toFixed(0)}% momentum
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
