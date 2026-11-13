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

// api-web answers bursts with 429; a skipped roster means a team's players are
// never checked, so wait and try again (up to three tries).
export async function fetchNhl<T>(path: string, waitMs = 1_000): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://api-web.nhle.com/v1${path}`, { cache: 'no-store', signal: AbortSignal.timeout(6_000) });
      if (res.ok) return (await res.json()) as T;
      if (res.status !== 429) return null;
    } catch {
      return null;
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, waitMs * (attempt + 1)));
  }
  return null;
}
