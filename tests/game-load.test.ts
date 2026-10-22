import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: {} }));
import { assertGameQuery } from '@/lib/data';

describe('assertGameQuery', () => {
  it('throws on a failed/timed-out query so ISR keeps the last good page (never a wrong "upcoming" state)', () => {
    expect(() => assertGameQuery({ message: 'TimeoutError: The operation was aborted', code: '' })).toThrow(/Game query failed/);
  });
  it('lets "no such row" through (the page handles a missing game)', () => {
    expect(() => assertGameQuery({ message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' })).not.toThrow();
  });
  it('passes when there is no error', () => {
    expect(() => assertGameQuery(null)).not.toThrow();
  });
});
