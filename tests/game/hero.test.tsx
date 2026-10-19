import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameHero } from '@/components/game/GameHero';

const base = {
  away: { abbrev: 'ANA', name: 'Anaheim Ducks', score: null },
  home: { abbrev: 'NYR', name: 'New York Rangers', score: null },
  eyebrow: 'MON · OCT 19 · 7:00 PM ET',
  venue: 'Madison Square Garden',
  storyline: null,
  pickSide: 'away' as const,
};

describe('GameHero', () => {
  it('shows "at" before the game and the nicknames as the headline', () => {
    const out = renderToStaticMarkup(<GameHero {...base} view="upcoming" />);
    expect(out).toMatch(/<h1[^>]*>[\s\S]*Ducks[\s\S]*Rangers/);
    expect(out).toContain('>at<');
  });
  it('shows the score and FINAL after the game', () => {
    const out = renderToStaticMarkup(<GameHero {...base} view="final" away={{ ...base.away, score: 2 }} home={{ ...base.home, score: 3 }} />);
    expect(out).toContain('FINAL');
    expect(out).toMatch(/>2<[\s\S]*>3</);
  });
  it('never renders series context', () => {
    expect(renderToStaticMarkup(<GameHero {...base} view="upcoming" />)).not.toMatch(/SERIES|BEST OF/);
  });
});
