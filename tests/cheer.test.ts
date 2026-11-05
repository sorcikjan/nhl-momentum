import { describe, expect, it } from 'vitest';
import { ENGLISH, NICKNAMES, parsePick, pickLabel } from '@/lib/cheer';
import { NATIONS, inEnglish, nightLabel, nightSummary, goalieLine } from '@/lib/nations';
import { TEAMS } from '@/lib/team-colors';

describe('who do you cheer for', () => {
  it('keeps only picks it knows', () => {
    expect(parsePick('{"kind":"country","code":"SWE"}')).toEqual({ kind: 'country', code: 'SWE' });
    expect(parsePick('{"kind":"team","abbrev":"BOS","x":1}')).toEqual({ kind: 'team', abbrev: 'BOS' });
    expect(parsePick('{"kind":"country","code":"RUS"}')).toBeNull();
    expect(parsePick('{"kind":"team","abbrev":"XXX"}')).toBeNull();
    expect(parsePick('')).toBeNull();
    expect(parsePick('not json')).toBeNull();
  });

  it('has a name for every nation page and every team', () => {
    expect(Object.keys(ENGLISH).sort()).toEqual(Object.keys(NATIONS).sort());
    expect(Object.keys(NICKNAMES).sort()).toEqual(Object.keys(TEAMS).sort());
    expect(pickLabel({ kind: 'country', code: 'CZE' })).toBe('Czechs');
    expect(pickLabel({ kind: 'team', abbrev: 'TOR' })).toBe('Maple Leafs');
  });

  it('tells a nation in English, names in their spelling', () => {
    const n = inEnglish(NATIONS.SWE);
    expect(n.lang).toBe('sv');
    expect(n.t.phrase(3, 1)).toBe('a hat trick and an assist');
    expect(nightLabel(n, '2026-11-04')).toBe('overnight into Thursday 5 Nov');
    expect(nightSummary(n, 'x', [{ name: 'Adrian Kempe', phrase: 'a hat trick and an assist', points: 31 }, { name: 'B', phrase: '', points: -1 }]))
      .toBe('2 Swedes played, 4 points between them. Best: Adrian Kempe (a hat trick and an assist).');
    expect(goalieLine(n, { decision: 'W', started: true, shotsAgainst: 24, goalsAgainst: 1 })).toBe('win · 23 saves on 24 · 95.8%');
  });
});
