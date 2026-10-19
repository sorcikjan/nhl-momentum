import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NAV_ITEMS, MOBILE_NAV_ITEMS, Wordmark } from '@/components/layout/BrandHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

describe('header', () => {
  it('has the design nav, in order', () => {
    expect(NAV_ITEMS.map(i => i.href)).toEqual(['/', '/hot', '/search', '/rankings', '/recaps']);
    expect(NAV_ITEMS.map(i => i.label)).toEqual(['Tonight', 'Heat map', 'Players', 'Rankings', 'Stories']);
  });
  it('keeps a mobile tab bar that includes the schedule', () => {
    expect(MOBILE_NAV_ITEMS.map(i => i.href)).toContain('/games');
  });
  it('wordmark reads "momentum." with no "Hockey"', () => {
    const out = renderToStaticMarkup(<Wordmark />);
    expect(out).toContain('momentum');
    expect(out).toContain('<svg');
    expect(out).not.toMatch(/hockey/i);
  });
});

describe('footer', () => {
  it('names only the data source we actually use', () => {
    const out = renderToStaticMarkup(<SiteFooter />);
    expect(out).toContain('NHL Stats API');
    for (const s of ['MoneyPuck', 'Natural Stat Trick', 'Evolving Hockey']) expect(out).not.toContain(s);
    expect(out).toContain('How Heat works');
    expect(out).toContain('Methodology');
  });
});
