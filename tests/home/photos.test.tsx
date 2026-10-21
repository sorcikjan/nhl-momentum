import { describe, expect, it } from 'vitest';
import { lastNames } from '@/components/ds/KeyLine';

describe('lastNames', () => {
  it('keeps multi-word last names', () => {
    expect(lastNames(['Connor McDavid', 'Tage Van Thompson', 'Pelé'])).toBe('McDavid · Van Thompson · Pelé');
  });
});
