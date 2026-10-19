// Mock data for the redesign. Representative of real-looking stats,
// tuned so the stories feel believable.

const PLAYERS = [
  { id: 1,  first: 'Connor',   last: 'McDavid',     team: 'EDM', pos: 'C', heat: 94, trend: [62, 68, 75, 82, 88, 94], g: 7, a: 11, gm: 5, streak: 'fire',
    story: 'Back-to-back hat tricks push Edmonton into first place in the Pacific.',
    age: 29, num: 97 },
  { id: 2,  first: 'Nathan',   last: 'MacKinnon',   team: 'COL', pos: 'C', heat: 91, trend: [58, 64, 72, 78, 85, 91], g: 5, a: 13, gm: 5, streak: 'fire',
    story: '18 points in last 5 — career-best pace continues.', age: 30, num: 29 },
  { id: 3,  first: 'Leon',     last: 'Draisaitl',   team: 'EDM', pos: 'C', heat: 88, trend: [55, 62, 70, 77, 83, 88], g: 6, a: 9, gm: 5, streak: 'fire',
    story: 'Second-line spark while McDavid drew double coverage.', age: 30, num: 29 },
  { id: 4,  first: 'Auston',   last: 'Matthews',    team: 'TOR', pos: 'C', heat: 86, trend: [42, 48, 60, 72, 79, 86], g: 8, a: 4, gm: 5, streak: 'fire',
    story: '8 goals in 5 — the scoring slump is officially over.', age: 28, num: 34 },
  { id: 5,  first: 'David',    last: 'Pastrnak',    team: 'BOS', pos: 'R', heat: 82, trend: [50, 55, 62, 70, 76, 82], g: 4, a: 10, gm: 5, streak: 'rise',
    story: 'Career-high assists pace as Pasta settles into playmaker role.', age: 29, num: 88 },
  { id: 6,  first: 'Cale',     last: 'Makar',       team: 'COL', pos: 'D', heat: 80, trend: [52, 58, 63, 70, 75, 80], g: 3, a: 10, gm: 5, streak: 'rise',
    story: 'Norris repeat in sight — leads all D-men in Heat.', age: 27, num: 8 },
  { id: 7,  first: 'Kirill',   last: 'Kaprizov',    team: 'MIN', pos: 'L', heat: 77, trend: [45, 52, 58, 65, 71, 77], g: 5, a: 7, gm: 5, streak: 'rise' },
  { id: 8,  first: 'Matthew',  last: 'Tkachuk',     team: 'FLA', pos: 'L', heat: 74, trend: [48, 54, 60, 66, 71, 74], g: 3, a: 9, gm: 5, streak: 'rise' },
  { id: 9,  first: 'Sidney',   last: 'Crosby',      team: 'PIT', pos: 'C', heat: 71, trend: [55, 58, 62, 65, 68, 71], g: 4, a: 7, gm: 5, streak: 'steady' },
  { id: 10, first: 'Mitch',    last: 'Marner',      team: 'TOR', pos: 'R', heat: 69, trend: [50, 54, 58, 62, 66, 69], g: 2, a: 10, gm: 5, streak: 'steady' },
  { id: 11, first: 'Jack',     last: 'Hughes',      team: 'NJD', pos: 'C', heat: 82, trend: [38, 46, 58, 68, 75, 82], g: 6, a: 6, gm: 4, streak: 'breakout',
    story: 'Missed 3 weeks, back with 12 points in 4.', age: 24, num: 86 },
  { id: 12, first: 'Macklin',  last: 'Celebrini',   team: 'SJS', pos: 'C', heat: 76, trend: [28, 38, 50, 62, 70, 76], g: 5, a: 5, gm: 5, streak: 'breakout',
    story: 'Rookie phenom quietly outpacing all first-year Heat leaders.', age: 19, num: 71 },
  { id: 13, first: 'Lucas',    last: 'Raymond',     team: 'DET', pos: 'R', heat: 73, trend: [32, 42, 52, 60, 67, 73], g: 4, a: 7, gm: 5, streak: 'breakout',
    story: 'Detroit\'s young core finding a rhythm.', age: 24, num: 23 },
  { id: 14, first: 'Quinton',  last: 'Byfield',     team: 'LAK', pos: 'C', heat: 68, trend: [30, 40, 50, 57, 63, 68], g: 3, a: 6, gm: 5, streak: 'breakout' },
  { id: 15, first: 'Tim',      last: 'Stützle',     team: 'OTT', pos: 'C', heat: 64, trend: [35, 42, 50, 55, 60, 64], g: 2, a: 7, gm: 5, streak: 'breakout' },
];

