// Checks the last-5 numbers a Reddit post states against NHL.com's game logs
// before anyone posts them. Reddit readers check; one wrong number and the
// post (and the account) is done. Our own data has been stale before (a cached
// page served 3-day-old numbers on 2026-11-09).
import { currentSeason, getSkaterGameLog } from '@/lib/nhl-api';
import type { DeskPlayer } from '@/lib/reddit-desk';

export type Check = { name: string; ok: boolean; ours: string; nhl: string | null };

// Live, not from the data cache: a cached log is served stale first and refreshed
// after, which once showed Hertl's numbers from a week earlier.
export async function verifyLast5(players: DeskPlayer[]): Promise<Check[]> {
  const season = currentSeason();
  return Promise.all(players.map(async p => {
    const ours = `${p.goals}G ${p.assists}A`;
    try {
      const log = (await getSkaterGameLog(p.playerId, season, 0)).gameLog as { goals: number; assists: number; gameDate: string }[];
      const last = [...log].sort((a, b) => b.gameDate.localeCompare(a.gameDate)).slice(0, p.games);
      const nhl = `${last.reduce((s, g) => s + g.goals, 0)}G ${last.reduce((s, g) => s + g.assists, 0)}A`;
      return { name: p.name, ok: nhl === ours, ours, nhl };
    } catch {
      return { name: p.name, ok: false, ours, nhl: null };
    }
  }));
}
