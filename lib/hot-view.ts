// The Heat Index page (/hot): built for someone who lands here from a search
// and needs to get it in seconds — what Heat is, who leads, who's rising or
// falling, who's hot on their team — with the same rows as the homepage.
import { heatLeader, type HeatLeader } from '@/lib/home';
import { skaterRow, type PlayerRowData } from '@/lib/player-row';
import { pacePct } from '@/lib/player-row';

export type TeamHot = { team: string; teamName: string; row: PlayerRowData };
export type HotView = {
  leader: HeatLeader | null; top: PlayerRowData[]; more: PlayerRowData[];
  heatingUp: PlayerRowData[]; coolingOff: PlayerRowData[]; teams: TeamHot[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function hotView(r: { momentumLeaders?: { skaters?: any[] }; breakoutWatch?: any[]; coolingWatch?: any[]; hottestByTeam?: any[] } | null): HotView {
  const leaders = r?.momentumLeaders?.skaters ?? [];
  const shown = new Set(leaders.slice(0, 10).map(s => s.player_id));
  return {
    leader: leaders[0] ? heatLeader(leaders[0]) : null,
    top: leaders.slice(1, 10).map((s, i) => skaterRow(s, String(i + 2), 'rank')),
    more: leaders.slice(10, 50).map((s, i) => skaterRow(s, String(i + 11), 'rank')),
    // New names only: not the ones already in the top ten.
    heatingUp: (r?.breakoutWatch ?? []).filter(s => !shown.has(s.player_id) && (pacePct(s.momentum_ppm, s.season_ppm) ?? 0) > 0).slice(0, 10).map(s => skaterRow(s, '↑', 'up')),
    coolingOff: (r?.coolingWatch ?? []).slice(0, 10).map(s => skaterRow(s, '↓', 'cool')),
    teams: (r?.hottestByTeam ?? []).map(s => ({ team: s.players?.teams?.abbrev ?? '', teamName: s.players?.teams?.name ?? '', row: skaterRow(s, '', 'rank') })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
