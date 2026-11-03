// Everything the nation page shows, from the NHL API: the rosters (who is
// Czech), each player's game log (last night, form), the score feed (scores
// and goal clips) and the schedule (tonight). Only Heat comes from our own
// rankings, which every page already shares — so the page adds no database load.
import { fetchRankings } from '@/lib/data';
import { todayET } from '@/lib/home';
import { gameGoals, withClips, type Moment } from '@/lib/moments';
import { currentSeason, getScore, getSchedule } from '@/lib/nhl-api';
import { TEAMS } from '@/lib/team-colors';
import { gameUrl, playerUrl } from '@/lib/urls';
import type { PlayerRowData } from '@/lib/player-row';
import {
  GOALIE_MIN_GP, czechGoal, goalieForm, goalieLeague, median, nightSummary, rankOf, skaterLeague, goalieLine, goalieRow, nationPlayers, nightLabel, pointsPhrase, pragueTime,
  skaterForm, skaterLine, skaterRow, type LogGame, type Nation, type NationPlayer,
} from '@/lib/nations';

const BASE = 'https://api-web.nhle.com/v1';

// The NHL API answers a burst of 50 calls with 429s: a second try after a
// pause, and never more than a few calls at once (pool()). Null = we don't know.
async function nhl<T>(path: string, revalidate: number): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(8_000) });
      if (res.ok) return (await res.json()) as T;
      if (res.status !== 429) return null;
    } catch {
      return null;
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return null;
}

async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

export type NightPlayer = { name: string; href: string; phrase: string; line: string; points: number; goals: Moment[] };
export type NightGame = {
  href: string; away: string; home: string; awayScore: number; homeScore: number; suffix: string;
  players: NightPlayer[];
};
export type TonightGame = {
  href: string; away: string; home: string; time: string | null; derby: boolean;
  awayPlayers: string[]; homePlayers: string[];
};
export type NationData = {
  count: number;
  partial: boolean;      // some players' NHL data didn't load: they're left out, not called idle
  night: { label: string; games: NightGame[]; idle: string[]; scratched: string[]; summary: string } | null;
  goals: Moment[];
  skaters: PlayerRowData[];
  goalies: PlayerRowData[];
  notPlayed: string[];
  league: { leader: { name: string; heat: number } | null; medianHeat: number | null; skaters: number; goalieAvg: number | null };
  tonight: { label: string; games: TonightGame[] } | null;
};

const MAX_GOALS = 9;

// Season totals for the whole league (NHL stats API): where each of them
// stands among everyone, not just among themselves.
type SeasonSkater = { playerId: number; points: number };
type SeasonGoalie = { playerId: number; gamesPlayed: number; saves: number; shotsAgainst: number; savePct: number };
async function seasonTable<T>(kind: 'skater' | 'goalie', season: string): Promise<T[]> {
  try {
    const url = `https://api.nhle.com/stats/rest/en/${kind}/summary?limit=-1&cayenneExp=seasonId=${season}%20and%20gameTypeId=2`;
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8_000) });
    return res.ok ? ((await res.json()) as { data?: T[] }).data ?? [] : [];
  } catch {
    return [];
  }
}

