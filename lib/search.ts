// Client-side player & team search. The whole index (~650 players + 32 teams)
// is fetched once from a CDN-cached route, so typing never queries the database.
import { ppmToHeat } from '@/lib/heat';
import { playerUrl, teamUrl } from '@/lib/urls';

export type SearchPlayer = { id: number; name: string; href: string; team: string; pos: string; photo: string | null; heat: number | null; key: string };
export type SearchTeam = { id: number; name: string; abbrev: string; href: string; key: string };
export type SearchIndex = { players: SearchPlayer[]; teams: SearchTeam[] };
export type SearchResults = { players: SearchPlayer[]; teams: SearchTeam[] };

const MAX_PLAYERS = 8;
const MAX_TEAMS = 3;

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

type PlayerRow = { id: number; first_name: string; last_name: string; position_code: string; headshot_url: string | null; teams: { abbrev: string } | null };

export function buildSearchIndex(
  players: PlayerRow[],
  snapshots: { player_id: number; momentum_ppm: number | null }[],
  teams: { id: number; name: string; abbrev: string }[],
): SearchIndex {
  const ppm = new Map(snapshots.map(s => [s.player_id, s.momentum_ppm]));
  return {
    players: players.map(p => {
      const name = `${p.first_name} ${p.last_name}`;
      const m = ppm.get(p.id);
      return {
        id: p.id, name, href: playerUrl(p.id, p.first_name, p.last_name),
        team: p.teams?.abbrev ?? '', pos: p.position_code,
        photo: p.headshot_url,
        // Heat is points-based: goalies (and players with no snapshot) get none.
        heat: p.position_code === 'G' || m == null ? null : ppmToHeat(m),
        key: normalize(name),
      };
    }),
    teams: teams.map(t => ({ id: t.id, name: t.name, abbrev: t.abbrev, href: teamUrl(t.id, t.name), key: normalize(t.name) })),
  };
}

const words = (key: string) => key.split(/[\s-]+/);
const allPrefix = (key: string, tokens: string[]) => tokens.every(t => words(key).some(w => w.startsWith(t)));

export function searchIndex(idx: SearchIndex, query: string): SearchResults {
  const q = normalize(query);
  if (!q) return { players: [], teams: [] };
  const tokens = q.split(/\s+/);

  const scored: { p: SearchPlayer; score: number }[] = [];
  for (const p of idx.players) {
    // A query that is exactly a team abbreviation ("edm") most likely means that team.
    const score = normalize(p.team) === q ? 4 : allPrefix(p.key, tokens) ? 3 : p.key.includes(q) ? 2 : 0;
    if (score) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score || (b.p.heat ?? -1) - (a.p.heat ?? -1) || a.p.name.localeCompare(b.p.name));

  const teams = idx.teams.filter(t => allPrefix(t.key, tokens) || normalize(t.abbrev) === q);
  return { players: scored.slice(0, MAX_PLAYERS).map(s => s.p), teams: teams.slice(0, MAX_TEAMS) };
}

export function hotPlayers(idx: SearchIndex, n = 5): SearchPlayer[] {
  return idx.players.filter(p => p.heat != null).sort((a, b) => b.heat! - a.heat!).slice(0, n);
}
