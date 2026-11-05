// Everything a nation page shows, from the NHL API: the rosters (who is
// from where), the score feeds (scores and goal clips), the box scores of the
// games they played (last night), their goalies' game logs (goalie form) and
// the schedule (tonight). Skater form and Heat come from our own rankings,
// which every page already shares — so a page adds no database load, and the
// NHL API sees a few box scores per nation, not a game log per player.
import { fetchRankings } from '@/lib/data';
import { todayET } from '@/lib/home';
import { gameGoals, withClips, type Moment } from '@/lib/moments';
import { currentSeason, getScore, getSchedule } from '@/lib/nhl-api';
import { TEAMS } from '@/lib/team-colors';
import { gameUrl, playerUrl } from '@/lib/urls';
import type { PlayerRowData } from '@/lib/player-row';
import type { Decision } from '@/lib/nation-text';
import {
  GOALIE_MIN_GP, goalieForm, goalieLeague, goalieLine, goalieRow, localGoal, localTime, median, nationPlayers, nightLabel, nightSummary,
  rankOf, skaterLine, skaterRow, type LogGame, type Nation, type NationPlayer,
} from '@/lib/nations';

const BASE = 'https://api-web.nhle.com/v1';

// The NHL API answers a burst of 50 calls with 429s: up to two more tries,
// longer pauses each time, and never more than a few calls at once (pool()).
// Null = we don't know.
async function nhl<T>(path: string, revalidate: number): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(8_000) });
      if (res.ok) return (await res.json()) as T;
      if (res.status !== 429) return null;
    } catch {
      return null;
    }
    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
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
  partial: boolean;      // some NHL data didn't load: those players are left out, not called idle
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
type SeasonSkater = { playerId: number; points: number; gamesPlayed: number };
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

/* eslint-disable @typescript-eslint/no-explicit-any */
type BoxRow = { playerId: number; goals?: number; assists?: number; sog?: number; toi?: string; plusMinus?: number; starter?: boolean; shotsAgainst?: number; goalsAgainst?: number };
const boxRows = (box: any, side: 'awayTeam' | 'homeTeam'): BoxRow[] => {
  const s = box?.playerByGameStats?.[side] ?? {};
  return [...(s.forwards ?? []), ...(s.defense ?? []), ...(s.goalies ?? [])];
};
const isFinal = (g: any) => g?.gameState === 'FINAL' || g?.gameState === 'OFF';
const played = (toi?: string) => !!toi && toi !== '00:00' && toi !== '0:00';

// Shared by every nation page: the league's rosters (a day's cache — trades,
// call-ups) and the last few nights' score feeds.
async function leagueRosters(season: string) {
  // Season paths, not /now: /now answers with a redirect, a second call.
  return pool(Object.keys(TEAMS), 4, async team => ({ team, roster: await nhl<any>(`/roster/${team}/${season}`, 86_400) }));
}

