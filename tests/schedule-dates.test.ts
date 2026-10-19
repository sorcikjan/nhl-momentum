import { describe, expect, it } from 'vitest';
import { withScheduleDates } from '@/lib/data';

describe('withScheduleDates', () => {
  it('tags each game with the schedule day it was listed under, not its UTC start date', () => {
    const late: { id: number; startTimeUTC: string; gameDate?: string } = { id: 2026020140, startTimeUTC: '2026-10-20T01:00:00Z' }; // 9 PM ET on Oct 19
    const out = withScheduleDates(['2026-10-19', '2026-10-20'], [[late], [{ id: 2026020141, startTimeUTC: '2026-10-20T23:00:00Z' }]]);
    expect(out.map(g => g.gameDate)).toEqual(['2026-10-19', '2026-10-20']);
  });
  it('keeps an existing gameDate', () => {
    expect(withScheduleDates(['2026-10-19'], [[{ id: 1, gameDate: '2026-10-18' }]])[0].gameDate).toBe('2026-10-18');
  });
});
