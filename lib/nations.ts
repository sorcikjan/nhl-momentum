// Nation pages ("Češi v NHL", "Svenskar i NHL"…): one nation's players — last
// night, their goals, their form, who plays tonight — in that nation's
// language (lib/nation-text.ts). Pure: the data comes in from
// fetchNationData() (lib/nation-data.ts), from the NHL API and the shared
// rankings, so a page costs the database nothing.
import { posLabel, type PlayerRowData } from '@/lib/player-row';
import { toiToSeconds } from '@/lib/nhl-api';
import type { Moment } from '@/lib/moments';
import { ENGLISH } from '@/lib/cheer';
import { CH, CS, DA, DE, FI, LV, SK, SV, decimal, english, type Decision, type NationText } from '@/lib/nation-text';

export type Nation = {
  code: string;            // NHL birthCountry: 'CZE'
  path: string;            // '/cesi-v-nhl'
  lang: string;            // <html lang>, and the NHL name locale when it has one: 'cs'
  locale: string;          // 'cs-CZ'
  timeZone: string;        // the fans' clock: 'Europe/Prague'
  label: string;           // the page's name, for links to it: 'Češi v NHL'
  t: NationText;
  // Names the NHL API leaves without their accents, by player id.
  lastNames: Record<number, string>;
};

const nation = (n: Omit<Nation, 'label' | 'lastNames'> & { lastNames?: Record<number, string> }): Nation =>
  ({ lastNames: {}, ...n, label: n.t.ui.name });

export const CZE = nation({
  code: 'CZE', path: '/cesi-v-nhl', lang: 'cs', locale: 'cs-CZ', timeZone: 'Europe/Prague', t: CS,
  lastNames: { 8482487: 'Dobeš', 8484790: 'Jiříček', 8482877: 'Chmelař' },
});
export const SVK = nation({ code: 'SVK', path: '/slovaci-v-nhl', lang: 'sk', locale: 'sk-SK', timeZone: 'Europe/Bratislava', t: SK });
export const SWE = nation({ code: 'SWE', path: '/svenskar-i-nhl', lang: 'sv', locale: 'sv-SE', timeZone: 'Europe/Stockholm', t: SV });
export const FIN = nation({ code: 'FIN', path: '/suomalaiset-nhl-ssa', lang: 'fi', locale: 'fi-FI', timeZone: 'Europe/Helsinki', t: FI });
export const DEU = nation({ code: 'DEU', path: '/deutsche-in-der-nhl', lang: 'de', locale: 'de-DE', timeZone: 'Europe/Berlin', t: DE });
export const CHE = nation({ code: 'CHE', path: '/schweizer-in-der-nhl', lang: 'de', locale: 'de-CH', timeZone: 'Europe/Zurich', t: CH });
export const LVA = nation({ code: 'LVA', path: '/latviesi-nhl', lang: 'lv', locale: 'lv-LV', timeZone: 'Europe/Riga', t: LV });
export const DNK = nation({ code: 'DNK', path: '/danskere-i-nhl', lang: 'da', locale: 'da-DK', timeZone: 'Europe/Copenhagen', t: DA });

// Nation pages by NHL birthCountry — player profiles link to theirs.
export const NATIONS: Record<string, Nation> = { CZE, SVK, SWE, FIN, DEU, CHE, LVA, DNK };

// A nation told in English, on the fans' clock, names still in their spelling.
export const inEnglish = (n: Nation): Nation => ({ ...n, locale: 'en-GB', t: english(ENGLISH[n.code]) });

// A roster entry from /v1/roster/{team}/{season}.
export type NationPlayer = {
  id: number; first: string; last: string; name: string;
  slugFirst: string; slugLast: string;   // the NHL's default spelling, for our player URLs
  team: string; pos: string; goalie: boolean; photo: string | null;
};

// One game of /v1/player/{id}/game-log/{season}/2, newest first (goalies).
export type LogGame = {
  gameId: number; gameDate: string; teamAbbrev: string; opponentAbbrev: string; homeRoadFlag: string;
  goals: number; assists: number; points?: number; plusMinus?: number; shots?: number; toi: string;
  gamesStarted?: number; decision?: string; shotsAgainst?: number; goalsAgainst?: number;
};

// One player's line in one game, from the box score.
export type SkaterGame = { goals: number; assists: number; shots?: number; toi: string; plusMinus?: number };
export type GoalieGame = { decision?: Decision | null; started: boolean; shotsAgainst: number; goalsAgainst: number };

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

// A skater's last five games as the pipeline scored them (the shared
// rankings), so this page never disagrees with /hot.
export type SkaterForm = { games: number; goals: number; assists: number; heat: number; pace: number | null };

// Save % over the last five starts, the same window goalies are ranked on.
export function goalieForm(log: LogGame[]) {
  const starts = log.filter(g => (g.gamesStarted ?? 0) > 0).slice(0, 5);
  const sa = starts.reduce((s, g) => s + (g.shotsAgainst ?? 0), 0);
  const ga = starts.reduce((s, g) => s + (g.goalsAgainst ?? 0), 0);
  const secs = starts.reduce((s, g) => s + toiToSeconds(g.toi ?? '0:00'), 0);
  const count = (d: string) => starts.filter(g => g.decision === d).length;
  return {
    starts: starts.length,
    svPct: sa > 0 ? (sa - ga) / sa : null,
    gaa: secs > 0 ? (ga * 3600) / secs : null,
    record: `${count('W')}–${count('L')}–${count('O')}`,
  };
}

