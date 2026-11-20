// Reading whole reports from the NHL stats API (api.nhle.com/stats/rest).
//
// The API answers at most 100 rows per request, whatever `limit` says: since
// about November 2026, limit=-1 returns the first 100 rows plus `total`.
// A season has ~800 skaters, so a report is read page by page with `start`,
// sorted by playerId so the pages don't overlap or skip.

export const STATS_PAGE = 100;

type Opts = { revalidate: number; timeoutMs?: number; headers?: Record<string, string>; concurrency?: number };
type Page<T> = { data: T[]; total: number };

/* eslint-disable @typescript-eslint/no-explicit-any */
async function page<T>(url: string, start: number, o: Opts): Promise<Page<T> | null> {
  try {
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}limit=${STATS_PAGE}&start=${start}`, {
      headers: o.headers,
      next: { revalidate: o.revalidate },
      signal: AbortSignal.timeout(o.timeoutMs ?? 8_000),
    } as RequestInit);
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: T[]; total?: number };
    const data = body.data ?? [];
    return { data, total: typeof body.total === 'number' ? body.total : data.length };
  } catch {
    return null;
  }
}

// Every row of one report, or [] if any page failed: a table missing some
// players would rank everyone wrongly, and callers treat [] as "no table".
export async function statsRows<T = any>(url: string, o: Opts): Promise<T[]> {
  const base = url.replace(/([?&])(limit|start)=[^&]*&?/g, '$1').replace(/[?&]$/, '');
  const sorted = /[?&]sort=/.test(base) ? base : `${base}${base.includes('?') ? '&' : '?'}sort=playerId`;

  const first = await page<T>(sorted, 0, o);
  if (!first) return [];
  const starts: number[] = [];
  for (let s = STATS_PAGE; s < first.total; s += STATS_PAGE) starts.push(s);

  const rest: (Page<T> | null)[] = new Array(starts.length);
  let next = 0;
  const worker = async () => {
    while (next < starts.length) {
      const i = next++;
      rest[i] = await page<T>(sorted, starts[i], o);
    }
  };
  await Promise.all(Array.from({ length: Math.min(o.concurrency ?? 2, starts.length) }, worker));
  if (rest.some(p => !p)) return [];
  return [first, ...(rest as Page<T>[])].flatMap(p => p.data);
}
