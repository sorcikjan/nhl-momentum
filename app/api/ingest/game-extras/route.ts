import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGameLanding, getGameRightRail } from '@/lib/nhl-api';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/game-extras?days=14&offset=0&limit=20
//
// For each recently completed game, backfills:
//   - three_stars + team_game_stats  (from NHL API landing + right-rail)
//   - youtube_highlight_id           (from YouTube Data API v3 — NHL channel search)
//
// Safe to re-run: only fetches what is still null. Skips YouTube search for games
// less than 20 hours old (NHL posts highlights ~12-18h after puck drop).

// Nickname lookup — used to build the YouTube search query.
// NHL titles use the team nickname, not the city (e.g. "Devils vs. Bruins").
const TEAM_NICKNAMES: Record<string, string> = {
  ANA: 'Ducks',         ARI: 'Coyotes',       BOS: 'Bruins',        BUF: 'Sabres',
  CAR: 'Hurricanes',    CBJ: 'Blue Jackets',   CGY: 'Flames',        CHI: 'Blackhawks',
  COL: 'Avalanche',     DAL: 'Stars',          DET: 'Red Wings',     EDM: 'Oilers',
  FLA: 'Panthers',      LAK: 'Kings',          MIN: 'Wild',          MTL: 'Canadiens',
  NJD: 'Devils',        NSH: 'Predators',      NYI: 'Islanders',     NYR: 'Rangers',
  OTT: 'Senators',      PHI: 'Flyers',         PIT: 'Penguins',      SEA: 'Kraken',
  SJS: 'Sharks',        STL: 'Blues',          TBL: 'Lightning',     TOR: 'Maple Leafs',
  UTA: 'Mammoth',       VAN: 'Canucks',        VGK: 'Golden Knights', WPG: 'Jets',
  WSH: 'Capitals',
};

const NHL_CHANNEL_ID = 'UCqFMzb-4AUf6WAIbl132QKA';

async function findHighlightVideo(
  awayAbbrev: string,
  homeAbbrev: string,
  gameDate: string,   // YYYY-MM-DD
  apiKey: string,
): Promise<string | null> {
  const awayNick = TEAM_NICKNAMES[awayAbbrev] ?? awayAbbrev;
  const homeNick = TEAM_NICKNAMES[homeAbbrev] ?? homeAbbrev;

  // Format date as "April 14" for the search query
  const dateObj = new Date(`${gameDate}T12:00:00Z`);
  const monthName = dateObj.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = dateObj.getUTCDate();
  const year = dateObj.getUTCFullYear();
  const dateStr = `${monthName} ${day}`;

  // NHL posts highlights same calendar day (US time) = up to ~20h after game end
  // Search window: game date through 3 days later to handle any posting lag
  const after  = `${gameDate}T00:00:00Z`;
  const before = new Date(new Date(`${gameDate}T00:00:00Z`).getTime() + 3 * 86400000).toISOString();

  const q = encodeURIComponent(`${awayNick} ${homeNick} NHL Highlights ${dateStr} ${year}`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${NHL_CHANNEL_ID}&q=${q}&type=video&order=relevance&publishedAfter=${after}&publishedBefore=${before}&maxResults=5&key=${apiKey}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = data.items ?? [];

    // Prefer a video whose title contains both team nicknames + "Highlights"
    const match = items.find(item => {
      const t = item.snippet.title.toLowerCase();
      return t.includes('highlight') &&
        (t.includes(awayNick.toLowerCase()) || t.includes(homeNick.toLowerCase()));
    }) ?? items[0];

    return match?.id?.videoId ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const days   = Math.min(60, Math.max(1, Number(req.nextUrl.searchParams.get('days')   ?? '14')));
  const offset = Math.max(0,  Number(req.nextUrl.searchParams.get('offset') ?? '0'));
  const limit  = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get('limit')  ?? '20')));

  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  // Don't search YouTube for games from the last 20 hours — highlights may not be posted yet
  const youtubeEligibleBefore = new Date(Date.now() - 20 * 3600000).toISOString().slice(0, 10);

  const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? '';

  // Fetch completed games that are missing three_stars OR youtube_highlight_id
  const { data: games, error: gErr } = await supabaseAdmin
    .from('games')
    .select(`
      id, game_date,
      home_team:teams!games_home_team_id_fkey ( abbrev ),
      away_team:teams!games_away_team_id_fkey ( abbrev ),
      three_stars, youtube_highlight_id
    `)
    .in('game_state', ['FINAL', 'OFF'])
    .gte('game_date', since)
    .or('three_stars.is.null,youtube_highlight_id.is.null')
    .order('game_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (gErr) return NextResponse.json({ data: null, error: gErr.message }, { status: 500 });

  let extrasUpdated = 0;
  let youtubeFound = 0;
  const errors: string[] = [];

  await Promise.all((games ?? []).map(async game => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awayAbbrev: string = (game.away_team as any)?.abbrev ?? '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const homeAbbrev: string = (game.home_team as any)?.abbrev ?? '';

      // Fetch NHL API data only if three_stars is missing
      let threeStars    = game.three_stars    ?? null;
      let teamGameStats = null;
      if (!game.three_stars) {
        const [landing, rail] = await Promise.all([
          getGameLanding(game.id).catch(() => null),
          getGameRightRail(game.id).catch(() => null),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        threeStars    = (landing as any)?.summary?.threeStars ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teamGameStats = (rail    as any)?.teamGameStats       ?? null;
      }

      // Search YouTube only if video is missing and game is old enough
      let youtubeId = game.youtube_highlight_id ?? null;
      if (!youtubeId && youtubeApiKey && game.game_date <= youtubeEligibleBefore && awayAbbrev && homeAbbrev) {
        youtubeId = await findHighlightVideo(awayAbbrev, homeAbbrev, game.game_date, youtubeApiKey);
        if (youtubeId) youtubeFound++;
      }

      // Only write to DB if something changed
      if (!threeStars && !teamGameStats && !youtubeId) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const update: any = {};
      if (threeStars)    update.three_stars      = threeStars;
      if (teamGameStats) update.team_game_stats   = teamGameStats;
      if (youtubeId)     update.youtube_highlight_id = youtubeId;

      const { error } = await supabaseAdmin.from('games').update(update).eq('id', game.id);
      if (error) errors.push(`game ${game.id}: ${error.message}`);
      else extrasUpdated++;
    } catch (e) {
      errors.push(`game ${game.id}: ${(e as Error).message}`);
    }
  }));

  return NextResponse.json({
    data: { updated: extrasUpdated, youtubeFound, processed: (games ?? []).length, offset, errors },
    error: errors.length > 0 ? `${errors.length} errors` : null,
  });
}
