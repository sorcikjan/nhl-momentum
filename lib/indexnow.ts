// IndexNow: tells Bing (and through it ChatGPT/Copilot search) and Yandex that
// pages are new or changed, so they're crawled now instead of in days. The key
// is public by design — it's served at /<key>.txt to prove we own the host.
import { SITE_URL } from '@/lib/site';

export const INDEXNOW_KEY = '84a62127cc90d0a95f42bf3466d89af9';

// Best effort: never throws, gives up after 4 s, and does nothing off the
// production domain (previews, the netlify.app address, local runs).
export async function notifyIndexNow(paths: string[]): Promise<boolean> {
  const host = new URL(SITE_URL).host;
  if (!paths.length || host.endsWith('netlify.app') || host.startsWith('localhost')) return false;
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: [...new Set(paths)].map(p => `${SITE_URL}${p}`),
      }),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
