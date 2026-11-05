// "Who do you cheer for": the homepage section for one country or one team,
// served by /api/cheer to the browser that picked it. Built from what's
// already cached — the nation pages' NHL calls, the shared rankings, the NHL
// schedule, standings and score feed — plus one prediction row for the next game.
import { fetchRankings, latestModelVersion } from '@/lib/data';
import { todayET } from '@/lib/home';
import { gameGoals, withClips, type Moment } from '@/lib/moments';
import { fetchNationData, type NightGame, type TonightGame } from '@/lib/nation-data';
import { ENGLISH } from '@/lib/cheer';
import { inEnglish, type Nation } from '@/lib/nations';
import { currentSeason, getGameLanding, getScore, getStandings, getTeamRoster, getTeamScheduleNow } from '@/lib/nhl-api';
import { supabaseAdmin } from '@/lib/supabase';
import { teamColor } from '@/lib/team-colors';
import { gameUrl, playerUrl, teamUrl } from '@/lib/urls';

// A player in "who's hot · who's not": Heat, and what it says against the league.
export type FormNote = { name: string; href: string; heat: number; note: string; hot: boolean };

export type CheerNation = {
  kind: 'nation'; code: string; country: string; people: string; href: string;
  headline: string; sub: string; night: { label: string; games: NightGame[]; idle: string[]; scratched: string[] } | null;
  goal: Moment | null; tonight: { label: string; games: TonightGame[] } | null; form: FormNote[];
};

export type CheerTeam = {
  kind: 'team'; abbrev: string; name: string; href: string | null;
  headline: string; sub: string;
  last: { label: string; href: string; away: string; home: string; awayScore: number; homeScore: number; suffix: string; goals: Moment[]; stars: string[] } | null;
  changed: { value: string; label: string }[];
  next: { href: string; away: string; home: string; time: string; pct: number | null; favored: string | null } | null;
  form: FormNote[];
};

// Top or bottom share of the league by Heat: "top 5 %", "bottom 20 %".
function standing(rank: number, of: number): string {
  const share = Math.max(1, Math.round((rank / of) * 100));
  return share <= 50 ? `top ${share}% of NHL` : `bottom ${Math.max(1, 100 - share + 1)}%`;
}

type Form = { games: number; goals: number; assists: number; pace: number | null };

