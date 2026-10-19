import { describe, expect, it } from 'vitest';
import { ppmToHeat } from '@/lib/heat';

describe('test harness', () => {
  it('resolves @/ imports and runs', () => {
    expect(ppmToHeat(0.12)).toBe(100);
    expect(ppmToHeat(null)).toBe(0);
  });
});
