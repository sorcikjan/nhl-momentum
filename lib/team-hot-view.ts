// The hottest NHL teams (/hot/teams): all 32 teams by Team Heat (the average
// Heat of a team's five hottest skaters, lib/team-heat.ts), each next to the
// league average and its record over the last 10 games, so the number we
// invent sits beside one everybody knows. Built from the saved rankings and
// the NHL standings: no database reads of its own.
// Bing showed people searching "hottest team in the NHL right now" (Nov 2026).
import { skaterRow, type PlayerRowData } from '@/lib/player-row';
import type { StandingRow } from '@/lib/nhl-stats';

export type TeamHotRow = {
  rank: number; abbrev: string; name: string; href: string | null;
  heat: number;
  // Team Heat minus the league average, rounded.
  vsAvg: number;
  l10: string | null; streak: string | null;
  hottest: PlayerRowData | null;
};
export type TeamHotView = { rows: TeamHotRow[]; leagueAvg: number | null };

/* eslint-disable @typescript-eslint/no-explicit-any */
export function teamHotView(
  r: { teamHeat?: Record<string, number>; teams?: Record<string, { id: number; name: string }>; hottestByTeam?: any[] } | null,
  standings: StandingRow[] = [],
  teamHref: (id: number, name: string) => string = () => '',
): TeamHotView {
  const heat = r?.teamHeat ?? {};
  const entries = Object.entries(heat).filter(([abbrev]) => abbrev);
  if (!entries.length) return { rows: [], leagueAvg: null };
  const leagueAvg = Math.round(entries.reduce((s, [, h]) => s + h, 0) / entries.length);
  const byAbbrev = new Map(standings.map(s => [s.abbrev, s]));
  const hottest = new Map((r?.hottestByTeam ?? []).map(s => [s.players?.teams?.abbrev as string, s]));
  const rows = entries
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([abbrev, h], i) => {
      const team = r?.teams?.[abbrev];
      const st = byAbbrev.get(abbrev);
      const top = hottest.get(abbrev);
      return {
        rank: i + 1, abbrev,
        name: team?.name ?? st?.name ?? abbrev,
        href: team ? teamHref(team.id, team.name) : st?.href ?? null,
        heat: h, vsAvg: h - leagueAvg,
        l10: st?.l10 ?? null, streak: st?.streak || null,
        hottest: top ? skaterRow(top, '', 'rank') : null,
      };
    });
  return { rows, leagueAvg };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
