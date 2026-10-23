import { describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push: () => {} }) }));
import { renderToStaticMarkup } from 'react-dom/server';
import BrandHeader, { NAV_ITEMS, MOBILE_NAV_ITEMS, Wordmark } from '@/components/layout/BrandHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

describe('header', () => {
  it('has the design nav, in order', () => {
    expect(NAV_ITEMS.map(i => i.href)).toEqual(['/', '/games', '/hot', '/rankings', '/standings', '/recaps']);
    expect(NAV_ITEMS.map(i => i.label)).toEqual(['Tonight', 'Games', 'Heat map', 'Rankings', 'Standings', 'Stories']);
  });
  it('keeps a mobile tab bar with the schedule and a Search action (no /search page)', () => {
    expect(MOBILE_NAV_ITEMS.map(i => i.label)).toEqual(['Tonight', 'Games', 'Heat', 'Rankings', 'Search']);
    expect(MOBILE_NAV_ITEMS.find(i => i.label === 'Search')?.href).toBeNull();
    expect(JSON.stringify(NAV_ITEMS)).not.toContain('/search');
  });
  it('header offers search as a button, not a link to a page', () => {
    const out = renderToStaticMarkup(<BrandHeader />);
    expect(out).not.toContain('href="/search"');
    expect(out).toContain('Search players &amp; teams');
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
    expect(out).toContain('href="/predictions"');
  });
});
