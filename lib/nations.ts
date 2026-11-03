// "Czechs in the NHL" and pages like it: one nation's players — last night,
// their goals, their form, who plays tonight — in that nation's language.
// Pure: the data comes in from fetchNationData() (lib/nation-data.ts), all of
// it from the NHL API, so the page costs the database nothing.
import { ppmToHeat } from '@/lib/heat';
import { pacePct, posLabel, type PlayerRowData } from '@/lib/player-row';
import { toiToSeconds } from '@/lib/nhl-api';
import type { Moment } from '@/lib/moments';

export type Nation = {
  code: string;            // NHL birthCountry: 'CZE'
  path: string;            // '/cesi-v-nhl'
  lang: string;            // NHL name locale and <html lang>: 'cs'
  locale: string;          // 'cs-CZ'
  timeZone: string;        // the fans' clock: 'Europe/Prague'
  // Names the NHL API leaves without their accents, by player id.
  lastNames: Record<number, string>;
};

export const CZE: Nation = {
  code: 'CZE', path: '/cesi-v-nhl', lang: 'cs', locale: 'cs-CZ', timeZone: 'Europe/Prague',
  lastNames: { 8482487: 'Dobeš', 8484790: 'Jiříček', 8482877: 'Chmelař' },
};

// A roster entry from /v1/roster/{team}/current.
export type NationPlayer = {
  id: number; first: string; last: string; name: string;
  slugFirst: string; slugLast: string;   // the NHL's default spelling, for our player URLs
  team: string; pos: string; goalie: boolean; photo: string | null;
};

