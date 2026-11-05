// "Who do you cheer for": one pick per browser — a country or a team — kept in
// localStorage, no account. Client-safe: the header button, the picker and
// the homepage section all read it from here.

export type CheerPick = { kind: 'country'; code: string } | { kind: 'team'; abbrev: string };

// The nations with a page, on the English site: the country, its people, its adjective.
export const ENGLISH: Record<string, { country: string; people: [string, string]; adj: string }> = {
  CZE: { country: 'Czechia', people: ['Czech', 'Czechs'], adj: 'Czech' },
  SVK: { country: 'Slovakia', people: ['Slovak', 'Slovaks'], adj: 'Slovak' },
  SWE: { country: 'Sweden', people: ['Swede', 'Swedes'], adj: 'Swedish' },
  FIN: { country: 'Finland', people: ['Finn', 'Finns'], adj: 'Finnish' },
  DEU: { country: 'Germany', people: ['German', 'Germans'], adj: 'German' },
  CHE: { country: 'Switzerland', people: ['Swiss player', 'Swiss players'], adj: 'Swiss' },
  LVA: { country: 'Latvia', people: ['Latvian', 'Latvians'], adj: 'Latvian' },
  DNK: { country: 'Denmark', people: ['Dane', 'Danes'], adj: 'Danish' },
};

export const NICKNAMES: Record<string, string> = {
  ANA: 'Ducks', BOS: 'Bruins', BUF: 'Sabres', CAR: 'Hurricanes', CBJ: 'Blue Jackets', CGY: 'Flames', CHI: 'Blackhawks',
  COL: 'Avalanche', DAL: 'Stars', DET: 'Red Wings', EDM: 'Oilers', FLA: 'Panthers', LAK: 'Kings', MIN: 'Wild',
  MTL: 'Canadiens', NJD: 'Devils', NSH: 'Predators', NYI: 'Islanders', NYR: 'Rangers', OTT: 'Senators', PHI: 'Flyers',
  PIT: 'Penguins', SEA: 'Kraken', SJS: 'Sharks', STL: 'Blues', TBL: 'Lightning', TOR: 'Maple Leafs', UTA: 'Mammoth',
  VAN: 'Canucks', VGK: 'Golden Knights', WPG: 'Jets', WSH: 'Capitals',
};

// What the header button says for a pick: "Czechs", "Bruins".
export const pickLabel = (p: CheerPick) => p.kind === 'country' ? ENGLISH[p.code]?.people[1] ?? p.code : NICKNAMES[p.abbrev] ?? p.abbrev;

const KEY = 'momentum.cheer';
export const CHEER_EVENT = 'momentum:cheer';           // the pick changed
export const OPEN_CHEER_EVENT = 'momentum:open-cheer'; // open the picker
export const openCheer = () => window.dispatchEvent(new Event(OPEN_CHEER_EVENT));

export const COLLAPSED_KEY = 'momentum.cheer.collapsed';

// localStorage as a string, '' when absent or blocked (private mode).
export function stored(key: string): string {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}
export function store(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  } catch { /* private mode: nothing is kept */ }
  window.dispatchEvent(new Event(CHEER_EVENT));
}

export function parsePick(raw: string): CheerPick | null {
  try {
    const p = JSON.parse(raw || 'null');
    if (p?.kind === 'country' && ENGLISH[p.code]) return { kind: 'country', code: p.code };
    if (p?.kind === 'team' && NICKNAMES[p.abbrev]) return { kind: 'team', abbrev: p.abbrev };
  } catch { /* not ours */ }
  return null;
}

export const readPick = () => parsePick(stored(KEY));
export const savePick = (p: CheerPick | null) => store(KEY, p ? JSON.stringify(p) : null);