const GAMES = [
  { id: 1, away: 'TOR', home: 'BOS', time: '7:00 PM',  status: 'upcoming', awayWin: 0.42, homeWin: 0.58, rivalry: true,  pick: 'BOS',
    narrative: 'Boston has taken 7 of last 10 at home. But Matthews is on fire (8G in 5).' },
  { id: 2, away: 'EDM', home: 'COL', time: '9:30 PM',  status: 'upcoming', awayWin: 0.53, homeWin: 0.47, rivalry: false, pick: 'EDM',
    narrative: 'McDavid vs MacKinnon — both carrying 90+ Heat. Toss-up leaning Oilers.' },
  { id: 3, away: 'NYR', home: 'PIT', time: '7:30 PM',  status: 'upcoming', awayWin: 0.61, homeWin: 0.39, rivalry: false, pick: 'NYR',
    narrative: 'Crosby steady, but Rangers\' special teams are top-3.' },
  { id: 4, away: 'FLA', home: 'TBL', time: '7:00 PM',  status: 'live',     awayWin: 0.55, homeWin: 0.45, rivalry: true,  pick: 'FLA',
    narrative: 'Battle of Florida, tied at 2 after 2.', homeScore: 2, awayScore: 2, period: '2nd · 3:14' },
  { id: 5, away: 'VAN', home: 'CGY', time: '10:00 PM', status: 'upcoming', awayWin: 0.48, homeWin: 0.52, rivalry: true,  pick: 'CGY',
    narrative: 'Alberta classic. Flames riding a 4-game home win streak.' },
  { id: 6, away: 'WPG', home: 'MIN', time: '8:00 PM',  status: 'upcoming', awayWin: 0.54, homeWin: 0.46, rivalry: false, pick: 'WPG',
    narrative: 'Jets top PK in league; Wild missing Kaprizov\'s line chemistry.' },
];

const STORIES = [
  {
    kicker: 'BREAKOUT',
    headline: 'Jack Hughes returned from injury with 12 points in 4 games',
    dek: 'The Devils star missed three weeks. He\'s back — and Heat is up 44 points since his return.',
    meta: 'New Jersey · Center · 4 games back',
    tag: 'story',
    playerId: 11,
  },
  {
    kicker: 'ON FIRE',
    headline: 'Matthews ends his slump the only way he knows how',
    dek: 'Eight goals in his last five. Toronto wins four straight. The math is simple.',
    meta: 'Toronto · 8G 4A in 5',
    tag: 'fire',
    playerId: 4,
  },
  {
    kicker: 'COLD SPELL',
    headline: 'Flyers searching for answers as losing streak hits 6',
    dek: 'Team heat average has dropped to 38. Only Carter Hart is playing at a playoff level.',
    meta: 'Philadelphia · 0-5-1 L10',
    tag: 'cold',
  },
  {
    kicker: 'ROOKIE WATCH',
    headline: 'Celebrini is quietly outpacing every first-year player this season',
    dek: 'At 19, he\'s sitting on a higher Heat score than Bedard had at this stage last year.',
    meta: 'San Jose · 19 yrs · 5G 5A L5',
    tag: 'rise',
    playerId: 12,
  },
];

// Generate a small sparkline path
function sparkPath(values, w, h, pad = 2) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = (w - pad * 2) / (values.length - 1);
  return values.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

Object.assign(window, { PLAYERS, GAMES, STORIES, sparkPath });