// One game of /v1/player/{id}/game-log/now, newest first.
export type LogGame = {
  gameId: number; gameDate: string; teamAbbrev: string; opponentAbbrev: string; homeRoadFlag: string;
  goals: number; assists: number; points?: number; plusMinus?: number; shots?: number; toi: string;
  gamesStarted?: number; decision?: string; shotsAgainst?: number; goalsAgainst?: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function nationPlayers(rosters: { team: string; roster: any }[], n: Nation): NationPlayer[] {
  const out: NationPlayer[] = [];
  for (const { team, roster } of rosters) {
    for (const group of ['forwards', 'defensemen', 'goalies']) {
      for (const p of (roster?.[group] ?? []) as any[]) {
        if (p.birthCountry !== n.code) continue;
        const first = p.firstName?.[n.lang] ?? p.firstName?.default ?? '';
        const last = n.lastNames[p.id] ?? p.lastName?.[n.lang] ?? p.lastName?.default ?? '';
        out.push({
          id: p.id, first, last, name: `${first} ${last}`.trim(),
          slugFirst: p.firstName?.default ?? '', slugLast: p.lastName?.default ?? '',
          team, pos: posLabel(p.positionCode), goalie: p.positionCode === 'G', photo: p.headshot ?? null,
        });
      }
    }
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Form ─────────────────────────────────────────────────────────────────────

const ppm = (games: LogGame[]) => {
  const min = games.reduce((s, g) => s + toiToSeconds(g.toi ?? '0:00'), 0) / 60;
  return min > 0 ? games.reduce((s, g) => s + g.goals + g.assists, 0) / min : 0;
};

// Heat as the site defines it: points per minute over the last five games.
// `heat` from the pipeline wins when we have it, so this page never disagrees
// with /hot; the log only fills in a player the pipeline hasn't scored yet.
export function skaterForm(log: LogGame[], pipelineHeat?: number) {
  const last5 = log.slice(0, 5);
  const m = ppm(last5);
  return {
    games: last5.length,
    goals: last5.reduce((s, g) => s + g.goals, 0),
    assists: last5.reduce((s, g) => s + g.assists, 0),
    heat: pipelineHeat ?? ppmToHeat(m),
    pace: last5.length ? pacePct(m, ppm(log)) : null,
  };
}

// Save % over the last five starts, the same window goalies are ranked on.
export function goalieForm(log: LogGame[]) {
  const starts = log.filter(g => (g.gamesStarted ?? 0) > 0).slice(0, 5);
  const sa = starts.reduce((s, g) => s + (g.shotsAgainst ?? 0), 0);
  const ga = starts.reduce((s, g) => s + (g.goalsAgainst ?? 0), 0);
  const secs = starts.reduce((s, g) => s + toiToSeconds(g.toi ?? '0:00'), 0);
  const n = (d: string) => starts.filter(g => g.decision === d).length;
  return {
    starts: starts.length,
    svPct: sa > 0 ? (sa - ga) / sa : null,
    gaa: secs > 0 ? (ga * 3600) / secs : null,
    record: `${n('W')}–${n('L')}–${n('O')}`,
  };
}

// ─── Czech words ──────────────────────────────────────────────────────────────

// 1 gól · 2–4 góly · 5+ gólů
export const plural = (n: number, one: string, few: string, many: string) =>
  n === 1 ? one : n >= 2 && n <= 4 ? few : many;

const num = (n: number, d: number) => n.toFixed(d).replace('.', ',');
export const pct = (sv: number) => `${num(sv * 100, 1)} %`;

// What a skater did in one game, the way a Czech paper says it:
// "gól a 2 asistence", "hattrick", "bez bodu".
export function pointsPhrase(goals: number, assists: number): string {
  if (!goals && !assists) return 'bez bodu';
  const g = goals === 3 ? 'hattrick' : goals === 1 ? 'gól' : goals ? `${goals} ${plural(goals, 'gól', 'góly', 'gólů')}` : '';
  const a = assists === 1 ? 'asistence' : assists ? `${assists} asistence` : '';
  return [g, a].filter(Boolean).join(' a ');
}

export function skaterLine(g: LogGame): string {
  const shots = g.shots ?? 0;
  return [
    `${g.goals}+${g.assists}`,
    `${shots} ${plural(shots, 'střela', 'střely', 'střel')}`,
    `${g.toi} na ledě`,
    g.plusMinus ? `${g.plusMinus > 0 ? '+' : '−'}${Math.abs(g.plusMinus)}` : null,
  ].filter(Boolean).join(' · ');
}

const DECISION: Record<string, string> = { W: 'výhra', L: 'prohra', O: 'prohra po prodl.' };

export function goalieLine(g: LogGame): string {
  const sa = g.shotsAgainst ?? 0, ga = g.goalsAgainst ?? 0;
  const saves = sa - ga;
  return [
    g.decision ? DECISION[g.decision] ?? null : (g.gamesStarted ? null : 'střídal'),
    `${saves} ${plural(saves, 'zákrok', 'zákroky', 'zákroků')} z ${sa}`,
    sa > 0 ? pct(saves / sa) : null,
  ].filter(Boolean).join(' · ');
}

// The night an NHL date is played, from Prague: games of Mon 2 Nov ET end on
// Tuesday morning — "noc na úterý 3. 11."
const NA = ['neděli', 'pondělí', 'úterý', 'středu', 'čtvrtek', 'pátek', 'sobotu'];
export function nightLabel(etDate: string): string {
  const d = new Date(Date.parse(`${etDate}T12:00:00Z`) + 86_400_000);
  return `noc na ${NA[d.getUTCDay()]} ${d.getUTCDate()}. ${d.getUTCMonth() + 1}.`;
}

export const pragueTime = (utc: string | null, n: Nation) =>
  utc ? new Date(utc).toLocaleTimeString(n.locale, { timeZone: n.timeZone, hour: 'numeric', minute: '2-digit' }) : null;

// ─── Goals in Czech ───────────────────────────────────────────────────────────

const KICKER: Record<string, string> = {
  'OT WINNER': 'VÍTĚZNÝ V PRODLOUŽENÍ', 'LATE WINNER': 'VÍTĚZNÝ V ZÁVĚRU', 'LATE EQUALIZER': 'VYROVNÁNÍ V ZÁVĚRU',
  'GAME WINNER': 'VÍTĚZNÝ GÓL', 'LATE GO-AHEAD': 'VEDENÍ V ZÁVĚRU', 'PENALTY SHOT': 'TRESTNÉ STŘÍLENÍ',
  SHORTHANDED: 'V OSLABENÍ', 'HAT TRICK': 'HATTRICK', 'EMPTY NET': 'DO PRÁZDNÉ BRÁNY', 'OWN GOAL': 'VLASTNÍ GÓL',
  'POWER PLAY': 'V PŘESILOVCE', GOAL: 'GÓL',
};

// A goal card from lib/moments, retold: Czech labels, the scorer's Czech name.
export function czechGoal(m: Moment, name: string): Moment {
  return {
    ...m,
    scorer: name,
    kicker: m.kicker.split(' · ').map(k => KICKER[k] ?? k).join(' · '),
    when: m.when.replace(/^OT /, 'PRODL. ').replace(/^(\d)(st|nd|rd|th) /, '$1. TŘ. '),
    line: m.line.replace(/(\d+)(st|nd|rd|th) goal of the season/, '$1. gól v sezoně'),
  };
}

// ─── Rows ─────────────────────────────────────────────────────────────────────

export function skaterRow(p: NationPlayer, href: string, f: ReturnType<typeof skaterForm>, rank: number): PlayerRowData {
  return {
    playerId: p.id, href, name: p.name, photo: p.photo, team: p.team,
    mark: String(rank), markTone: null, pos: p.pos,
    l5: `${f.games} ${plural(f.games, 'zápas', 'zápasy', 'zápasů')} ${f.goals}+${f.assists}`,
    chip: f.pace == null ? null : { text: `${f.pace > 0 ? '+' : f.pace < 0 ? '−' : ''}${Math.abs(f.pace)} %`, tone: f.pace > 0 ? 'rise' : f.pace < 0 ? 'cold' : 'muted' },
    value: String(f.heat), valueHeat: f.heat,
  };
}

export function goalieRow(p: NationPlayer, href: string, f: ReturnType<typeof goalieForm>, rank: number): PlayerRowData {
  return {
    playerId: p.id, href, name: p.name, photo: p.photo, team: p.team,
    mark: String(rank), markTone: null, pos: 'G',
    l5: `${f.starts} ${plural(f.starts, 'start', 'starty', 'startů')} ${f.record}`,
    chip: f.gaa == null ? null : { text: `${num(f.gaa, 2)} GAA`, tone: 'muted' },
    value: f.svPct == null ? '–' : num(f.svPct * 100, 1), valueHeat: null,
  };
}
