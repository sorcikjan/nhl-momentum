// A team's next game from the NHL club schedule (no database).

type WeekGame = { gameDate: string; gameState: string; homeTeam: { abbrev: string }; awayTeam: { abbrev: string } };
const UPCOMING = new Set(['FUT', 'PRE', 'LIVE', 'CRIT']);

export function nextGameFrom(week: { games?: WeekGame[] }, team: string): { date: string; label: string } | null {
  const g = (week.games ?? []).find(x => UPCOMING.has(x.gameState));
  if (!g) return null;
  const home = g.homeTeam.abbrev === team;
  const dow = new Date(`${g.gameDate}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  return { date: g.gameDate, label: `${dow} ${home ? 'vs' : '@'} ${home ? g.awayTeam.abbrev : g.homeTeam.abbrev}` };
}

export async function nextGame(team: string, today: string): Promise<{ date: string; label: string } | null> {
  if (!team) return null;
  try {
    const res = await fetch(`https://api-web.nhle.com/v1/club-schedule/${team}/week/${today}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8_000) });
    return res.ok ? nextGameFrom(await res.json(), team) : null;
  } catch {
    return null;
  }
}
