// Team color blocks — single source for the whole app (from the redesign's
// docs/design/redesign-2026/tokens.js TEAMS). Approximations, not official marks.

export interface TeamColor { bg: string; fg: string; name: string }

export const TEAMS: Record<string, TeamColor> = {
  TOR: { bg: '#003E7E', fg: '#ffffff', name: 'Toronto' },
  BOS: { bg: '#111111', fg: '#FFB81C', name: 'Boston' },
  MTL: { bg: '#AF1E2D', fg: '#ffffff', name: 'Montreal' },
  NYR: { bg: '#0038A8', fg: '#ffffff', name: 'NY Rangers' },
  NYI: { bg: '#F47D30', fg: '#002D62', name: 'NY Islanders' },
  NJD: { bg: '#CE1126', fg: '#ffffff', name: 'New Jersey' },
  PHI: { bg: '#F74902', fg: '#000000', name: 'Philadelphia' },
  PIT: { bg: '#FCB514', fg: '#000000', name: 'Pittsburgh' },
  WSH: { bg: '#C8102E', fg: '#ffffff', name: 'Washington' },
  CAR: { bg: '#C8102E', fg: '#000000', name: 'Carolina' },
  CBJ: { bg: '#002654', fg: '#CE1126', name: 'Columbus' },
  DET: { bg: '#C8102E', fg: '#ffffff', name: 'Detroit' },
  TBL: { bg: '#002868', fg: '#ffffff', name: 'Tampa Bay' },
  FLA: { bg: '#C8102E', fg: '#041E42', name: 'Florida' },
  BUF: { bg: '#003087', fg: '#FFB81C', name: 'Buffalo' },
  OTT: { bg: '#C8102E', fg: '#000000', name: 'Ottawa' },
  CHI: { bg: '#C8102E', fg: '#000000', name: 'Chicago' },
  STL: { bg: '#002F87', fg: '#FCB514', name: 'St. Louis' },
  NSH: { bg: '#FFB81C', fg: '#041E42', name: 'Nashville' },
  MIN: { bg: '#154734', fg: '#EAAA00', name: 'Minnesota' },
  DAL: { bg: '#006847', fg: '#000000', name: 'Dallas' },
  COL: { bg: '#6F263D', fg: '#236192', name: 'Colorado' },
  WPG: { bg: '#041E42', fg: '#AC162C', name: 'Winnipeg' },
  UTA: { bg: '#71AFE5', fg: '#090909', name: 'Utah' },
  EDM: { bg: '#041E42', fg: '#FF4C00', name: 'Edmonton' },
  CGY: { bg: '#C8102E', fg: '#F1BE48', name: 'Calgary' },
  VAN: { bg: '#001F5B', fg: '#00843D', name: 'Vancouver' },
  VGK: { bg: '#B4975A', fg: '#333F42', name: 'Vegas' },
  SEA: { bg: '#001628', fg: '#99D9D9', name: 'Seattle' },
  SJS: { bg: '#006D75', fg: '#000000', name: 'San Jose' },
  LAK: { bg: '#111111', fg: '#A2AAAD', name: 'Los Angeles' },
  ANA: { bg: '#F47A38', fg: '#000000', name: 'Anaheim' },
};

export function teamColor(abbrev: string): TeamColor {
  return TEAMS[abbrev] ?? { bg: 'var(--bg-raised)', fg: 'var(--text-bright)', name: abbrev };
}

// Tint for cards with no team (hex, so callers can append an alpha suffix).
export const NEUTRAL_TINT = '#ff5a24';

// Official NHL logo, dark-background variant (the site is dark).
export function teamLogo(abbrev: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_dark.svg`;
}
