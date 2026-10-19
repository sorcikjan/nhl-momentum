import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: {} }));
import { regularSeasonGameIdRange } from '@/lib/data';

describe('regularSeasonGameIdRange', () => {
  it('covers regular-season game ids only (excludes playoffs Y03…)', () => {
    expect(regularSeasonGameIdRange(new Date('2026-10-19T12:00:00Z'))).toEqual([2026020000, 2026030000]);
    expect(regularSeasonGameIdRange(new Date('2027-04-01T12:00:00Z'))).toEqual([2026020000, 2026030000]);
  });
});
