import { describe, expect, it } from 'vitest';
import { MODEL_REGISTRY, type TeamSnap } from '@/lib/prediction-models';

const team = (ppm: number, spg = 22): TeamSnap => ({
  energyBar: 100, sosMultiplier: 1, shToiPercentile: 0.5,
  skaters: Array.from({ length: 18 }, () => ({ compositePpm: ppm, momentumPpm: ppm, seasonPpm: ppm, injuryStatus: null })),
  goalie: { momentumShotsPerGoal: spg, seasonShotsPerGoal: spg, energyBar: 100 },
});

describe('v1.9 — v1.8 plus home-ice edge', () => {
  it('is registered', () => {
    expect(MODEL_REGISTRY['v1.9']).toBeTypeOf('function');
  });
  it('gives the home side +4 points in an even matchup', () => {
    const r = MODEL_REGISTRY['v1.9'](team(0.05), team(0.05));
    expect(r.homeWin).toBeCloseTo(0.54, 3);
    expect(r.awayWin).toBeCloseTo(0.46, 3);
  });
  it('shifts v1.8 win probability by exactly the edge and keeps its score projection', () => {
    const h = team(0.04, 25), a = team(0.06, 20);
    const v18 = MODEL_REGISTRY['v1.8'](h, a), v19 = MODEL_REGISTRY['v1.9'](h, a);
    expect(v19.homeWin).toBeCloseTo(v18.homeWin + 0.04, 3);
    expect(v19.homeWin + v19.awayWin).toBeCloseTo(1, 3);
    expect([v19.homeXG, v19.awayXG]).toEqual([v18.homeXG, v18.awayXG]);
  });
  it('picks the home team when v1.8 had it as a slight underdog', () => {
    const h = team(0.049), a = team(0.051);
    expect(MODEL_REGISTRY['v1.8'](h, a).homeWin).toBeLessThan(0.5);
    expect(MODEL_REGISTRY['v1.9'](h, a).homeWin).toBeGreaterThan(0.5);
  });
});

describe('registry', () => {
  it('no longer generates duplicate versions (v1.2 = v1.1 and v1.7 = v1.8 on win probability)', () => {
    expect(Object.keys(MODEL_REGISTRY).sort()).toEqual(['v1.0', 'v1.1', 'v1.3', 'v1.4', 'v1.5', 'v1.6', 'v1.8', 'v1.9']);
  });
});
