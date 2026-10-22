import { describe, expect, it } from 'vitest';
import { playerUrl, slugify, teamUrl } from '@/lib/urls';

describe('slugify', () => {
  it('folds accents instead of dropping letters', () => {
    expect(slugify('Tim Stützle')).toBe('tim-stutzle');
    expect(slugify('Montréal Canadiens')).toBe('montreal-canadiens');
    expect(slugify('Martin Fehérváry')).toBe('martin-fehervary');
    expect(slugify('David Pastrňák')).toBe('david-pastrnak');
    expect(slugify('Mats Zuccarello-Aasen Ø')).toBe('mats-zuccarello-aasen-o');
  });
  it('keeps the existing shape for plain names', () => {
    expect(slugify("J.T. Miller")).toBe('j-t-miller');
    expect(playerUrl(8478402, 'Connor', 'McDavid')).toBe('/players/8478402/connor-mcdavid');
    expect(teamUrl(22, 'Edmonton Oilers')).toBe('/teams/22/edmonton-oilers');
  });
});
