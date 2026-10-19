import { describe, expect, it } from 'vitest';
import { TEAMS, teamColor } from '@/lib/team-colors';

describe('teamColor', () => {
  it('returns the design colors for a known team', () => {
    expect(teamColor('EDM')).toEqual({ bg: '#041E42', fg: '#FF4C00', name: 'Edmonton' });
    expect(teamColor('UTA').bg).toBe('#71AFE5');
  });

  it('falls back to neutral tokens for an unknown code', () => {
    const c = teamColor('XXX');
    expect(c.name).toBe('XXX');
    expect(c.bg).toBe('var(--bg-raised)');
  });

  it('covers all 32 teams', () => {
    expect(Object.keys(TEAMS)).toHaveLength(32);
  });
});
