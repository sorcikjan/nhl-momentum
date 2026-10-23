// Search-facing copy and structured data. Titles mirror how people search
// ("X vs Y prediction", "player stats 2026–27"); every sentence is built from
// real data only.
import { gameView } from '@/lib/game-state';
import type { GameCardData } from '@/lib/game-card';

const dayFmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });

// The site's default share image (app/opengraph-image.tsx). Pages that set
// their own openGraph/twitter metadata replace the inherited one, so they name it.
export const SHARE_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: "momentum. — who's hot in the NHL right now" };

export function gameTitle(g: { awayName: string; homeName: string; date: string | null; state: string | null; awayScore: number | null; homeScore: number | null }): string {
  const when = g.date ? ` — ${dayFmt(g.date, { month: 'short', day: 'numeric', year: 'numeric' })}` : '';
  const final = gameView(g.state) === 'final' && g.awayScore != null && g.homeScore != null;
  return final
    ? `${g.awayName} vs ${g.homeName} Recap: ${g.awayScore}–${g.homeScore}${when}`
    : `${g.awayName} vs ${g.homeName} Prediction & Key Players${when}`;
}

export function playerTitle(name: string, season: string): string {
  return `${name} Stats, Heat & Form ${season}`;
}

export function predictionsTitle(date: string, today: string): string {
  const d = dayFmt(date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  return date === today ? `NHL Predictions Tonight — ${d}` : `NHL Predictions — ${d}`;
}

// One factual sentence per game for the predictions page.
export function predictionSentence(c: GameCardData): string {
  const hottest = [...c.away.players, ...c.home.players].filter(p => p.heat != null).sort((a, b) => b.heat! - a.heat!)[0];
  const watch = hottest ? `; watch ${hottest.name} (Heat ${hottest.heat})` : '';
  if (gameView(c.state) === 'final' && c.away.score != null && c.home.score != null) {
    const homeWon = c.home.score > c.away.score;
    const [w, l] = homeWon ? [c.home, c.away] : [c.away, c.home];
    const base = `${w.name} beat ${l.name} ${w.score}–${l.score}`;
    if (!c.pick || !c.pickResult) return `${base}.`;
    const pickName = c.pick.abbrev === c.home.abbrev ? c.home.name : c.away.name;
    return `${base} — our pick (${pickName}, ${c.pick.pct}%) ${c.pickResult === 'hit' ? 'was right' : 'missed'}.`;
  }
  if (!c.pick) return `${c.away.name} at ${c.home.name} — prediction coming before puck drop${watch}.`;
  return c.pick.abbrev === c.home.abbrev
    ? `${c.home.name} are ${c.pick.pct}% favourites at home against ${c.away.name}${watch}.`
    : `${c.away.name} are ${c.pick.pct}% favourites on the road at ${c.home.name}${watch}.`;
}

export function sportsEventLd(g: { name: string; url: string; startDate: string | null; venue: string | null; home: string; away: string; state: string | null }) {
  const view = gameView(g.state);
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: g.name,
    url: g.url,
    sport: 'Ice Hockey',
    ...(g.startDate && { startDate: g.startDate }),
    eventStatus: view === 'upcoming' ? 'https://schema.org/EventScheduled' : view === 'live' ? 'https://schema.org/EventInProgress' : 'https://schema.org/EventCompleted',
    homeTeam: { '@type': 'SportsTeam', name: g.home },
    awayTeam: { '@type': 'SportsTeam', name: g.away },
    competitor: [{ '@type': 'SportsTeam', name: g.away }, { '@type': 'SportsTeam', name: g.home }],
    ...(g.venue && { location: { '@type': 'Place', name: g.venue } }),
  };
}

export function personLd(p: { name: string; url: string; image: string | null; team: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    url: p.url,
    ...(p.image && { image: p.image }),
    ...(p.team && { affiliation: { '@type': 'SportsTeam', name: p.team } }),
  };
}

export function itemListLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url })),
  };
}

// "YYYY-MM-DD" that is a real calendar date in a plausible NHL range, else null.
export function parsePredictionDate(s: string | undefined): string | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return null;
  const y = d.getUTCFullYear();
  return y >= 2020 && y <= 2040 ? s : null;
}

// Dated predictions pages worth listing in the sitemap: last 7 → next 7 days.
export function predictionSitemapDates(today: string): string[] {
  return Array.from({ length: 15 }, (_, i) => new Date(Date.parse(`${today}T12:00:00Z`) + (i - 7) * 86_400_000).toISOString().slice(0, 10));
}
