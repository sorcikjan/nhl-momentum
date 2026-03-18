import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { playerUrl, teamUrl, gameUrl } from '@/lib/urls';

const base = 'https://nhl-momentum.netlify.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static pages
  const statics: MetadataRoute.Sitemap = [
    { url: base,                   lastModified: now, changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${base}/rankings`,     lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/games`,        lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/teams`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/accuracy`,     lastModified: now, changeFrequency: 'daily',   priority: 0.6 },
  ];

  // Teams
  const { data: teams } = await supabaseAdmin
    .from('teams')
    .select('id, name');
  const teamEntries: MetadataRoute.Sitemap = (teams ?? []).map(t => ({
    url: `${base}${teamUrl(t.id, t.name)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Players (top 200 by momentum rank)
  const { data: players } = await supabaseAdmin
    .from('player_metric_snapshots')
    .select('player_id, players!inner(first_name, last_name)')
    .order('momentum_rank', { ascending: true })
    .limit(200);

  const seenPlayers = new Set<number>();
  const playerEntries: MetadataRoute.Sitemap = [];
  for (const p of players ?? []) {
    if (seenPlayers.has(p.player_id)) continue;
    seenPlayers.add(p.player_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pl = p.players as any;
    if (!pl?.first_name || !pl?.last_name) continue;
    playerEntries.push({
      url: `${base}${playerUrl(p.player_id, pl.first_name, pl.last_name)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  // Recent and upcoming games (last 30 days)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: games } = await supabaseAdmin
    .from('games')
    .select(`
      id, game_date,
      away_team:teams!games_away_team_id_fkey ( abbrev ),
      home_team:teams!games_home_team_id_fkey ( abbrev )
    `)
    .gte('game_date', cutoff)
    .order('game_date', { ascending: false })
    .limit(200);

  const gameEntries: MetadataRoute.Sitemap = (games ?? []).map(g => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const away = (g.away_team as any)?.abbrev ?? 'away';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const home = (g.home_team as any)?.abbrev ?? 'home';
    return {
      url: `${base}${gameUrl(g.id, away, home, g.game_date)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    };
  });

  return [...statics, ...teamEntries, ...playerEntries, ...gameEntries];
}
