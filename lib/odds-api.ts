// The Odds API — NHL h2h odds fetcher
// Docs: https://the-odds-api.com/liveapi/guides/v4/
//
// Requires ODDS_API_KEY env var. Free tier: 500 credits/month.
// One NHL odds request (all EU bookmakers, h2h market) costs ~10-20 credits.

const BASE_URL = 'https://api.the-odds-api.com/v4';

export interface OddsEvent {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;   // ISO timestamp UTC
  bookmakers: OddsBookmaker[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

export interface OddsMarket {
  key: string;  // 'h2h'
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number;  // decimal odds
}

export async function fetchNHLOdds(apiKey: string): Promise<OddsEvent[]> {
  const url = new URL(`${BASE_URL}/sports/icehockey_nhl/odds/`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', 'eu');
  url.searchParams.set('markets', 'h2h');
  url.searchParams.set('dateFormat', 'iso');
  url.searchParams.set('oddsFormat', 'decimal');

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Odds API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<OddsEvent[]>;
}

// Convert decimal odds to normalized (vig-removed) implied probability.
// E.g. home 1.85 / away 2.10 → homeImplied = 53.8% / awayImplied = 47.6%
//   total overround = 101.4% → normalized home = 53.0%, away = 47.0%
export function decimalToNormProb(
  homeOdds: number,
  awayOdds: number,
  drawOdds?: number | null,
): { home: number; away: number; draw: number | null } {
  const hi = 1 / homeOdds;
  const ai = 1 / awayOdds;
  const di = drawOdds ? 1 / drawOdds : 0;
  const total = hi + ai + di;
  return {
    home: hi / total,
    away: ai / total,
    draw: drawOdds ? di / total : null,
  };
}

// Preferred bookmaker display order for picking the "best" to highlight.
const BOOKMAKER_PRIORITY = ['tipsport', 'pinnacle', 'betfair_ex_eu', 'unibet', 'bet365'];

export function pickBestOdds<T extends { bookmaker: string }>(rows: T[]): T | null {
  if (!rows.length) return null;
  for (const key of BOOKMAKER_PRIORITY) {
    const found = rows.find(r => r.bookmaker === key);
    if (found) return found;
  }
  return rows[0];
}

export function formatBookmaker(key: string): string {
  const names: Record<string, string> = {
    tipsport: 'Tipsport',
    pinnacle: 'Pinnacle',
    betfair_ex_eu: 'Betfair',
    betfair: 'Betfair',
    unibet: 'Unibet',
    bet365: 'bet365',
    bwin: 'bwin',
    '1xbet': '1xBet',
    williamhill: 'William Hill',
  };
  return names[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}
