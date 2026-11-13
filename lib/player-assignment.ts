// Where a player is assigned: the NHL roster is the truth. A player missing
// from his team's current NHL roster who has games this season in a minor or
// European league is in the minors (or on loan); one missing without such
// games is injured, suspended or unsigned — not our call here.

export type SeasonTotal = { season: number; leagueAbbrev: string; gameTypeId: number; gamesPlayed: number };

export const MINOR_LEAGUES: ReadonlySet<string> = new Set([
  'AHL', 'ECHL', 'SPHL', 'OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA',
  'Czechia', 'Czechia2', 'Slovakia', 'SHL', 'HockeyAllsvenskan', 'Liiga', 'KHL', 'DEL', 'NL', 'ICEHL',
]);

export function inMinors(onNhlRoster: boolean, seasonTotals: SeasonTotal[], season: number): boolean {
  if (onNhlRoster) return false;
  return seasonTotals.some(s => s.season === season && s.gameTypeId === 2 && s.gamesPlayed > 0 && MINOR_LEAGUES.has(s.leagueAbbrev));
}