export async function fetchNationData(n: Nation): Promise<NationData> {
  // Rosters change by trades and call-ups: a day's cache.
  // Season paths, not /now: /now answers with a redirect, a second call.
  const season = currentSeason();
  const rosters = await pool(Object.keys(TEAMS), 4, async team => ({ team, roster: await nhl(`/roster/${team}/${season}`, 86_400) }));
  const players = nationPlayers(rosters, n);
  const hrefOf = (p: NationPlayer) => playerUrl(p.id, p.slugFirst, p.slugLast);

  const [fetched, rankings, seasonSkaters, seasonGoalies] = await Promise.all([
    pool(players, 4, p => nhl<{ gameLog?: LogGame[] }>(`/player/${p.id}/game-log/${season}/2`, 1800).then(r => r ? r.gameLog ?? [] : null)),
    fetchRankings().catch(() => null),
    seasonTable<SeasonSkater>('skater', season),
    seasonTable<SeasonGoalie>('goalie', season),
  ]);
  const partial = fetched.some(l => l == null) || rosters.some(r => r.roster == null);
  // Players whose log didn't load are left out of everything below.
  const known = players.filter((_, i) => fetched[i] != null);
  const logs = fetched.filter((l): l is LogGame[] => l != null);
  const logOf = new Map(known.map((p, i) => [p.id, logs[i]]));
  const byId = new Map(players.map(p => [p.id, p]));
  const heatBy = rankings?.heatByPlayer ?? {};

  const dates = [...new Set(logs.flatMap(l => l.map(g => g.gameDate)))].sort().reverse();
  const latest = dates[0] ?? null;
  // Past nights' feeds don't change: an hour's cache; the latest one refreshes like the homepage's.
  const feeds = await Promise.all(dates.slice(0, 3).map((d, i) => getScore(d, i === 0 ? 1800 : 3600).catch(() => ({ games: [] }))));

  // Their goals over the last few nights, newest first, each with its clip —
  // shown as a strip and beside the scorer's line in last night's results.
  const found: Moment[] = [];
  for (const feed of feeds) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const g of (feed.games ?? []) as any[]) {
      for (const m of gameGoals(feed, g.id, heatBy)) {
        const p = byId.get(m.playerId);
        if (p) found.push(czechGoal(m, p.name));
      }
    }
  }
  const goals = await withClips(found);

  let night: NationData['night'] = null;
  if (latest) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feedGames = (feeds[0]?.games ?? []) as any[];
    const played = new Set(feedGames.flatMap(g => [g.awayTeam?.abbrev, g.homeTeam?.abbrev]));
    const byGame = new Map<number, NightPlayer[]>();
    const idle: string[] = [], scratched: string[] = [];
    for (const p of known) {
      const g = logOf.get(p.id)?.[0];
      if (!g || g.gameDate !== latest) { (played.has(p.team) ? scratched : idle).push(p.name); continue; }
      const mine = goals.filter(m => m.playerId === p.id && m.gameId === g.gameId);
      const row: NightPlayer = p.goalie
        ? { name: p.name, href: hrefOf(p), phrase: '', line: goalieLine(g), points: -1, goals: [] }
        : { name: p.name, href: hrefOf(p), phrase: pointsPhrase(g.goals, g.assists), line: skaterLine(g), points: g.goals * 10 + g.assists, goals: mine };
      byGame.set(g.gameId, [...(byGame.get(g.gameId) ?? []), row]);
    }
    const games: NightGame[] = [...byGame].map(([id, rows]) => {
      const f = feedGames.find(x => x.id === id);
      const away = f?.awayTeam?.abbrev ?? '', home = f?.homeTeam?.abbrev ?? '';
      const last = f?.gameOutcome?.lastPeriodType;
      return {
        href: gameUrl(id, away, home, latest), away, home,
        awayScore: f?.awayTeam?.score ?? 0, homeScore: f?.homeTeam?.score ?? 0,
        suffix: last === 'OT' ? 'PP' : last === 'SO' ? 'SN' : '',
        players: rows.sort((a, b) => b.points - a.points),
      };
    }).sort((a, b) => Math.max(...b.players.map(p => p.points)) - Math.max(...a.players.map(p => p.points)));
    night = { label: nightLabel(latest), games, idle, scratched, summary: nightSummary(nightLabel(latest), games.flatMap(g => g.players)) };
  }

  // The league around them: Heat rank among every skater, season points rank,
  // and goalies' season save % among those with enough games to count.
  const heats = Object.values(heatBy);
  const points = seasonSkaters.map(s => s.points);
  const pointsBy = new Map(seasonSkaters.map(s => [s.playerId, s.points]));
  const qualified = seasonGoalies.filter(g => g.gamesPlayed >= GOALIE_MIN_GP);
  const goalieBy = new Map(seasonGoalies.map(g => [g.playerId, g]));
  const shots = seasonGoalies.reduce((s, g) => s + g.shotsAgainst, 0);
  const top = rankings?.momentumLeaders?.skaters?.[0];

  // Form: every skater by Heat; goalies by save % over their last five starts.
  const formed = known.filter(p => !p.goalie && (logOf.get(p.id)?.length ?? 0) > 0)
    .map(p => ({ p, f: skaterForm(logOf.get(p.id)!, heatBy[p.id]) }))
    .sort((a, b) => b.f.heat - a.f.heat || b.f.goals + b.f.assists - a.f.goals - a.f.assists);
  const goalieForms = known.filter(p => p.goalie).map(p => ({ p, f: goalieForm(logOf.get(p.id) ?? []) }))
    .filter(x => x.f.starts > 0)
    .sort((a, b) => (b.f.svPct ?? 0) - (a.f.svPct ?? 0));
  const notPlayed = known.filter(p => (logOf.get(p.id)?.length ?? 0) === 0).map(p => p.name);

  return {
    count: players.length,
    partial,
    night,
    goals: goals.slice(0, MAX_GOALS),
    skaters: formed.map(({ p, f }, i) => skaterRow(p, hrefOf(p), f, i + 1, skaterLeague(
      heatBy[p.id] != null ? { rank: rankOf(heats, heatBy[p.id]), of: heats.length } : null,
      pointsBy.has(p.id) ? { points: pointsBy.get(p.id)!, rank: rankOf(points, pointsBy.get(p.id)!) } : null,
    ))),
    goalies: goalieForms.map(({ p, f }, i) => {
      const s = goalieBy.get(p.id);
      return goalieRow(p, hrefOf(p), f, i + 1, goalieLeague(s ? {
        svPct: s.savePct, games: s.gamesPlayed,
        rank: s.gamesPlayed >= GOALIE_MIN_GP ? rankOf(qualified.map(g => g.savePct), s.savePct) : null, of: qualified.length,
      } : null));
    }),
    notPlayed,
    league: {
      leader: top ? { name: `${top.players?.first_name ?? ''} ${top.players?.last_name ?? ''}`.trim(), heat: heatBy[top.player_id] ?? 0 } : null,
      medianHeat: median(heats),
      skaters: heats.length,
      goalieAvg: shots > 0 ? seasonGoalies.reduce((s, g) => s + g.saves, 0) / shots : null,
    },
    tonight: await tonightGames(n, players),
  };
}

// The next day with a game that has one of them in it — usually tonight.
async function tonightGames(n: Nation, players: NationPlayer[]): Promise<NationData['tonight']> {
  const today = todayET();
  const week = await getSchedule(today).catch(() => null);
  const onTeam = (t: string) => players.filter(p => p.team === t).map(p => p.last);
  for (const day of week?.gameWeek ?? []) {
    if (day.date < today) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games = (day.games as any[]).filter(g => onTeam(g.awayTeam?.abbrev).length || onTeam(g.homeTeam?.abbrev).length);
    if (!games.length) continue;
    return {
      label: day.date === today ? 'dnes v noci' : nightLabel(day.date),
      games: games.map(g => {
        const away = g.awayTeam.abbrev, home = g.homeTeam.abbrev;
        const awayPlayers = onTeam(away), homePlayers = onTeam(home);
        return {
          href: gameUrl(g.id, away, home, day.date), away, home, time: pragueTime(g.startTimeUTC ?? null, n),
          derby: awayPlayers.length > 0 && homePlayers.length > 0, awayPlayers, homePlayers,
        };
      }).sort((a, b) => Number(b.derby) - Number(a.derby)),
    };
  }
  return null;
}
