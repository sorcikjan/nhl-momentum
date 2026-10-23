import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { playerUrl, teamUrl, gameUrl, recapUrl } from '@/lib/urls';
import { pageAll, regularSeasonGameIdRange } from '@/lib/data';
import { SITE_URL } from '@/lib/site';
import { todayET } from '@/lib/home';
import { predictionSitemapDates } from '@/lib/seo';

const base = SITE_URL;

// Rebuilt hourly so new games, recaps and roster moves reach crawlers without a deploy.
export const revalidate = 3600;

const dateOnly = (d: string | null | undefined) => (d ? new Date(d).toISOString() : undefined);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();
  const today = todayET();

  // Static pages
  const statics: MetadataRoute.Sitemap = [
    { url: base,                   lastModified: now, changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${base}/hot`,          lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/rankings`,     lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/games`,        lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/predictions`,  lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/recaps`,       lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/welcome`,      changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/accuracy`,     lastModified: now, changeFrequency: 'daily',   priority: 0.5 },
    ...predictionSitemapDates(today).map(d => ({ url: `${base}/predictions/${d}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 })),
  ];

  const [start, end] = regularSeasonGameIdRange(new Date());
  const weekAhead = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  // A deploy during a database outage ships the static entries; ISR refills the
  // rest within the hour. At runtime a failure throws, keeping the last sitemap.
  const orEmpty = <T,>(p: Promise<T[]>) => p.catch(err => {
    if (process.env.NEXT_PHASE === 'phase-production-build') return [] as T[];
    throw err;
  });
  const [{ data: teams }, players, games, { data: recaps }] = await Promise.all([
    supabaseAdmin.from('teams').select('id, name'),
    // Every active player — each profile is a landing page for "[name] stats".
    orEmpty(pageAll<{ id: number; first_name: string | null; last_name: string | null }>((f, t) => supabaseAdmin
      .from('players').select('id, first_name, last_name').eq('is_active', true).order('id').range(f, t))),
    // This regular season up to a week ahead (further-out games have nothing to show yet).
    orEmpty(pageAll<{ id: number; game_date: string; away_team_id: number; home_team_id: number; away_team: unknown; home_team: unknown }>((f, t) => supabaseAdmin
      .from('games')
      .select(`
        id, game_date, away_team_id, home_team_id,
        away_team:teams!games_away_team_id_fkey ( abbrev ),
        home_team:teams!games_home_team_id_fkey ( abbrev )
      `)
      .gte('id', start).lt('id', end).lte('game_date', weekAhead)
      .order('id').range(f, t))),
    supabaseAdmin.from('daily_recaps').select('date, title, generated_at').order('date', { ascending: false }).limit(1000),
  ]);

  // The teams table also holds defunct franchises (Nordiques, Seals…) and placeholders.
  const seasonTeams = new Set(games.flatMap(g => [g.away_team_id, g.home_team_id]));
  const teamEntries: MetadataRoute.Sitemap = (teams ?? []).filter(t => seasonTeams.has(t.id)).map(t => ({
    url: `${base}${teamUrl(t.id, t.name)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const playerEntries: MetadataRoute.Sitemap = players
    .filter(p => p.first_name && p.last_name)
    .map(p => ({
      url: `${base}${playerUrl(p.id, p.first_name!, p.last_name!)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    }));

  const gameEntries: MetadataRoute.Sitemap = games.map(g => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const away = (g.away_team as any)?.abbrev ?? 'away';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const home = (g.home_team as any)?.abbrev ?? 'home';
    return {
      url: `${base}${gameUrl(g.id, away, home, g.game_date)}`,
      lastModified: g.game_date < today ? dateOnly(`${g.game_date}T12:00:00Z`) : now,
      changeFrequency: g.game_date < today ? 'weekly' : 'hourly',
      priority: 0.6,
    };
  });

  const recapEntries: MetadataRoute.Sitemap = (recaps ?? [])
    .filter(r => r.date && r.title)
    .map(r => ({
      url: `${base}${recapUrl(r.date, r.title)}`,
      lastModified: dateOnly(r.generated_at) ?? now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [...statics, ...teamEntries, ...playerEntries, ...gameEntries, ...recapEntries];
}
