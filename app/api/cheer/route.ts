import { NextResponse, type NextRequest } from 'next/server';
import { fetchCheerNation, fetchCheerTeam } from '@/lib/cheer-data';
import { NATIONS } from '@/lib/nations';
import { TEAMS } from '@/lib/team-colors';

// The homepage's "who do you cheer for" section: ?country=CZE or ?team=BOS.
// One answer per country or team, cached at the CDN — 40 possible URLs, so
// however many browsers ask, the server builds each a few times an hour.
export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country');
  const team = req.nextUrl.searchParams.get('team');
  const nation = country ? NATIONS[country] : null;
  if (!nation && !(team && TEAMS[team])) return NextResponse.json({ error: 'unknown pick' }, { status: 400 });
  try {
    const body = nation ? await fetchCheerNation(nation) : await fetchCheerTeam(team!);
    return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' } });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