export async function fetchNationData(n: Nation): Promise<NationData> {
  const season = currentSeason();
  const today = todayET();
  const days = [0, 1, 2, 3].map(k => new Date(Date.parse(`${today}T12:00:00Z`) - k * 86_400_000).toISOString().slice(0, 10));
  const [rosters, rankings, seasonSkaters, seasonGoalies, feeds] = await Promise.all([
    leagueRosters(season),
    fetchRankings().catch(() => null),
    seasonTable<SeasonSkater>('skater', season),
    seasonTable<SeasonGoalie>('goalie', season),
    // Today's feed changes all evening; past nights' don't.
    Promise.all(days.map((d, i) => getScore(d, i === 0 ? 900 : 3600).then(f => ({ date: d, games: (f?.games ?? []) as any[], feed: f }), () => ({ date: d, games: [] as any[], feed: null })))),
  ]);
  const players = nationPlayers(rosters, n);
  const hrefOf = (p: NationPlayer) => playerUrl(p.id, p.slugFirst, p.slugLast);
  const byId = new Map(players.map(p => [p.id, p]));
  const teams = new Set(players.map(p => p.team));
  const heatBy = rankings?.heatByPlayer ?? {};
  const formBy = rankings?.formByPlayer ?? {};
  let partial = rosters.some(r => r.roster == null);

  // Nights with finished games, newest first: the latest one is "last night".
  const nights = feeds.filter(f => f.games.some(isFinal));

  // Their goals over the last few nights, newest first, each with its clip —
  // shown as a strip and beside the scorer's line in last night's results.
  const found: Moment[] = [];
  for (const f of nights.slice(0, 3)) {
    for (const g of f.games.filter(isFinal)) {
      for (const m of gameGoals(f.feed ?? {}, g.id, heatBy)) {
        const p = byId.get(m.playerId);
        if (p) found.push(localGoal(m, p.name, n));
      }
    }
  }
  const goals = await withClips(found);

  let night: NationData['night'] = null;
  const latest = nights.find(f => f.games.some(g => isFinal(g) && (teams.has(g.awayTeam?.abbrev) || teams.has(g.homeTeam?.abbrev))));
  if (latest) {
    const label = nightLabel(n, latest.date);
    const mine = latest.games.filter(g => isFinal(g) && (teams.has(g.awayTeam?.abbrev) || teams.has(g.homeTeam?.abbrev)));
    // A finished game's box score never changes: a day's cache.
    const boxes = await pool(mine, 4, g => nhl<any>(`/gamecenter/${g.id}/boxscore`, 86_400));
    const idle: string[] = [], scratched: string[] = [];
    const games: NightGame[] = [];
    const inBox = new Set<string>();
    mine.forEach((g, i) => {
      const box = boxes[i];
      const away = g.awayTeam.abbrev as string, home = g.homeTeam.abbrev as string;
      inBox.add(away); inBox.add(home);
      if (!box) { partial = true; return; }
      const last = g.gameOutcome?.lastPeriodType;
      const rows: NightPlayer[] = [];
      for (const [side, team] of [['awayTeam', away], ['homeTeam', home]] as const) {
        const won = side === 'awayTeam' ? g.awayTeam.score > g.homeTeam.score : g.homeTeam.score > g.awayTeam.score;
        const stats = new Map(boxRows(box, side).map(r => [r.playerId, r]));
        for (const p of players.filter(x => x.team === team)) {
          const r = stats.get(p.id);
          if (!r || !played(r.toi)) { scratched.push(p.name); continue; }
          if (p.goalie) {
            const decision: Decision | null = r.starter ? (won ? 'W' : last === 'OT' || last === 'SO' ? 'O' : 'L') : null;
            rows.push({ name: p.name, href: hrefOf(p), phrase: '', line: goalieLine(n, { decision, started: !!r.starter, shotsAgainst: r.shotsAgainst ?? 0, goalsAgainst: r.goalsAgainst ?? 0 }), points: -1, goals: [] });
          } else {
            const ga = { goals: r.goals ?? 0, assists: r.assists ?? 0 };
            rows.push({
              name: p.name, href: hrefOf(p), phrase: n.t.phrase(ga.goals, ga.assists),
              line: skaterLine(n, { ...ga, shots: r.sog, toi: (r.toi ?? '0:00').replace(/^0(?=\d:)/, ''), plusMinus: r.plusMinus }),
              points: ga.goals * 10 + ga.assists,
              goals: goals.filter(m => m.playerId === p.id && m.gameId === g.id),
            });
          }
        }
      }
      if (rows.length) {
        games.push({
          href: gameUrl(g.id, away, home, latest.date), away, home,
          awayScore: g.awayTeam.score ?? 0, homeScore: g.homeTeam.score ?? 0,
          suffix: last === 'OT' ? n.t.ui.ot : last === 'SO' ? n.t.ui.so : '',
          players: rows.sort((a, b) => b.points - a.points),
        });
      }
    });
    for (const p of players) if (!inBox.has(p.team)) idle.push(p.name);
    games.sort((a, b) => Math.max(...b.players.map(p => p.points)) - Math.max(...a.players.map(p => p.points)));
    night = { label, games, idle, scratched, summary: nightSummary(n, label, games.flatMap(g => g.players)) };
  }

  // Goalie form needs their starts: a game log each — only goalies, a handful per nation.
  const goalies = players.filter(p => p.goalie);
  const goalieLogs = await pool(goalies, 4, p => nhl<{ gameLog?: LogGame[] }>(`/player/${p.id}/game-log/${season}/2`, 1800).then(r => r ? r.gameLog ?? [] : null));
  if (goalieLogs.some(l => l == null)) partial = true;

  // The league around them: Heat rank among every skater, season points rank,
  // and goalies' season save % among those with enough games to count.
  const heats = Object.values(heatBy);
  const points = seasonSkaters.map(s => s.points);
  const pointsBy = new Map(seasonSkaters.map(s => [s.playerId, s.points]));
  const qualified = seasonGoalies.filter(g => g.gamesPlayed >= GOALIE_MIN_GP);
  const goalieBy = new Map(seasonGoalies.map(g => [g.playerId, g]));
  const shots = seasonGoalies.reduce((s, g) => s + g.shotsAgainst, 0);
  const top = rankings?.momentumLeaders?.skaters?.[0];

  // Form: every skater the pipeline has scored, by Heat; goalies by save % over their last five starts.
  const formed = players.filter(p => !p.goalie && formBy[p.id] && heatBy[p.id] != null)
    .map(p => ({ p, f: { ...formBy[p.id], heat: heatBy[p.id] } }))
    .sort((a, b) => b.f.heat - a.f.heat || b.f.goals + b.f.assists - a.f.goals - a.f.assists);
  const goalieForms = goalies.map((p, i) => ({ p, f: goalieForm(goalieLogs[i] ?? []) }))
    .filter(x => x.f.starts > 0)
    .sort((a, b) => (b.f.svPct ?? 0) - (a.f.svPct ?? 0));
  const gamesBy = new Map(seasonSkaters.map(s => [s.playerId, s.gamesPlayed]));
  // Only when the season table answered: a failed fetch mustn't call everyone idle.
  const notPlayed = seasonSkaters.length
    ? players.filter(p => !p.goalie && !formBy[p.id] && !gamesBy.get(p.id)).map(p => p.name)
      .concat(goalies.filter((p, i) => goalieLogs[i] != null && goalieLogs[i]!.length === 0).map(p => p.name))
    : [];

  return {
    count: players.length,
    partial,
    night,
    goals: goals.slice(0, MAX_GOALS),
    skaters: formed.map(({ p, f }, i) => skaterRow(n, p, hrefOf(p), f, i + 1, n.t.skaterLeague(
      { rank: rankOf(heats, f.heat), of: heats.length },
      pointsBy.has(p.id) ? { points: pointsBy.get(p.id)!, rank: rankOf(points, pointsBy.get(p.id)!) } : null,
    ))),
    goalies: goalieForms.map(({ p, f }, i) => {
      const s = goalieBy.get(p.id);
      return goalieRow(n, p, hrefOf(p), f, i + 1, goalieLeague(n, s ? {
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
// A derby has them on both benches; for the big nations, with dozens in the
// league, that's nearly every game, so there it takes two on each side.
async function tonightGames(n: Nation, players: NationPlayer[]): Promise<NationData['tonight']> {
  const today = todayET();
  const week = await getSchedule(today).catch(() => null);
  const onTeam = (t: string) => players.filter(p => p.team === t).map(p => p.last);
  const derbyMin = players.length >= 30 ? 2 : 1;
  for (const day of week?.gameWeek ?? []) {
    if (day.date < today) continue;
    const games = (day.games as any[]).filter(g => onTeam(g.awayTeam?.abbrev).length || onTeam(g.homeTeam?.abbrev).length);
    if (!games.length) continue;
    return {
      label: day.date === today ? n.t.ui.tonight : nightLabel(n, day.date),
      games: games.map(g => {
        const away = g.awayTeam.abbrev, home = g.homeTeam.abbrev;
        const awayPlayers = onTeam(away), homePlayers = onTeam(home);
        return {
          href: gameUrl(g.id, away, home, day.date), away, home, time: localTime(g.startTimeUTC ?? null, n),
          derby: awayPlayers.length >= derbyMin && homePlayers.length >= derbyMin, awayPlayers, homePlayers,
        };
      }).sort((a, b) => Number(b.derby) - Number(a.derby)),
    };
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
