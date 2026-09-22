// Canonical site URL — used for metadata, sitemap, robots.txt, and canonical
// tags. Falls back to the Netlify subdomain so preview/dev deploys that don't
// have NEXT_PUBLIC_SITE_URL set still produce valid absolute URLs.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nhl-momentum.netlify.app').replace(/\/$/, '');
