// Google Analytics 4 — one place for the measurement ID, page types, consent
// and custom events. Every call is a no-op until gtag is on the page, so
// components can track unconditionally (dev, tests, blocked scripts).

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-Z7EWZE1NGP';

export const CONSENT_KEY = 'momentum.consent';
export const OPEN_CONSENT_EVENT = 'momentum:open-consent';
export type Consent = 'granted' | 'denied';

// EEA + UK + CH: analytics cookies start denied there until the visitor agrees
// (Consent Mode v2). Elsewhere they start granted.
export const CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
];

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window { gtag?: Gtag; dataLayer?: unknown[] }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: EventParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}

// Page type for a path — sent as GA4 content_group so reports can compare
// game pages vs player pages vs rankings without regex on page paths.
export function pageType(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return 'home';
  const [first, ...rest] = p.slice(1).split('/');
  const detail = rest.length > 0;
  switch (first) {
    case 'games': return detail ? 'game' : 'schedule';
    case 'players': return 'player';
    case 'teams': return 'team';
    case 'predictions': return detail ? 'predictions_day' : 'predictions';
    case 'recaps': return detail ? 'recap' : 'recaps';
    case 'rankings':
    case 'hot':
    case 'accuracy':
    case 'welcome':
      return first;
    default: return 'other';
  }
}

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch { return null; }
}

export function setConsent(choice: Consent) {
  try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* private mode: ask again next visit */ }
  window.gtag?.('consent', 'update', { analytics_storage: choice });
  track('consent_choice', { choice });
}

// The banner is only needed where analytics starts denied. Time zone is a
// cheap client-side proxy for "in Europe"; Google applies the region rule
// itself, so a miss here only means no banner, never tracking without consent.
export function needsConsentBanner(timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone): boolean {
  return /^(Europe|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe))\b/.test(timeZone ?? '');
}

// Inline bootstrap: runs before gtag.js loads, so consent defaults are in
// place before the first hit. A stored choice is applied straight away.
export function gtagBootstrap(id: string = GA_ID): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', region: ${JSON.stringify(CONSENT_REGIONS)}, wait_for_update: 500 });
try { var c = localStorage.getItem(${JSON.stringify(CONSENT_KEY)}); if (c === 'granted' || c === 'denied') gtag('consent', 'update', { analytics_storage: c }); } catch (e) {}
gtag('js', new Date());
gtag('config', ${JSON.stringify(id)}, { send_page_view: false });
`.trim();
}
