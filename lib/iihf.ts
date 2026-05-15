// TheSportsDB — free, no API key required
const TSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const TSDB_WC_LEAGUE = 4976; // Mens Ice Hockey World Championships

// API-Sports — keyed, used only for live in-game status overlay
const APISPORTS_BASE = 'https://v1.hockey.api-sports.io';
export const WC_APISPORTS_LEAGUE = 111;
export const WC_SEASON = 2026;

export const TEAM_FLAG: Record<string, string> = {
  Canada: '🇨🇦', USA: '🇺🇸', Sweden: '🇸🇪', Finland: '🇫🇮',
  Russia: '🇷🇺', 'Czech Republic': '🇨🇿', Slovakia: '🇸🇰', Germany: '🇩🇪',
  Austria: '🇦🇹', Switzerland: '🇨🇭', Norway: '🇳🇴', Denmark: '🇩🇰',
  Latvia: '🇱🇻', Belarus: '🇧🇾', Ukraine: '🇺🇦', France: '🇫🇷',
  Hungary: '🇭🇺', Slovenia: '🇸🇮', Kazakhstan: '🇰🇿', Poland: '🇵🇱',
  Italy: '🇮🇹', 'Great Britain': '🇬🇧',
};

// Strip " Ice Hockey" suffix from TheSportsDB team names
function normName(raw: string): string {
  return raw.replace(/\s+Ice\s+Hockey$/i, '').trim();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TSDBEvent {
  idEvent: string;
  idAPIfootball?: string;   // API-Sports cross-reference
  strHomeTeam: string;      // "Canada Ice Hockey"
  strAwayTeam: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strHomeTeamBadge: string;
  strAwayTeamBadge: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;        // "2026-05-15"
  strTime: string;          // "14:20:00" UTC
  strTimeLocal: string;     // "16:20:00" local (CET)
  strStatus: string;        // "NS" | "FT" | "AOT" | "AP" | "LIVE"
  strVideo: string | null;
}

export interface WCTeam {
  id: number;
  name: string;
  logo: string;
}

export interface WCStanding {
  position: number;
  group: { name: string };
  team: WCTeam;
  games: {
    played: number;
    win: { total: number };
    win_overtime: { total: number };
    lose: { total: number };
    lose_overtime: { total: number };
  };
  goals: { for: number; against: number };
  points: number;
  form: string;
  description: string | null;
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function tsdbFetch(path: string, revalidate = 1800): Promise<TSDBEvent[]> {
  try {
    const res = await fetch(`${TSDB_BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return [];
    const json = await res.json() as Record<string, unknown>;
    const first = Object.values(json)[0];
    return Array.isArray(first) ? (first as TSDBEvent[]) : [];
  } catch {
    return [];
  }
}

// Full 2026 WC schedule — free, no key. Revalidates every 30 min.
export async function fetchWCSchedule(): Promise<TSDBEvent[]> {
  return tsdbFetch(`/eventsseason.php?id=${TSDB_WC_LEAGUE}&s=${WC_SEASON}`, 1800);
}

// Today's WC games with live status from API-Sports (keyed).
// Returns a Map of apiSportsGameId → { status, elapsed, homeScore, awayScore }
export async function fetchLiveStatus(): Promise<Map<string, { status: string; elapsed: string | null; homeScore: number | null; awayScore: number | null }>> {
  const key = process.env.API_SPORTS_KEY;
  if (!key) return new Map();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`${APISPORTS_BASE}/games?date=${today}`, {
      headers: { 'x-apisports-key': key },
      next: { revalidate: 60 },
    });
    if (!res.ok) return new Map();
    const json = await res.json() as { response?: unknown[] };
    const games = (json.response ?? []) as Array<{
      id: number;
      league: { id: number };
      status: { short: string; elapsed: string | null };
      scores: { home: { total: number } | null; away: { total: number } | null };
    }>;
    const map = new Map<string, { status: string; elapsed: string | null; homeScore: number | null; awayScore: number | null }>();
    for (const g of games) {
      if (g.league?.id !== WC_APISPORTS_LEAGUE) continue;
      map.set(String(g.id), {
        status: g.status.short,
        elapsed: g.status.elapsed,
        homeScore: g.scores.home?.total ?? null,
        awayScore: g.scores.away?.total ?? null,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

// ── Group derivation ──────────────────────────────────────────────────────────

// Groups derived from matchup graph connectivity (BFS).
// Canada confirmed Group B via individual event lookup — used as anchor.
export function deriveGroups(events: TSDBEvent[]): Map<string, 'Group A' | 'Group B'> {
  const adj = new Map<string, Set<string>>();
  const ensure = (n: string) => { if (!adj.has(n)) adj.set(n, new Set()); };
  for (const e of events) {
    const h = normName(e.strHomeTeam);
    const a = normName(e.strAwayTeam);
    ensure(h); ensure(a);
    adj.get(h)!.add(a);
    adj.get(a)!.add(h);
  }

  const visited = new Set<string>();
  const components: string[][] = [];
  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      const comp: string[] = [];
      const q = [node];
      while (q.length) {
        const cur = q.shift()!;
        if (visited.has(cur)) continue;
        visited.add(cur); comp.push(cur);
        for (const nb of adj.get(cur)!) if (!visited.has(nb)) q.push(nb);
      }
      components.push(comp);
    }
  }

  const result = new Map<string, 'Group A' | 'Group B'>();
  for (const comp of components) {
    // Canada is Group B (confirmed via API lookup of game 2354269)
    const label: 'Group A' | 'Group B' = comp.includes('Canada') ? 'Group B' : 'Group A';
    comp.forEach(t => result.set(t, label));
  }
  return result;
}

// ── Standings builder ─────────────────────────────────────────────────────────

export function buildStandingsFromSchedule(events: TSDBEvent[]): { groupA: WCStanding[]; groupB: WCStanding[] } {
  const groups = deriveGroups(events);

  // Collect teams from all events
  const teams = new Map<string, WCTeam>();
  for (const e of events) {
    const hn = normName(e.strHomeTeam);
    const an = normName(e.strAwayTeam);
    if (!teams.has(hn)) teams.set(hn, { id: Number(e.idHomeTeam), name: hn, logo: e.strHomeTeamBadge });
    if (!teams.has(an)) teams.set(an, { id: Number(e.idAwayTeam), name: an, logo: e.strAwayTeamBadge });
  }

  // Compute records from finished games
  type Rec = { w: number; otw: number; otl: number; l: number; gf: number; ga: number; form: string[] };
  const rec = new Map<string, Rec>();
  const ensureRec = (n: string) => { if (!rec.has(n)) rec.set(n, { w:0, otw:0, otl:0, l:0, gf:0, ga:0, form:[] }); };

  for (const e of events) {
    if (!['FT', 'AOT', 'AP'].includes(e.strStatus)) continue;
    const hn = normName(e.strHomeTeam);
    const an = normName(e.strAwayTeam);
    const hs = Number(e.intHomeScore ?? 0);
    const as_ = Number(e.intAwayScore ?? 0);
    const isOT = e.strStatus === 'AOT' || e.strStatus === 'AP';
    ensureRec(hn); ensureRec(an);
    const h = rec.get(hn)!; const a = rec.get(an)!;
    h.gf += hs; h.ga += as_; a.gf += as_; a.ga += hs;
    if (hs > as_) {
      if (isOT) { h.otw++; h.form.push('O'); a.otl++; a.form.push('O'); }
      else { h.w++; h.form.push('W'); a.l++; a.form.push('L'); }
    } else if (as_ > hs) {
      if (isOT) { a.otw++; a.form.push('O'); h.otl++; h.form.push('O'); }
      else { a.w++; a.form.push('W'); h.l++; h.form.push('L'); }
    }
  }

  const makeStanding = (name: string, pos: number): WCStanding => {
    const team = teams.get(name)!;
    const r = rec.get(name) ?? { w:0, otw:0, otl:0, l:0, gf:0, ga:0, form:[] };
    return {
      position: pos,
      group: { name: groups.get(name) ?? 'Group A' },
      team,
      games: { played: r.w+r.otw+r.otl+r.l, win: { total: r.w }, win_overtime: { total: r.otw }, lose: { total: r.l }, lose_overtime: { total: r.otl } },
      goals: { for: r.gf, against: r.ga },
      points: r.w*3 + r.otw*2 + r.otl,
      form: r.form.join(''),
      description: null,
    };
  };

  const sortNames = (names: string[]) => [...names].sort((a, b) => {
    const ra = rec.get(a) ?? { w:0, otw:0, otl:0, l:0, gf:0, ga:0 };
    const rb = rec.get(b) ?? { w:0, otw:0, otl:0, l:0, gf:0, ga:0 };
    const pa = ra.w*3+ra.otw*2+ra.otl, pb = rb.w*3+rb.otw*2+rb.otl;
    if (pa !== pb) return pb - pa;
    return (rb.gf - rb.ga) - (ra.gf - ra.ga);
  });

  const aNames = sortNames([...teams.keys()].filter(n => (groups.get(n) ?? 'Group A') === 'Group A'));
  const bNames = sortNames([...teams.keys()].filter(n => (groups.get(n) ?? 'Group A') === 'Group B'));

  return {
    groupA: aNames.map((n, i) => makeStanding(n, i+1)),
    groupB: bNames.map((n, i) => makeStanding(n, i+1)),
  };
}

// ── Heat ──────────────────────────────────────────────────────────────────────

export function computeTeamHeats(standings: WCStanding[]): Map<number, number> {
  const active = standings.filter(s => s.games.played > 0);
  const maxGpg = active.length > 0
    ? Math.max(...active.map(s => s.goals.for / s.games.played))
    : 1;

  const map = new Map<number, number>();
  for (const s of standings) {
    if (s.games.played === 0) { map.set(s.team.id, 50); continue; }
    const recent = (s.form ?? '').slice(-3).split('');
    const formScore = recent.length > 0
      ? (recent.reduce((acc, c) => acc + (c === 'W' ? 1 : c === 'L' ? 0 : 0.5), 0) / recent.length) * 100
      : 50;
    const offScore = (s.goals.for / s.games.played / maxGpg) * 100;
    const heat = Math.round(formScore * 0.6 + offScore * 0.4);
    map.set(s.team.id, Math.max(1, Math.min(99, heat)));
  }
  return map;
}