// Who's hot and who's not among `ids`: the two best by Heat, and the coldest
// with five games and no point — "no point in 5".
function formNotes(ids: { id: number; name: string; href: string }[], heatBy: Record<number, number>, formBy: Record<number, Form>): FormNote[] {
  const heats = Object.values(heatBy);
  const rank = (h: number) => 1 + heats.filter(v => v > h).length;
  const scored = ids.filter(p => heatBy[p.id] != null && formBy[p.id]).map(p => ({ ...p, heat: heatBy[p.id], f: formBy[p.id] }))
    .sort((a, b) => b.heat - a.heat);
  const hot = scored.slice(0, 2).filter(p => p.heat > 0).map(p => ({
    name: p.name, href: p.href, heat: p.heat, hot: true,
    note: p.f.pace != null && p.f.pace >= 20 ? `${standing(rank(p.heat), heats.length)} · +${p.f.pace}% on his pace` : standing(rank(p.heat), heats.length),
  }));
  const cold = scored.filter(p => p.f.games >= 3 && p.f.goals + p.f.assists === 0 && !hot.some(h => h.href === p.href)).slice(-1)
    .map(p => ({ name: p.name, href: p.href, heat: p.heat, hot: false, note: `no point in ${p.f.games}` }));
  return [...hot, ...cold];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function fetchCheerNation(native: Nation): Promise<CheerNation> {
  const n = inEnglish(native);
  const en = ENGLISH[n.code];
  const [data, rankings] = await Promise.all([fetchNationData(n), fetchRankings().catch(() => null)]);
  const night = data.night;
  const rows = night?.games.flatMap(g => g.players) ?? [];
  const skaters = rows.filter(r => r.points >= 0);
  const points = skaters.reduce((s, r) => s + Math.floor(r.points / 10) + (r.points % 10), 0);
  const best = [...skaters].sort((a, b) => b.points - a.points)[0];
  const tally = `${rows.length} ${rows.length === 1 ? en.people[0] : en.people[1]} played, ${points} ${points === 1 ? 'point' : 'points'}`;
  const headline = !night ? `No ${en.adj} player has played yet this week.`
    : best && best.points > 0 ? `${best.name} with ${best.phrase} — ${tally}.`
    : `${tally}.`;
  // The goalie who won, if any: the other half of the night.
  const keeper = rows.find(r => r.points < 0 && r.line.startsWith('win'));
  const sub = [
    night?.label ? `${night.label[0].toUpperCase()}${night.label.slice(1)}.` : null,
    keeper ? `${keeper.name}: ${keeper.line.replace(/ · [\d.]+%$/, '')}.` : null,
  ].filter(Boolean).join(' ');
  // The best goal of the night, else of the last few: the video on top.
  const byWeight = (ms: Moment[]) => [...ms].sort((a, b) => b.points - a.points)[0] ?? null;
  const goal = byWeight(night?.games.flatMap(g => g.players.flatMap(p => p.goals)) ?? []) ?? data.goals[0] ?? null;
  const ids = data.skaters.map(r => ({ id: r.playerId, name: r.name, href: r.href }));
  return {
    kind: 'nation', code: n.code, country: en.country, people: en.people[1], href: n.path,
    headline, sub, goal,
    night: night ? { label: night.label, games: night.games, idle: night.idle, scratched: night.scratched } : null,
    tonight: data.tonight,
    form: formNotes(ids, rankings?.heatByPlayer ?? {}, rankings?.formByPlayer ?? {}),
  };
}

const isFinal = (g: any) => g?.gameState === 'FINAL' || g?.gameState === 'OFF';
const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
// "last night" for yesterday's ET date, else "Mon 2 Nov".
function dayLabel(date: string, today: string): string {
  if (Date.parse(today) - Date.parse(date) === 86_400_000) return 'last night';
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
const WORDS = ['', '', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

export async function fetchCheerTeam(abbrev: string): Promise<CheerTeam> {
  const today = todayET();
  const [schedule, standings, rankings, roster] = await Promise.all([
    getTeamScheduleNow(abbrev).catch(() => null) as Promise<any>,
    getStandings(today).catch(() => null) as Promise<any>,
    fetchRankings().catch(() => null),
    getTeamRoster(abbrev, currentSeason()).catch(() => null) as Promise<any>,
  ]);
  const games: any[] = schedule?.games ?? [];
  const last = [...games].reverse().find(isFinal) ?? null;
  const next = games.find(g => !isFinal(g) && g.gameDate >= today) ?? null;
  const rows: any[] = standings?.standings ?? [];
  const row = rows.find(r => r.teamAbbrev?.default === abbrev);
  const nick = (a: string) => rows.find(r => r.teamAbbrev?.default === a)?.teamCommonName?.default ?? teamColor(a).name;
  const name = nick(abbrev);
  const team = rankings?.teams?.[abbrev];

  // Last game: score, every goal with its clip, the official three stars.
  let lastOut: CheerTeam['last'] = null;
  let headline = `${name}: no game yet this season.`;
  if (last) {
    const away = last.awayTeam.abbrev, home = last.homeTeam.abbrev;
    const [feed, landing] = await Promise.all([getScore(last.gameDate, 3600).catch(() => null), getGameLanding(last.id).catch(() => null) as Promise<any>]);
    const goals = feed ? await withClips(gameGoals(feed, last.id, rankings?.heatByPlayer ?? {})) : [];
    const stars = ((landing?.summary?.threeStars ?? []) as any[]).map(s =>
      `${s.star}. ${s.name?.default ?? ''} (${s.position === 'G' ? `${s.savePctg != null ? `${(s.savePctg * 100).toFixed(1)}%` : 'G'}` : `${s.goals ?? 0}+${s.assists ?? 0}`})`);
    const lastType = last.gameOutcome?.lastPeriodType;
    const suffix = lastType === 'OT' ? 'OT' : lastType === 'SO' ? 'SO' : '';
    lastOut = { label: dayLabel(last.gameDate, today), href: gameUrl(last.id, away, home, last.gameDate), away, home, awayScore: last.awayTeam.score ?? 0, homeScore: last.homeTeam.score ?? 0, suffix, goals, stars };
    const atHome = home === abbrev;
    const us = atHome ? last.homeTeam.score : last.awayTeam.score, them = atHome ? last.awayTeam.score : last.homeTeam.score;
    const opp = atHome ? away : home;
    const where = atHome ? `against ${teamColor(opp).name}` : `in ${teamColor(opp).name}`;
    const score = `${Math.max(us, them)}–${Math.min(us, them)}${suffix ? ` (${suffix})` : ''}`;
    const streak = row && row.streakCount >= 2 && WORDS[row.streakCount]
      ? row.streakCode === 'W' ? ` — ${WORDS[row.streakCount]} straight win` : row.streakCode === 'L' ? ` — ${WORDS[row.streakCount]} straight loss` : ''
      : '';
    headline = `${name} ${us > them ? 'win' : 'lose'} ${score} ${where}${streak}.`;
  }

  // What it changed: the division place, the streak, team Heat, goal difference.
  const changed: CheerTeam['changed'] = [];
  if (row) {
    changed.push({ value: ord(row.divisionSequence), label: `in the ${row.divisionName}, ${row.points} pts` });
    changed.push({ value: `${row.streakCode}${row.streakCount}`, label: `streak · ${row.l10Wins}–${row.l10Losses}–${row.l10OtLosses} last 10` });
  }
  const heatBy: Record<string, number> = rankings?.teamHeat ?? {};
  if (heatBy[abbrev] != null) {
    const all = Object.values(heatBy);
    changed.push({ value: String(heatBy[abbrev]), label: `team Heat · ${ord(1 + all.filter(v => v > heatBy[abbrev]).length)} of ${all.length}` });
  }
  if (row) {
    const gd = row.goalDifferential as number;
    changed.push({ value: `${gd > 0 ? '+' : gd < 0 ? '−' : ''}${Math.abs(gd)}`, label: `goal diff · ${ord(1 + rows.filter(r => r.goalDifferential > gd).length)} in NHL` });
  }

  // Next game, and the model's pick when it's out (the day of the game).
  let nextOut: CheerTeam['next'] = null;
  if (next) {
    const away = next.awayTeam.abbrev, home = next.homeTeam.abbrev;
    let pct: number | null = null, favored: string | null = null;
    try {
      const model = await latestModelVersion();
      const { data } = await supabaseAdmin.from('predictions').select('home_win_probability, model_version')
        .eq('game_id', next.id).order('created_at', { ascending: false }).limit(10);
      const p = (data ?? []).find(r => r.model_version === model) ?? data?.[0];
      if (p?.home_win_probability != null) {
        const homeP = p.home_win_probability as number;
        const ours = home === abbrev ? homeP : 1 - homeP;
        pct = Math.round(ours * 100);
        favored = ours >= 0.5 ? abbrev : home === abbrev ? away : home;
      }
    } catch { /* no pick yet */ }
    nextOut = { href: gameUrl(next.id, away, home, next.gameDate), away, home, time: next.startTimeUTC ?? next.gameDate, pct, favored };
  }

  const players = (['forwards', 'defensemen'] as const).flatMap(k => (roster?.[k] ?? []) as any[]).map(p => ({
    id: p.id as number, name: `${p.firstName?.default ?? ''} ${p.lastName?.default ?? ''}`.trim(),
    href: playerUrl(p.id, p.firstName?.default ?? '', p.lastName?.default ?? ''),
  }));
  const record = row ? `${row.wins}–${row.losses}–${row.otLosses}` : null;
  return {
    kind: 'team', abbrev, name, href: team ? teamUrl(team.id, team.name) : null,
    headline,
    sub: [record ? `${record} this season.` : null, lastOut?.stars[0] ? `First star: ${lastOut.stars[0].replace(/^1\. /, '')}.` : null].filter(Boolean).join(' '),
    last: lastOut, changed, next: nextOut,
    form: formNotes(players, rankings?.heatByPlayer ?? {}, rankings?.formByPlayer ?? {}),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
