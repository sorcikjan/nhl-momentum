import { describe, expect, it } from 'vitest';
import { SECTION_META, gameView, pickHeadline, sectionPlan } from '@/lib/game-state';

describe('gameView', () => {
  it('maps NHL game states to the three page states', () => {
    expect(gameView('FUT')).toBe('upcoming');
    expect(gameView('PRE')).toBe('upcoming');
    expect(gameView('LIVE')).toBe('live');
    expect(gameView('CRIT')).toBe('live');
    expect(gameView('OFF')).toBe('final');
    expect(gameView('FINAL')).toBe('final');
  });
  it('treats unknown or missing states as upcoming', () => {
    expect(gameView(null)).toBe('upcoming');
    expect(gameView('XYZ')).toBe('upcoming');
  });
});

describe('sectionPlan', () => {
  const all = new Set(Object.keys(SECTION_META));
  it('orders upcoming sections like the design', () => {
    expect(sectionPlan('upcoming', all)).toEqual({ main: ['prediction', 'goalies', 'watch', 'specialTeams'], side: ['h2h', 'lineup'] });
  });
  it('orders live and final sections like the design', () => {
    expect(sectionPlan('live', all)).toEqual({ main: ['momentum', 'playByPlay'], side: ['winProb', 'liveStats', 'topPerformers'] });
    expect(sectionPlan('final', all)).toEqual({ main: ['threeStars', 'pick', 'heatImpact'], side: ['recap', 'highlights'] });
  });
  it('drops sections without data but keeps the rest', () => {
    const plan = sectionPlan('upcoming', new Set(['goalies', 'watch']));
    expect(plan.main).toEqual(['goalies', 'watch']);
    expect(plan.side).toEqual([]);
  });
  it('has no playoff-only sections and labels lineups as projected', () => {
    const text = JSON.stringify(SECTION_META);
    expect(text).not.toMatch(/SERIES|PLAYOFF/);
    expect(SECTION_META.lineup.kicker).toBe('LINEUP · PROJECTED');
  });
});

describe('pickHeadline', () => {
  it('never claims a hit on a miss', () => {
    expect(pickHeadline(true)).toBe('The model called it.');
    expect(pickHeadline(false)).toBe('The model missed this one.');
    expect(pickHeadline(null)).toBe('How our pick played.');
  });
});
