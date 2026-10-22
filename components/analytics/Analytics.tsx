'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { OPEN_CONSENT_EVENT, needsConsentBanner, pageType, readConsent, setConsent, track, type Consent } from '@/lib/analytics';

// One page_view per route change (gtag config has send_page_view: false), with
// the page type as content_group. Next swaps document.title in the same
// commit as the route, but give it a tick so the new title is read.
function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    const t = setTimeout(() => track('page_view', {
      page_location: window.location.href,
      page_path: pathname + (search ? `?${search}` : ''),
      page_title: document.title,
      content_group: pageType(pathname),
      page_referrer: document.referrer || undefined,
    }), 50);
    return () => clearTimeout(t);
  }, [pathname, search]);
  return null;
}

// Internal link clicks → select_content, tagged with the section they came
// from (nearest [data-section]) so reports show which modules drive depth.
function useLinkClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return; // outbound: GA enhanced measurement
      track('select_content', {
        content_type: pageType(url.pathname),
        link_url: url.pathname + url.search,
        section: (a.closest('[data-section]') as HTMLElement | null)?.dataset.section ?? 'body',
        from_page_type: pageType(window.location.pathname),
      });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);
}

function ConsentBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Slight delay: let the page settle before asking.
    const t = setTimeout(() => { if (!readConsent() && needsConsentBanner()) setOpen(true); }, 800);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => { clearTimeout(t); window.removeEventListener(OPEN_CONSENT_EVENT, reopen); };
  }, []);
  if (!open) return null;
  const choose = (c: Consent) => { setConsent(c); setOpen(false); };
  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-20 z-[90] flex flex-col gap-3 rounded-xl border p-4 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:max-w-sm"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}
    >
      <p className="text-[13px] leading-snug" style={{ color: 'var(--text)' }}>
        We use Google Analytics cookies to see which pages fans use, so we can make them better. No ads, no selling data.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => choose('granted')}
          className="rounded-md px-4 py-2 text-[13px] font-semibold"
          style={{ background: 'var(--heat)', color: 'var(--bg)' }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose('denied')}
          className="rounded-md px-4 py-2 text-[13px] font-semibold"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export function CookieSettingsButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className="hover:text-[var(--text-bright)]">
      Cookie settings
    </button>
  );
}

export function Analytics() {
  useLinkClicks();
  useReportWebVitals(m => {
    track('web_vital', {
      metric_name: m.name,
      metric_id: m.id,
      metric_rating: m.rating,
      // GA wants integers; CLS is a small unitless score.
      value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value),
      content_group: pageType(window.location.pathname),
      non_interaction: true,
    });
  });
  return (
    <>
      <PageViews />
      <ConsentBanner />
    </>
  );
}
