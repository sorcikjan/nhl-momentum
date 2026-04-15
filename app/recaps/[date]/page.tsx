import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchRecap, fetchRecapData, teamLogoUrl } from '@/lib/data';

export const revalidate = 3600;

export async function generateMetadata(
  { params }: { params: Promise<{ date: string }> }
): Promise<Metadata> {
  const { date } = await params;
  const recap = await fetchRecap(date).catch(() => null);
  if (!recap) return { title: 'NHL Recap' };

  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return {
    title: recap.title,
    description: recap.summary ?? `NHL recap for ${dateLabel} — top performers, momentum analytics, and prediction results.`,
    openGraph: {
      title: `${recap.title} — NHL Momentum`,
      description: recap.summary ?? undefined,
      type: 'article',
      publishedTime: recap.generated_at,
    },
    twitter: {
      card: 'summary',
      title: recap.title,
      description: recap.summary ?? undefined,
    },
  };
}

export default async function RecapPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const [recap, raw] = await Promise.all([
    fetchRecap(date).catch(() => null),
    fetchRecapData(date).catch(() => null),
  ]);

  if (!recap) notFound();

  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const paragraphs = recap.content
    .split(/\n\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const games = (raw?.games ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPerformers = (raw?.topPerformers ?? []) as any[];

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: recap.title,
    description: recap.summary,
    datePublished: recap.generated_at,
    dateModified: recap.generated_at,
    author: { '@type': 'Organization', name: 'NHL Momentum' },
    publisher: {
      '@type': 'Organization',
      name: 'NHL Momentum',
      url: 'https://nhl-momentum.netlify.app',
    },
  };

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
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--neon)' }}>
            NHL Recap
          </p>
          <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3"
            style={{ color: 'var(--text-bright)' }}>
            {recap.title.replace(/^NHL Recap[^:]*:\s*/i, '')}
          </h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
            <span>{dateLabel}</span>
            {recap.games_count != null && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{recap.games_count} games</span>
              </>
            )}
            <span style={{ opacity: 0.4 }}>·</span>
            <span>NHL Momentum Analytics</span>
          </div>
        </div>

        {/* Score cards */}
        {games.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
            {games.map((g) => {
              const awayWon = (g.away_score ?? 0) > (g.home_score ?? 0);
              const pred = raw?.predMap?.get(g.id);
              const homeWinProb = pred?.home_win_probability;
              return (
                <Link key={g.id} href={`/games/${g.id}`}
                  className="rounded-xl border p-3 hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between gap-1">
                    {/* Away */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={teamLogoUrl(g.away_team?.abbrev ?? '')}
                        alt={g.away_team?.abbrev}
                        className="w-5 h-5 flex-shrink-0"
                      />
                      <span className="text-xs font-semibold"
                        style={{ color: awayWon ? 'var(--text-bright)' : 'var(--text)', fontWeight: awayWon ? 700 : 400 }}>
                        {g.away_team?.abbrev}
                      </span>
                      <span className="text-sm font-mono font-bold ml-auto"
                        style={{ color: awayWon ? 'var(--text-bright)' : 'var(--text)' }}>
                        {g.away_score}
                      </span>
                    </div>
                    <span className="text-xs mx-1" style={{ color: 'var(--text)', opacity: 0.3 }}>–</span>
                    {/* Home */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-mono font-bold mr-auto"
                        style={{ color: !awayWon ? 'var(--text-bright)' : 'var(--text)' }}>
                        {g.home_score}
                      </span>
                      <span className="text-xs font-semibold"
                        style={{ color: !awayWon ? 'var(--text-bright)' : 'var(--text)', fontWeight: !awayWon ? 700 : 400 }}>
                        {g.home_team?.abbrev}
                      </span>
                      <img
                        src={teamLogoUrl(g.home_team?.abbrev ?? '')}
                        alt={g.home_team?.abbrev}
                        className="w-5 h-5 flex-shrink-0"
                      />
                    </div>
                  </div>
                  {homeWinProb != null && (
                    <div className="mt-2 text-xs text-center" style={{ color: 'var(--text)', opacity: 0.5 }}>
                      Model: {!awayWon ? (homeWinProb * 100).toFixed(0) : ((1 - homeWinProb) * 100).toFixed(0)}% {!awayWon ? g.home_team?.abbrev : g.away_team?.abbrev}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Article body */}
        <article className="mb-10">
          {paragraphs.map((para: string, i: number) => (
            <p key={i} className="text-sm leading-relaxed mb-4"
              style={{ color: i === 0 ? 'var(--text-bright)' : 'var(--text)' }}>
              {para}
            </p>
          ))}
        </article>

        {/* Top performers */}
        {topPerformers.length > 0 && (
          <div className="rounded-xl border p-4 mb-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--neon)' }}>
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
                      <span className="text-xs font-mono font-bold w-4 text-center"
                        style={{ color: 'var(--neon)' }}>{i + 1}</span>
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-bright)' }}>
                          {p.players?.first_name} {p.players?.last_name}
                        </span>
                        <span className="text-xs ml-1.5" style={{ color: 'var(--text)' }}>
                          {p.teams?.abbrev} · {p.players?.position_code}
                        </span>
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
                        <div className="text-xs mt-0.5"
                          style={{ color: surge > 10 ? 'var(--green)' : surge < -10 ? 'var(--red)' : 'var(--text)' }}>
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
        <div className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid var(--border)' }}>
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
