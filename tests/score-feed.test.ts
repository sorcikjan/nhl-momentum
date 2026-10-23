import { describe, expect, it } from 'vitest';
import { parseScoreFeed } from '@/lib/score-feed';

const goal = (team: string, first: string, last: string, assists: string[], period = 1, type = 'REG') => ({
  teamAbbrev: team, firstName: { default: first }, lastName: { default: last }, name: { default: `${first[0]}. ${last}` },
  period, timeInPeriod: '10:00', periodDescriptor: { periodType: type }, assists: assists.map(a => ({ name: { default: a } })),
});

describe('parseScoreFeed', () => {
  it('tallies goals and assists per player and skips shootout goals', () => {
    const feed = { games: [{
      id: 1, gameOutcome: { lastPeriodType: 'SO' }, goals: [
        goal('SJS', 'Macklin', 'Celebrini', ['T. Toffoli']),
        goal('SJS', 'Macklin', 'Celebrini', []),
        goal('MTL', 'Nick', 'Suzuki', ['M. Celebrini']),
        goal('SJS', 'Macklin', 'Celebrini', [], 5, 'SO'),
      ],
    }, { id: 2, gameOutcome: { lastPeriodType: null }, goals: [] }] };
    const out = parseScoreFeed(feed);
    expect([...out.keys()]).toEqual([1]); // unfinished games are left out
    const g = out.get(1)!;
    expect(g.finish).toBe('SO');
    expect(g.tallies.find(t => t.name === 'M. Celebrini')).toEqual({ name: 'M. Celebrini', goals: 2, assists: 1 });
    expect(g.goals[0]).toBe('P1 10:00 SJS Macklin Celebrini (T. Toffoli)');
  });
});
