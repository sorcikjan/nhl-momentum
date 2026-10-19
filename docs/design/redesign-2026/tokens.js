// Design tokens for NHL Momentum redesign.
// Centralized so all 5 variations stay aligned.

const NM = {
  // Surfaces
  bg:           '#0a0b0f',
  bgCard:       '#13151c',
  bgRaised:     '#1a1d26',
  bgHover:      '#1f2330',
  border:       '#252a38',
  borderSoft:   '#1c2030',

  // Text
  text:         '#8a94a6',
  textMuted:    '#5a6378',
  textBright:   '#f4f5f8',
  textDim:      '#6b7388',

  // Semantic
  blue:         '#4d7cff',
  blueDim:      'rgba(77,124,255,0.12)',
  heat:         '#ff5a24',      // "Hot / on fire"
  heatDim:      'rgba(255,90,36,0.14)',
  heatBg:       'rgba(255,90,36,0.08)',
  cold:         '#3a88ff',      // "Ice cold"
  rise:         '#00e5a0',      // "Breakout / rising"
  riseDim:      'rgba(0,229,160,0.12)',
  story:        '#e5508b',      // "Editorial pink/magenta"
  storyDim:     'rgba(229,80,139,0.14)',
  gold:         '#ffb547',
  red:          '#ef4444',
  green:        '#22c55e',

  // Radii
  r: { sm: 4, md: 8, lg: 12, xl: 16, pill: 999 },

  // Spacing
  s: (n) => n * 4,

  // Fonts
  fontSans:     "'Geist', system-ui, sans-serif",
  fontMono:     "'Geist Mono', ui-monospace, monospace",
  fontDisplay:  "'Fraunces', 'Geist', serif",
};

// Heat scale — maps 0..100 player "heat" to a warm color
function heatColor(h) {
  if (h >= 85) return '#ff3a0f';
  if (h >= 70) return '#ff5a24';
  if (h >= 55) return '#ff8a47';
  if (h >= 40) return '#f7b267';
  if (h >= 25) return '#8a94a6';
  return '#4a88ff';
}

// Team color blocks (approximated, not official marks)
const TEAMS = {
  TOR: { c: '#003E7E', t: '#ffffff', name: 'Toronto' },
  BOS: { c: '#111111', t: '#FFB81C', name: 'Boston' },
  MTL: { c: '#AF1E2D', t: '#ffffff', name: 'Montreal' },
  NYR: { c: '#0038A8', t: '#ffffff', name: 'New York R' },
  NYI: { c: '#F47D30', t: '#002D62', name: 'New York I' },
  NJD: { c: '#CE1126', t: '#ffffff', name: 'New Jersey' },
  PHI: { c: '#F74902', t: '#000000', name: 'Philadelphia' },
  PIT: { c: '#FCB514', t: '#000000', name: 'Pittsburgh' },
  WSH: { c: '#C8102E', t: '#ffffff', name: 'Washington' },
  CAR: { c: '#C8102E', t: '#000000', name: 'Carolina' },
  CBJ: { c: '#002654', t: '#CE1126', name: 'Columbus' },
  DET: { c: '#C8102E', t: '#ffffff', name: 'Detroit' },
  TBL: { c: '#002868', t: '#ffffff', name: 'Tampa Bay' },
  FLA: { c: '#C8102E', t: '#041E42', name: 'Florida' },
  BUF: { c: '#003087', t: '#FFB81C', name: 'Buffalo' },
  OTT: { c: '#C8102E', t: '#000000', name: 'Ottawa' },
  CHI: { c: '#C8102E', t: '#000000', name: 'Chicago' },
  STL: { c: '#002F87', t: '#FCB514', name: 'St. Louis' },
  NSH: { c: '#FFB81C', t: '#041E42', name: 'Nashville' },
  MIN: { c: '#154734', t: '#EAAA00', name: 'Minnesota' },
  DAL: { c: '#006847', t: '#000000', name: 'Dallas' },
  COL: { c: '#6F263D', t: '#236192', name: 'Colorado' },
  WPG: { c: '#041E42', t: '#AC162C', name: 'Winnipeg' },
  UTA: { c: '#71AFE5', t: '#090909', name: 'Utah' },
  EDM: { c: '#041E42', t: '#FF4C00', name: 'Edmonton' },
  CGY: { c: '#C8102E', t: '#F1BE48', name: 'Calgary' },
  VAN: { c: '#001F5B', t: '#00843D', name: 'Vancouver' },
  VGK: { c: '#B4975A', t: '#333F42', name: 'Vegas' },
  SEA: { c: '#001628', t: '#99D9D9', name: 'Seattle' },
  SJS: { c: '#006D75', t: '#000000', name: 'San Jose' },
  LAK: { c: '#111111', t: '#A2AAAD', name: 'Los Angeles' },
  ANA: { c: '#F47A38', t: '#000000', name: 'Anaheim' },
};

Object.assign(window, { NM, heatColor, TEAMS });
