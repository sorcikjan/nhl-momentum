// Turns the NHL API's raw play-by-play feed into two real, verifiable views:
// a goal-by-goal score progression (for the momentum tracker chart) and a
// recency-ordered feed of notable events (for the "recent action" panel).
// Every field here comes straight from the NHL API — nothing is invented.

export interface MomentumPoint {
  sortOrder: number;
  period: number;
  timeInPeriod: string;
  awayScore: number;
  homeScore: number;
  scorerTeamId: number | null; // null for the synthetic 0–0 start point
}

export interface RecentPlay {
  eventId: number;
  period: number;
  timeInPeriod: string;
  type: 'goal' | 'shot-on-goal' | 'penalty' | 'hit' | 'missed-shot';
  teamAbbrev: string;
  description: string;
}

const NOTABLE_TYPES = new Set(['goal', 'shot-on-goal', 'penalty', 'hit', 'missed-shot']);

// Per-period goal counts, derived from the same goal sequence as the momentum
// chart — used for the "P1 2-1 · P2 1-1 LIVE · P3 –" header strip.
export function periodScoresFromMomentum(momentum: MomentumPoint[], currentPeriod: number) {
  const byPeriod = new Map<number, { away: number; home: number }>();
  let prevAway = 0, prevHome = 0;
  for (const pt of momentum) {
    if (pt.scorerTeamId === null) continue; // synthetic 0–0 start point
    const entry = byPeriod.get(pt.period) ?? { away: 0, home: 0 };
    entry.away += pt.awayScore - prevAway;
    entry.home += pt.homeScore - prevHome;
    byPeriod.set(pt.period, entry);
    prevAway = pt.awayScore;
    prevHome = pt.homeScore;
  }
  const maxPeriod = Math.max(3, currentPeriod, ...byPeriod.keys());
  return Array.from({ length: maxPeriod }, (_, i) => {
    const p = i + 1;
    const scores = byPeriod.get(p);
    return {
      period: p,
      label: p <= 3 ? `P${p}` : p === 4 ? 'OT' : `${p - 3}OT`,
      away: scores?.away ?? 0,
      home: scores?.home ?? 0,
      played: p < currentPeriod || scores !== undefined,
      isCurrent: p === currentPeriod,
    };
  });
}

export function processPlayByPlay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pbp: any,
  homeTeamId: number,
  awayTeamId: number,
  homeAbbrev: string,
  awayAbbrev: string
): { momentum: MomentumPoint[]; recentPlays: RecentPlay[] } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plays = (pbp?.plays as Array<Record<string, any>>) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rosterSpots = (pbp?.rosterSpots as Array<Record<string, any>>) ?? [];

  const nameById = new Map<number, string>();
  for (const r of rosterSpots) {
    const first = r.firstName?.default ?? '';
    const last = r.lastName?.default ?? '';
    nameById.set(r.playerId, `${first[0] ? first[0] + '. ' : ''}${last}`);
  }
  const abbrevByTeamId = new Map<number, string>([
    [homeTeamId, homeAbbrev],
    [awayTeamId, awayAbbrev],
  ]);

  const goals = plays
    .filter(p => p.typeDescKey === 'goal')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const momentum: MomentumPoint[] = [
    { sortOrder: 0, period: 1, timeInPeriod: '00:00', awayScore: 0, homeScore: 0, scorerTeamId: null },
    ...goals.map(g => ({
      sortOrder: g.sortOrder as number,
      period: g.periodDescriptor?.number ?? 1,
      timeInPeriod: g.timeInPeriod as string,
      awayScore: g.details?.awayScore ?? 0,
      homeScore: g.details?.homeScore ?? 0,
      scorerTeamId: g.details?.eventOwnerTeamId ?? null,
    })),
  ];

  const recentPlays: RecentPlay[] = plays
    .filter(p => NOTABLE_TYPES.has(p.typeDescKey))
    .sort((a, b) => b.sortOrder - a.sortOrder)
    .slice(0, 8)
    .map((p): RecentPlay => {
      const d = p.details ?? {};
      const teamAbbrev = abbrevByTeamId.get(d.eventOwnerTeamId) ?? '';
      let description = '';
      switch (p.typeDescKey) {
        case 'goal': {
          const scorer = nameById.get(d.scoringPlayerId) ?? 'Goal';
          const assists = [d.assist1PlayerId, d.assist2PlayerId]
            .filter(Boolean)
            .map(id => nameById.get(id))
            .filter(Boolean);
          description = assists.length ? `${scorer} · assists: ${assists.join(', ')}` : `${scorer} · unassisted`;
          break;
        }
        case 'shot-on-goal':
          description = `${nameById.get(d.shootingPlayerId) ?? 'Shot'} — on goal`;
          break;
        case 'missed-shot':
          description = `${nameById.get(d.shootingPlayerId) ?? 'Shot'} wide${d.reason ? ` (${String(d.reason).replace('-', ' ')})` : ''}`;
          break;
        case 'penalty':
          description = `${nameById.get(d.committedByPlayerId) ?? 'Penalty'} · ${d.duration ?? 2} min · ${d.descKey ?? 'infraction'}`;
          break;
        case 'hit':
          description = `${nameById.get(d.hittingPlayerId) ?? 'Hit'} on ${nameById.get(d.hitteePlayerId) ?? ''}`;
          break;
      }
      return {
        eventId: p.eventId,
        period: p.periodDescriptor?.number ?? 1,
        timeInPeriod: p.timeInPeriod,
        type: p.typeDescKey,
        teamAbbrev,
        description,
      };
    });

  return { momentum, recentPlays };
}
