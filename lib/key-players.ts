// "Key players": three per team for every game. Before the game, who to watch
// and why (from Heat + recent form); after it, who decided it (from the box score).
// Every line is computed from real data — nothing is generated or invented.
import { ppmToHeat } from '@/lib/heat';
import { playerUrl } from '@/lib/urls';

export type KeyPlayer = {
  playerId: number; name: string; href: string; photo: string | null; team: string; pos: string;
  heat: number | null; line: string; delta?: number | null;
};

export type SnapSkater = {
  playerId: number; playerName: string; position?: string | null;
  compositePpm?: number | null; momentumPpm?: number | null; seasonPpm?: number | null; injuryStatus?: string | null;
};
export type RecentForm = { goals: number; assists: number; games: number; photo?: string | null };

const split = (full: string): [string, string] => {
  const sp = full.indexOf(' ');
  return sp > 0 ? [full.slice(0, sp), full.slice(sp + 1)] : [full, ''];
};
const heatOf = (s: SnapSkater) => ppmToHeat(s.momentumPpm ?? s.compositePpm ?? 0);

// One short, factual reason to watch, strongest signal first.
export function whyWatch(f: RecentForm | undefined, momentumPpm: number, seasonPpm: number, teamRank: number): string {
  const pts = f ? f.goals + f.assists : 0;
  if (f && f.games > 0 && pts / f.games >= 1) return `${pts} pts in last ${f.games}`;
  const pace = seasonPpm > 0 ? Math.round(((momentumPpm - seasonPpm) / seasonPpm) * 100) : null;
  if (pace != null && pace >= 25) return `+${pace}% vs season pace`;
  if (f && f.goals >= 2) return `${f.goals} goals in last ${f.games}`;
  if (f && pts > 0) return `${pts} pts in last ${f.games}`;
  return `#${teamRank} Heat on his team`;
}

export function pregameKeyPlayers(skaters: SnapSkater[], form: Map<number, RecentForm>, team: string): KeyPlayer[] {
  return skaters
    .filter(s => !s.injuryStatus)
    .sort((a, b) => heatOf(b) - heatOf(a))
    .slice(0, 3)
    .map((s, i) => {
      const f = form.get(s.playerId);
      return {
        playerId: s.playerId, name: s.playerName, href: playerUrl(s.playerId, ...split(s.playerName)),
        photo: f?.photo ?? null, team, pos: s.position ?? '', heat: heatOf(s),
        line: whyWatch(f, s.momentumPpm ?? s.compositePpm ?? 0, s.seasonPpm ?? s.compositePpm ?? 0, i + 1),
      };
    });
}

type StatRow = {
  player_id: number; goals: number; assists: number; shots_on_goal?: number | null; plus_minus?: number | null;
  players?: { first_name: string; last_name: string; position_code?: string | null; headshot_url?: string | null } | null;
};
type GoalieRow = {
  player_id: number; shots_against: number; goals_against: number; save_pct: number | null;
  players?: { first_name: string; last_name: string; headshot_url?: string | null } | null;
};

export function statLine(s: { goals: number; assists: number; shots_on_goal?: number | null; plus_minus?: number | null }): string {
  const ga = [s.goals ? `${s.goals}G` : '', s.assists ? `${s.assists}A` : ''].filter(Boolean).join(' ');
  const pm = s.plus_minus ?? 0;
  return [ga, s.shots_on_goal ? `${s.shots_on_goal} SOG` : '', pm ? `${pm > 0 ? '+' : ''}${pm}` : ''].filter(Boolean).join(' · ');
}

// A goalie earns a spot with a shutout, or 30+ saves at .930 or better.
function goalieLine(g: GoalieRow): string | null {
  const saves = g.shots_against - g.goals_against;
  if (g.goals_against === 0 && g.shots_against >= 15) return `Shutout · ${saves} saves`;
  if (saves >= 30 && (g.save_pct ?? 0) >= 0.93) return `${saves} saves · ${(g.save_pct ?? 0).toFixed(3).replace(/^0/, '')}`;
  return null;
}

export function postgameKeyPlayers(stats: StatRow[], goalie: GoalieRow | null, team: string, heatDelta: Map<number, number>): KeyPlayer[] {
  const pts = (s: StatRow) => s.goals + s.assists;
  const skaters: KeyPlayer[] = [...stats]
    .sort((a, b) => pts(b) - pts(a) || b.goals - a.goals || (b.shots_on_goal ?? 0) - (a.shots_on_goal ?? 0) || (b.plus_minus ?? 0) - (a.plus_minus ?? 0))
    .slice(0, 3)
    .map(s => {
      const first = s.players?.first_name ?? '', last = s.players?.last_name ?? '';
      return {
        playerId: s.player_id, name: `${first} ${last}`.trim(), href: playerUrl(s.player_id, first, last),
        photo: s.players?.headshot_url ?? null, team, pos: s.players?.position_code ?? '', heat: null,
        line: statLine(s) || 'No points', delta: heatDelta.get(s.player_id) ?? null,
      };
    });
  const gl = goalie ? goalieLine(goalie) : null;
  if (!goalie || !gl) return skaters;
  const first = goalie.players?.first_name ?? '', last = goalie.players?.last_name ?? '';
  const g: KeyPlayer = {
    playerId: goalie.player_id, name: `${first} ${last}`.trim(), href: playerUrl(goalie.player_id, first, last),
    photo: goalie.players?.headshot_url ?? null, team, pos: 'G', heat: null, line: gl, delta: null,
  };
  return [...skaters.slice(0, 2), g];
}
