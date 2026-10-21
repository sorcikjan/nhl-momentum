// "Key players": the three highest pre-game Heat skaters per team, with a
// short factual reason to watch (Heat + recent form).
// Every line is computed from real data — nothing is generated or invented.
import { ppmToHeat } from '@/lib/heat';
import { playerUrl } from '@/lib/urls';

export type KeyPlayer = {
  playerId: number; name: string; href: string; photo: string | null; team: string; pos: string;
  heat: number | null; line: string;
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

// `limit` > 3 gives a deeper pool, so finished games can skip players who didn't dress.
export function pregameKeyPlayers(skaters: SnapSkater[], form: Map<number, RecentForm>, team: string, limit = 3): KeyPlayer[] {
  return skaters
    .filter(s => !s.injuryStatus)
    .sort((a, b) => heatOf(b) - heatOf(a))
    .slice(0, limit)
    .map((s, i) => {
      const f = form.get(s.playerId);
      return {
        playerId: s.playerId, name: s.playerName, href: playerUrl(s.playerId, ...split(s.playerName)),
        photo: f?.photo ?? null, team, pos: s.position ?? '', heat: heatOf(s),
        line: whyWatch(f, s.momentumPpm ?? s.compositePpm ?? 0, s.seasonPpm ?? s.compositePpm ?? 0, i + 1),
      };
    });
}
