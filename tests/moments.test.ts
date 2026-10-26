import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { bestGoals } from '@/lib/moments';
import { BestGoals } from '@/components/home/BestGoals';

type G = { team: string; period?: number; time: string; h: number; a: number; ot?: boolean; mod?: string; str?: string; pid?: number };
const goal = (x: G) => ({
  period: x.ot ? 4 : x.period ?? 1, periodDescriptor: { periodType: x.ot ? 'OT' : 'REG' }, timeInPeriod: x.time,
  playerId: x.pid ?? Math.round(x.h * 10 + x.a + (x.period ?? 0) * 100), firstName: { default: 'A' }, lastName: { default: `P${x.pid ?? x.h}${x.a}` },
  teamAbbrev: x.team, homeScore: x.h, awayScore: x.a, goalModifier: x.mod ?? 'none', strength: x.str ?? 'ev', goalsToDate: 2,
  highlightClipSharingUrl: `https://nhl.com/video/${x.team}-${x.h}-${x.a}-${x.time}`, mugshot: null,
});
const game = (id: number, home: string, away: string, hs: number, as: number, goals: G[], last = 'REG') => ({
  id, gameOutcome: { lastPeriodType: last }, homeTeam: { abbrev: home, score: hs }, awayTeam: { abbrev: away, score: as }, goals: goals.map(goal),
});

describe('bestGoals', () => {
  const feed = { games: [
    // OT winner, a late equalizer before it
    game(1, 'FLA', 'CHI', 3, 2, [
      { team: 'CHI', time: '02:34', h: 0, a: 1 }, { team: 'FLA', period: 2, time: '05:00', h: 1, a: 1 },
      { team: 'CHI', period: 3, time: '04:00', h: 1, a: 2 }, { team: 'FLA', period: 3, time: '18:54', h: 2, a: 2 },
      { team: 'FLA', ot: true, time: '01:44', h: 3, a: 2 },
    ], 'OT'),
    // blowout with an empty-netter and a shorthanded goal at 4-0
    game(2, 'BOS', 'TOR', 6, 0, [
      { team: 'BOS', time: '01:00', h: 1, a: 0 }, { team: 'BOS', time: '03:00', h: 2, a: 0 }, { team: 'BOS', period: 2, time: '03:00', h: 3, a: 0 },
      { team: 'BOS', period: 2, time: '09:00', h: 4, a: 0 }, { team: 'BOS', period: 3, time: '10:00', h: 5, a: 0, str: 'sh' },
      { team: 'BOS', period: 3, time: '19:00', h: 6, a: 0, mod: 'empty-net' },
    ]),
  ] };
  const picks = bestGoals(feed);
  it('the deciding goals first, labelled by what made them matter', () => {
    expect(picks.map(p => p.kicker)).toEqual(['OT WINNER', 'LATE EQUALIZER', 'GAME WINNER']);
    expect(picks[0]).toMatchObject({ score: 'FLA 3–2 CHI', when: 'OT 1:44' });
    expect(picks[1].when).toBe('3rd 18:54');
  });
  it('no empty-netters, no goals in a blowout', () => {
    expect(picks.some(p => p.gameId === 2 && p.kicker.includes('SHORTHANDED'))).toBe(false);
  });
  it('a strip needs at least two goals', () => {
    expect(renderToStaticMarkup(createElement(BestGoals, { moments: picks.slice(0, 1) }))).toBe('');
    const html = renderToStaticMarkup(createElement(BestGoals, { moments: picks }));
    expect(html).toContain('target="_blank"');
    expect(html).toContain('BEST GOALS LAST NIGHT');
  });
});
