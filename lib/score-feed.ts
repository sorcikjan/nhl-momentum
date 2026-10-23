import type { PlayerTally } from '@/lib/ai';

// Scoring facts from the NHL score feed, per game id — the only facts recap
// and game-story prompts may describe, and what their fact checks test against.
export type GameScoring = {
  finish: 'REG' | 'OT' | 'SO';
  goals: string[];        // "P1 05:58 BUF Josh Doan (P. Krebs) EV"
  tallies: PlayerTally[]; // per-player goals and assists, by the feed's short name ("C. Knuble")
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseScoreFeed(feed: { games?: any[] }): Map<number, GameScoring> {
  const out = new Map<number, GameScoring>();
  for (const fg of feed.games ?? []) {
    const type = fg.gameOutcome?.lastPeriodType;
    if (type !== 'REG' && type !== 'OT' && type !== 'SO') continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goalRows = (fg.goals ?? []) as any[];
    const goals = goalRows.map(gl => {
      const per = gl.periodDescriptor?.periodType === 'OT' ? 'OT' : gl.periodDescriptor?.periodType === 'SO' ? 'SO' : `P${gl.period}`;
      const scorer = `${gl.firstName?.default ?? ''} ${gl.lastName?.default ?? gl.name?.default ?? ''}`.trim();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assists = ((gl.assists ?? []) as any[]).map(a => a.name?.default).filter(Boolean).join(', ');
      const tags = [gl.strength && gl.strength !== 'ev' ? gl.strength.toUpperCase() : '', gl.goalModifier === 'empty-net' ? 'EN' : ''].filter(Boolean).join(' ');
      return `${per} ${gl.timeInPeriod} ${gl.teamAbbrev} ${scorer}${assists ? ` (${assists})` : ' (unassisted)'}${tags ? ` ${tags}` : ''}`;
    });
    const tally = new Map<string, PlayerTally>();
    const add = (name: string | undefined, k: 'goals' | 'assists') => {
      if (!name) return;
      const t = tally.get(name) ?? { name, goals: 0, assists: 0 };
      t[k]++;
      tally.set(name, t);
    };
    for (const gl of goalRows) {
      if (gl.periodDescriptor?.periodType === 'SO') continue; // shootout goals aren't goals
      add(gl.name?.default, 'goals');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const a of (gl.assists ?? []) as any[]) add(a.name?.default, 'assists');
    }
    out.set(fg.id, { finish: type, goals, tallies: [...tally.values()] });
  }
  return out;
}

export async function fetchScoreFeed(date: string): Promise<Map<number, GameScoring>> {
  try {
    const res = await fetch(`https://api-web.nhle.com/v1/score/${date}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    return res.ok ? parseScoreFeed(await res.json()) : new Map();
  } catch (err) {
    console.warn('[score-feed] unavailable:', err);
    return new Map();
  }
}
