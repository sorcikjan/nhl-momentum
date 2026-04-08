import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for public read endpoints.
// NOTE: In Netlify's serverless environment each function instance has its own
// memory, so this is best-effort — not a substitute for a distributed rate
// limiter (e.g. Upstash Redis). It still blocks obvious abuse within a single
// warm instance and adds rate-limit headers for monitoring.

const WINDOW_MS = 60_000;  // 1 minute
const MAX_REQUESTS = 120;  // per IP per window

const hits = new Map<string, { count: number; resetAt: number }>();

// Only apply to public read API routes, not ingest/backtest (those are API-key protected)
const PUBLIC_API_RE = /^\/api\/(games|rankings|players|accuracy|energy)(\/|$)/;

export function middleware(req: NextRequest) {
  if (!PUBLIC_API_RE.test(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
