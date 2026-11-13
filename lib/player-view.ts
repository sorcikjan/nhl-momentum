// Builds everything the player profile shows (components/player/v3/types.ts)
// from our player record, the NHL.com landing and the league stat tables.
import type { ProfileV3View, Result } from '@/components/player/v3/types';
import { deriveOutStatus, daysAgo, fetchPeers, fetchPlayer, fetchSeasonPhase } from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';
import { goalieTable, leagueSavePct, skaterTable, skaterWindow, type GoalieRow, type SkaterRow } from '@/lib/league-stats';
import { nextGame } from '@/lib/next-game';
import { currentSeason, getPlayerLanding } from '@/lib/nhl-api';
import { heatSeries } from '@/lib/player-profile';
import { gameLines, groupOf, groupWords, heatContext, ordinal, peerFromSnapshot, peersOf } from '@/lib/profile-context';
import {
  AXIS_LABELS, characterAxes, countryEvents, goalieAxes, goalieStarts, leagueName, nationality, nhlSeasonOrdinal, rising,
  seasonColumns, seasonRank, seasonTotals, teamLadder, timeline, verdict, type Character, type Rank, type Total,
} from '@/lib/profile-v3';
import { TEAMS } from '@/lib/team-colors';

const NEED = 5;
const POSITION: Record<string, string> = { C: 'Center', L: 'Left wing', R: 'Right wing', D: 'Defenseman', G: 'Goalie' };
const POS_SHORT: Record<string, string> = { C: 'C', L: 'LW', R: 'RW', D: 'D', G: 'G' };
const fmtSv = (v: number) => v.toFixed(3).replace(/^0/, '');
const shortDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const ageOf = (birth: string | null | undefined) => (birth ? Math.floor((Date.now() - Date.parse(birth)) / (365.25 * 86_400_000)) : null);
const minus = (date: string, days: number) => new Date(Date.parse(`${date}T12:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);

/* eslint-disable @typescript-eslint/no-explicit-any */
// Team result and opponent of a game row (game_*_stats with `games` joined).
function gameSide(row: any, teamId: number | null): { date: string; opp: string; result: Result } {
  const gm = row.games ?? {};
  const home = gm.home_team_id === teamId;
  const us = home ? gm.home_score : gm.away_score, them = home ? gm.away_score : gm.home_score;
  return {
    date: gm.game_date ?? '',
    opp: `${home ? '' : '@'}${(home ? gm.away_team?.abbrev : gm.home_team?.abbrev) ?? ''}`,
    result: us == null || them == null ? null : us > them ? 'W' : 'L',
  };
}

export type PlayerPageData = { view: ProfileV3View; player: any; heat: number | null };

export async function buildPlayerView(id: string): Promise<PlayerPageData | null> {
  const data = await fetchPlayer(id).catch(() => null);
  if (!data?.player) return null;
  const { player, metricTimeline, recentGames, consecutiveGamesMissed, lastPlayedDate } = data;
  const isGoalie = player.position_code === 'G';
  const team: string = player.teams?.abbrev ?? '';
  const teamId: number | null = player.team_id ?? null;
  const season = currentSeason();
  const seasonStart = `${season.slice(0, 4)}-09-01`;
  const today = new Date().toISOString().slice(0, 10);
  const snap: Record<string, any> = metricTimeline?.[metricTimeline.length - 1] ?? {};

  const [phase, landing, peers, table, window, goalies, next] = await Promise.all([
    fetchSeasonPhase().catch(() => ({ isPreseason: false })),
    getPlayerLanding(Number(id), 21600).catch(() => null),
    isGoalie ? Promise.resolve([]) : fetchPeers().catch(() => []),
    isGoalie ? Promise.resolve([] as SkaterRow[]) : skaterTable(season),
    isGoalie ? Promise.resolve([] as SkaterRow[]) : skaterWindow(minus(today, 21), today),
    isGoalie ? goalieTable(season) : Promise.resolve([] as GoalieRow[]),
    nextGame(team, today),
  ]);

  // Past NHL seasons ranked against their own league (skaters).
  const nhlSeasons = isGoalie ? [] : [...new Set(((landing as any)?.seasonTotals ?? [])
    .filter((r: any) => r.leagueAbbrev === 'NHL' && r.gameTypeId === 2 && r.gamesPlayed > 0)
    .map((r: any) => String(r.season)))].slice(-6) as string[];
  const ranks: Record<string, Rank | null> = {};
  const meS = table.find(r => r.id === player.id) ?? null;
  const pos: 'F' | 'D' = player.position_code === 'D' ? 'D' : 'F';
  await Promise.all(nhlSeasons.map(async s => {
    const t = s === season ? table : await skaterTable(s);
    ranks[s] = seasonRank(t, player.id, pos, s === season ? NEED : 20);
  }));

  // ── Status and next game ──
  const lastPlayedDaysAgo = lastPlayedDate ? daysAgo(lastPlayedDate) : null;
  const out = deriveOutStatus(consecutiveGamesMissed ?? null, lastPlayedDaysAgo, player.in_minors ?? false, !phase.isPreseason);
  const curRows = ((landing as any)?.seasonTotals ?? []).filter((r: any) => String(r.season) === season && r.gameTypeId === 2);
  const minorRow = curRows.filter((r: any) => r.leagueAbbrev !== 'NHL').at(-1);
  let status: ProfileV3View['status'] = null;
  let miniStatus: ProfileV3View['mini']['status'] = null;
  if (out === 'minors') {
    const league = minorRow ? leagueName(minorRow.leagueAbbrev) : 'minors';
    const club = minorRow?.teamName?.default ?? '';
    const line = minorRow ? (isGoalie
      ? `${minorRow.gamesPlayed} games · ${minorRow.savePctg != null ? fmtSv(minorRow.savePctg) : '–'} this season`
      : `${minorRow.goals ?? 0} G ${minorRow.assists ?? 0} A in ${minorRow.gamesPlayed} games`) : '';
    status = { text: `In the ${league}`, sub: [club, line].filter(Boolean).join(' · '), tone: 'amber' };
    miniStatus = { text: `In the ${league}${club ? ` · ${club.split(' ').slice(0, -1).join(' ') || club}` : ''}`, tone: 'amber' };
  } else if (out === 'injured' || out === 'out') {
    status = { text: 'Out of the lineup', sub: `missed ${consecutiveGamesMissed} straight games`, tone: 'red' };
    miniStatus = { text: 'Out of the lineup', tone: 'red' };
  } else if (out === 'scratch') {
    status = { text: 'Scratched', sub: `missed ${consecutiveGamesMissed} game${consecutiveGamesMissed === 1 ? '' : 's'}`, tone: 'amber' };
    miniStatus = { text: 'Scratched', tone: 'amber' };
  }

  const games = ((recentGames ?? []) as any[]).filter(g => (g.games?.game_date ?? '') >= seasonStart);
  const group = groupOf(player.position_code);
  const words = isGoalie ? { one: 'goalie', many: 'goalies' } : groupWords(group);

  // ── Heat (skaters) or save % (goalies) after each game ──
  let metric: ProfileV3View['metric'];
  let last5: ProfileV3View['last5'];
  let logRows: ProfileV3View['games']['rows'];
  let heat: number | null = null, heatRank: number | null = null, gp: number;
  let character: Character, totals: Total[], svRank: number | null = null;

  if (!isGoalie) {
    const daily = heatSeries(metricTimeline ?? [], new Date(), 400);
    const lines = gameLines(games, teamId, seasonStart, daily); // oldest first
    gp = meS?.gp ?? Number(snap.season_games ?? lines.length);
    const me = gp > 0 ? peerFromSnapshot({ ...snap, player_id: player.id, players: { last_name: player.last_name, position_code: player.position_code, teams: { abbrev: team } } }) : null;
    const field = me ? peersOf(me, peers) : [];
    const ctx = me && field.length >= 10 ? heatContext(me, field) : null;
    if (me && gp >= NEED) {
      heat = ppmToHeat(snap.momentum_ppm);
      heatRank = 1 + field.filter(p => p.heat > me.heat).length;
    }
    const series = lines.map(l => l.heat).filter((h): h is number => h != null);
    metric = {
      label: 'HEAT', current: heat, delta: heat != null && daily.length >= 2 ? heat - daily[daily.length - 2].heat : null,
      deltaNote: lines.length ? `after ${shortDate(lines[lines.length - 1].date)}` : null,
      series, lo: 0, hi: 100, avg: ctx?.avg ?? null, have: gp, need: NEED,
      firstLabel: lines.length ? shortDate(lines[0].date) : '',
    };
    last5 = lines.slice(-5).map(l => ({
      top: [l.g ? `${l.g}G` : '', l.a ? `${l.a}A` : ''].filter(Boolean).join(' ') || '–',
      opp: `${l.home ? '' : '@'}${l.opp}`, result: l.result,
    }));
    logRows = [...lines].reverse().map(l => ({
      date: l.date, opp: `${l.home ? '' : '@'}${l.opp}`, result: l.result,
      cells: [String(l.g), String(l.a), String(l.sog)], strong: [l.g > 0, false, false], heat: l.heat,
    }));
    character = meS ? characterAxes(meS, window.find(r => r.id === player.id) ?? null, table) : { axes: [], unused: [] };
    totals = meS ? seasonTotals(meS, table, false) : [
      { label: 'GAMES', value: String(gp), rank: null }, { label: 'GOALS', value: String(snap.season_goals ?? 0), rank: null },
      { label: 'ASSISTS', value: String(snap.season_assists ?? 0), rank: null }, { label: 'POINTS', value: String(Number(snap.season_goals ?? 0) + Number(snap.season_assists ?? 0)), rank: null },
    ];
  } else {
    const rows = [...games].sort((a, b) => (a.games?.game_date ?? '').localeCompare(b.games?.game_date ?? '')); // oldest first
    const meG = goalies.find(r => r.id === player.id) ?? null;
    gp = meG?.gp ?? rows.length;
    const cum = (rs: any[]) => { const sa = rs.reduce((s, r) => s + (r.shots_against ?? 0), 0); return sa ? rs.reduce((s, r) => s + (r.shots_against ?? 0) - (r.goals_against ?? 0), 0) / sa : null; };
    const now = gp >= NEED ? cum(rows) : null, before = gp >= NEED ? cum(rows.slice(0, -1)) : null;
    const pool = goalies.filter(r => r.gp >= NEED);
    if (meG && meG.gp >= NEED && meG.shots) svRank = 1 + pool.filter(r => r.shots && r.saves / r.shots > meG.saves / meG.shots).length;
    metric = {
      label: 'SAVE %', current: now, delta: now != null && before != null ? Math.round((now - before) * 1000) / 1000 : null,
      deltaNote: rows.length ? `after ${shortDate(rows.at(-1).games.game_date)}` : null,
      series: rows.map(r => r.save_pct).filter((v: unknown): v is number => typeof v === 'number').map(Number),
      lo: 0.85, hi: 0.95, avg: leagueSavePct(goalies), have: gp, need: NEED,
      firstLabel: rows.length ? shortDate(rows[0].games.game_date) : '',
    };
    last5 = rows.slice(-5).map(r => {
      const s = gameSide(r, teamId);
      return { top: `${(r.shots_against ?? 0) - (r.goals_against ?? 0)}/${r.shots_against ?? 0}`, opp: s.opp, result: s.result };
    });
    logRows = [...rows].reverse().map(r => {
      const s = gameSide(r, teamId);
      const sa = r.shots_against ?? 0, sv = sa - (r.goals_against ?? 0);
      return { date: s.date, opp: s.opp, result: s.result, cells: [`${sv}/${sa}`, sa ? fmtSv(sv / sa) : '–', r.decision ?? '–'], strong: [false, false, r.decision === 'W'], heat: null };
    });
    character = meG ? goalieAxes(meG, goalies) : { axes: [], unused: [] };
    totals = meG ? seasonTotals(meG, goalies, true) : [
      { label: 'GAMES', value: String(rows.length), rank: null }, { label: 'WINS', value: String(rows.filter(r => r.decision === 'W').length), rank: null },
      { label: 'SAVE %', value: cum(rows) != null ? fmtSv(cum(rows)!) : '–', rank: null }, { label: 'GAA', value: '–', rank: null },
    ];
  }

  const columns = seasonColumns(landing, ranks, isGoalie);
  const draftD = (landing as any)?.draftDetails;
  const draft = draftD?.year ? { year: draftD.year, pick: draftD.overallPick, team: draftD.teamAbbrev } : null;
  const country = nationality(landing, player.birth_country ?? (landing as any)?.birthCountry ?? null);
  const nhlN = nhlSeasonOrdinal(landing);
  const age = ageOf(player.birth_date);
  const pointsRank = meS && meS.gp >= NEED ? 1 + table.filter(r => r.pos === meS.pos && r.gp >= NEED && r.pts > meS.pts).length : null;

  const sentence = verdict({
    goalie: isGoalie, status: out, minorsLeague: minorRow ? leagueName(minorRow.leagueAbbrev) : null,
    nhlGp: gp, missed: consecutiveGamesMissed ?? 0, heatRank, pointsRank, svRank, rising: rising(columns),
    g: meS?.g ?? Number(snap.season_goals ?? 0), a: meS?.a ?? Number(snap.season_assists ?? 0),
    w: goalies.find(r => r.id === player.id)?.wins ?? 0, one: words.one, many: words.many,
  });

  const energy = snap.energy_bar != null ? Number(snap.energy_bar) : null;
  const metricValue = metric.current == null ? '–' : isGoalie ? fmtSv(metric.current) : String(metric.current);
  const teamShort = TEAMS[team]?.name ?? player.teams?.name ?? team;

  const view: ProfileV3View = {
    goalie: isGoalie,
    hero: {
      first: player.first_name, last: player.last_name, number: player.sweater_number ?? null,
      position: POSITION[player.position_code ?? ''] ?? player.position_code ?? '', team, teamName: player.teams?.name ?? team, photo: player.headshot_url ?? null,
    },
    mini: {
      photo: player.headshot_url ?? null, name: `${player.first_name} ${player.last_name}`,
      line: `${player.sweater_number != null ? `#${player.sweater_number} · ` : ''}${POS_SHORT[player.position_code ?? ''] ?? ''} · ${teamShort}`,
      team, status: miniStatus, next: next?.label ?? null, metric: { value: metricValue, label: isGoalie ? 'SAVE %' : 'HEAT' },
    },
    bio: [
      country ? { value: `${country.flag} ${country.name}`.trim(), sub: country.born ? `born in ${country.born}` : player.birth_city ?? 'nationality' } : { value: '–', sub: 'nationality' },
      { value: age != null ? String(age) : '–', sub: 'years old' },
      { value: nhlN ? ordinal(nhlN) : '1st', sub: 'NHL season' },
      draft ? { value: `#${draft.pick}`, sub: `pick ${draft.year}` } : { value: 'Undrafted', sub: 'draft' },
    ],
    verdict: sentence,
    status, next: next?.label ?? null,
    energy: energy != null && !isGoalie ? {
      value: energy,
      note: lastPlayedDaysAgo == null ? null : lastPlayedDaysAgo === 0 ? 'played today' : `${lastPlayedDaysAgo} day${lastPlayedDaysAgo === 1 ? '' : 's'} rest`,
    } : null,
    metric, last5,
    role: isGoalie
      ? { kind: 'starts', rows: goalieStarts(goalies, player.id, team) }
      : { kind: 'ladder', ladder: teamLadder(table, player.id, team), teamName: `${teamShort} ${words.many}` },
    character,
    axisLabels: [...AXIS_LABELS[isGoalie ? 'G' : group]],
    emptyNote: character.axes.length ? null : { have: gp, need: NEED },
    career: { columns, timeline: timeline(landing, draft), events: countryEvents(landing), country },
    games: {
      totals,
      note: (isGoalie ? (goalies.find(r => r.id === player.id)?.gp ?? 0) : (meS?.gp ?? 0)) >= NEED ? `rank among NHL ${words.many}` : 'too few games to rank',
      columns: isGoalie ? ['SAVES', 'SV%', 'DEC'] : ['G', 'A', 'SOG', 'HEAT'],
      rows: logRows,
    },
  };
  return { view, player, heat };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
