import { describe, expect, it } from 'vitest';
import { GA_ID, gtagBootstrap, needsConsentBanner, pageType, track } from '@/lib/analytics';

describe('pageType', () => {
  it.each([
    ['/', 'home'],
    ['/games', 'schedule'],
    ['/games/2026020101/edm-vs-cgy', 'game'],
    ['/players/8478402/connor-mcdavid', 'player'],
    ['/teams/22/edmonton-oilers', 'team'],
    ['/predictions', 'predictions'],
    ['/predictions/2026-10-22', 'predictions_day'],
    ['/recaps', 'recaps'],
    ['/recaps/2026-10-21/edm-cgy', 'recap'],
    ['/rankings/', 'rankings'],
    ['/hot', 'hot'],
    ['/accuracy', 'accuracy'],
    ['/welcome', 'welcome'],
    ['/nope', 'other'],
  ])('%s → %s', (path, type) => {
    expect(pageType(path)).toBe(type);
  });
});

describe('needsConsentBanner', () => {
  it('shows for European time zones only', () => {
    expect(needsConsentBanner('Europe/Prague')).toBe(true);
    expect(needsConsentBanner('Atlantic/Reykjavik')).toBe(true);
    expect(needsConsentBanner('America/Toronto')).toBe(false);
    expect(needsConsentBanner('Atlantic/Bermuda')).toBe(false);
  });
});

describe('gtagBootstrap', () => {
  const js = gtagBootstrap();
  it('sets consent defaults before config and disables auto page views', () => {
    expect(js.indexOf("'consent', 'default'")).toBeLessThan(js.indexOf("'config'"));
    expect(js).toContain(`'config', "${GA_ID}", { send_page_view: false }`);
    expect(js).toContain('"CZ"');
    expect(js).toContain("ad_storage: 'denied'");
  });
  it('is valid JavaScript', () => {
    expect(() => new Function(js)).not.toThrow();
  });
});

describe('track', () => {
  it('is a no-op without gtag', () => {
    expect(() => track('page_view')).not.toThrow();
  });
});