// ─── Words ────────────────────────────────────────────────────────────────────

export const pct = (sv: number, n?: Nation) => n?.t.pct ? n.t.pct(sv) : `${decimal(sv * 100, 1)} %`;

// "0+1 · 7 střel · 21:31 na ledě · −2"
export function skaterLine(n: Nation, g: SkaterGame): string {
  const shots = g.shots ?? 0;
  return [
    `${g.goals}+${g.assists}`,
    n.t.count(shots, 'shot'),
    n.t.toi(g.toi),
    g.plusMinus ? `${g.plusMinus > 0 ? '+' : '−'}${Math.abs(g.plusMinus)}` : null,
  ].filter(Boolean).join(' · ');
}

// "výhra · 28 zákroků z 31 · 90,3 %"
export function goalieLine(n: Nation, g: GoalieGame): string {
  const saves = g.shotsAgainst - g.goalsAgainst;
  return [
    g.decision ? n.t.decision[g.decision] : g.started ? null : n.t.decision.relief,
    n.t.saves(saves, g.shotsAgainst),
    g.shotsAgainst > 0 ? pct(saves / g.shotsAgainst, n) : null,
  ].filter(Boolean).join(' · ');
}

// The night an NHL date is played, from Europe: games of Mon 2 Nov ET end on
// Tuesday morning — "noc na úterý 3. 11.", "natten till tisdag 3/11".
export function nightLabel(n: Nation, etDate: string): string {
  const d = new Date(Date.parse(`${etDate}T12:00:00Z`) + 86_400_000);
  return n.t.night(d.getUTCDay(), d.getUTCDate(), d.getUTCMonth() + 1);
}

export const localTime = (utc: string | null, n: Nation) =>
  utc ? new Date(utc).toLocaleTimeString(n.locale, { timeZone: n.timeZone, hour: 'numeric', minute: '2-digit' }) : null;

// A goal card from lib/moments, retold: the nation's labels, the scorer's own name.
export function localGoal(m: Moment, name: string, n: Nation): Moment {
  return {
    ...m,
    scorer: name,
    kicker: m.kicker.split(' · ').map(k => n.t.kicker[k] ?? k).join(' · '),
    when: m.when.replace(/^OT /, `${n.t.overtime} `).replace(/^(\d)(st|nd|rd|th) /, (_, p) => `${n.t.period(Number(p))} `),
    line: m.line.replace(/(\d+)(st|nd|rd|th) goal of the season/, (_, k) => n.t.seasonGoal(Number(k))),
  };
}

// ─── The league around them ───────────────────────────────────────────────────

// Fewer games than this and a season save % says little: no league rank.
export const GOALIE_MIN_GP = 5;

// 1 + how many are better; ties share a place.
export const rankOf = (all: number[], mine: number) => 1 + all.filter(v => v > mine).length;

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
}

export function goalieLeague(n: Nation, s: { svPct: number; games: number; rank: number | null; of: number } | null): string | null {
  return s ? n.t.goalieLeague(pct(s.svPct, n), s.rank, s.of, s.games, GOALIE_MIN_GP) : null;
}

// One sentence on the night, different every day — the page's lead and its
// search snippet. Points are encoded goals × 10 + assists; goalies are −1.
export function nightSummary(n: Nation, label: string, rows: { name: string; phrase: string; points: number }[]): string {
  if (!rows.length) return '';
  const skaters = rows.filter(r => r.points >= 0);
  const total = skaters.reduce((s, r) => s + Math.floor(r.points / 10) + (r.points % 10), 0);
  const best = skaters.filter(r => r.points > 0).sort((a, b) => b.points - a.points).slice(0, 3);
  return n.t.summary(label, rows.length, total, best.map(r => `${r.name} (${r.phrase})`));
}

// ─── Rows ─────────────────────────────────────────────────────────────────────

export function skaterRow(n: Nation, p: NationPlayer, href: string, f: SkaterForm, rank: number, league: string | null = null): PlayerRowData {
  return {
    playerId: p.id, href, name: p.name, photo: p.photo, team: p.team,
    mark: String(rank), markTone: null, pos: p.pos,
    l5: `${n.t.count(f.games, 'game')} ${f.goals}+${f.assists}`,
    chip: f.pace == null ? null : { text: `${f.pace > 0 ? '+' : f.pace < 0 ? '−' : ''}${Math.abs(f.pace)} %`, tone: f.pace > 0 ? 'rise' : f.pace < 0 ? 'cold' : 'muted' },
    value: String(f.heat), valueHeat: f.heat, league,
  };
}

export function goalieRow(n: Nation, p: NationPlayer, href: string, f: ReturnType<typeof goalieForm>, rank: number, league: string | null = null): PlayerRowData {
  return {
    playerId: p.id, href, name: p.name, photo: p.photo, team: p.team,
    mark: String(rank), markTone: null, pos: 'G',
    l5: `${n.t.count(f.starts, 'start')} ${f.record}`,
    chip: f.gaa == null ? null : { text: `${decimal(f.gaa, 2)} GAA`, tone: 'muted' },
    value: f.svPct == null ? '–' : decimal(f.svPct * 100, 1), valueHeat: null, league,
  };
}
