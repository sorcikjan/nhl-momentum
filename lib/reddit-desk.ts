// The Reddit desk (/share/reddit): what to post today, where, and the exact text.
// Three posts a week, each written for its subreddit — more, from one young
// account linking one site, reads as self-promotion and gets filtered:
//   Mon  r/fantasyhockey      who's heating up (waiver decisions for the week)
//   Wed  a team subreddit     that team's players on the Heat board
//   Fri  r/hockey             the Heat top 5
// Text is plain: Reddit's editor shows markdown from a prefilled form as raw ** and -.
// Pure — the data comes in from fetchShareData().
import { SITE_URL } from '@/lib/site';
import type { PlayerRowData } from '@/lib/player-row';
import { sharePosts, type ShareData, type ShareKind } from '@/lib/share-cards';

// Team subreddits and what fans call the team (for titles).
export const TEAM_SUBS: Record<string, { sub: string; nick: string }> = {
  ANA: { sub: 'AnaheimDucks', nick: 'Ducks' }, BOS: { sub: 'BostonBruins', nick: 'Bruins' },
  BUF: { sub: 'sabres', nick: 'Sabres' }, CGY: { sub: 'CalgaryFlames', nick: 'Flames' },
  CAR: { sub: 'canes', nick: 'Canes' }, CHI: { sub: 'hawks', nick: 'Hawks' },
  COL: { sub: 'ColoradoAvalanche', nick: 'Avs' }, CBJ: { sub: 'BlueJackets', nick: 'Jackets' },
  DAL: { sub: 'DallasStars', nick: 'Stars' }, DET: { sub: 'DetroitRedWings', nick: 'Red Wings' },
  EDM: { sub: 'EdmontonOilers', nick: 'Oilers' }, FLA: { sub: 'FloridaPanthers', nick: 'Panthers' },
  LAK: { sub: 'losangeleskings', nick: 'Kings' }, MIN: { sub: 'wildhockey', nick: 'Wild' },
  MTL: { sub: 'Habs', nick: 'Habs' }, NSH: { sub: 'Predators', nick: 'Preds' },
  NJD: { sub: 'devils', nick: 'Devils' }, NYI: { sub: 'NewYorkIslanders', nick: 'Isles' },
  NYR: { sub: 'rangers', nick: 'Rangers' }, OTT: { sub: 'OttawaSenators', nick: 'Sens' },
  PHI: { sub: 'Flyers', nick: 'Flyers' }, PIT: { sub: 'penguins', nick: 'Pens' },
  SJS: { sub: 'SanJoseSharks', nick: 'Sharks' }, SEA: { sub: 'SeattleKraken', nick: 'Kraken' },
  STL: { sub: 'stlouisblues', nick: 'Blues' }, TBL: { sub: 'TampaBayLightning', nick: 'Bolts' },
  TOR: { sub: 'leafs', nick: 'Leafs' }, UTA: { sub: 'Utah_Hockey', nick: 'Mammoth' },
  VAN: { sub: 'canucks', nick: 'Canucks' }, VGK: { sub: 'goldenknights', nick: 'Knights' },
  WSH: { sub: 'caps', nick: 'Caps' }, WPG: { sub: 'winnipegjets', nick: 'Jets' },
};

export type DeskPlayer = { playerId: number; name: string; goals: number; assists: number; games: number };
export type RedditPlan = {
  subreddit: string;
  title: string;
  body: string;
  comment: string;
  card: ShareKind;
  players: DeskPlayer[];   // whose last-5 numbers the post states — checked against NHL.com
};

// Posting days by ET weekday (0 = Sunday).
const DAYS: Record<number, 'fantasy' | 'team' | 'hockey'> = { 1: 'fantasy', 3: 'team', 5: 'hockey' };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function nextPostingDay(weekday: number): string {
  for (let i = 1; i <= 7; i++) if (DAYS[(weekday + i) % 7]) return DAY_NAMES[(weekday + i) % 7];
  return 'Monday';
}

// Every link names the subreddit and day, so GA4 tells the posts apart.
export const redditLink = (path: string, sub: string, date: string) =>
  `${SITE_URL}${path}?utm_source=reddit&utm_medium=social&utm_campaign=${sub.toLowerCase()}_${date.slice(5).replace('-', '')}`;

const ga = (r: PlayerRowData) => {
  const m = r.l5.match(/(\d+)G (\d+)A/);
  return { goals: Number(m?.[1] ?? 0), assists: Number(m?.[2] ?? 0) };
};
const fromRow = (r: PlayerRowData): DeskPlayer => ({ playerId: r.playerId, name: r.name, games: 5, ...ga(r) });

type Ranked = DeskPlayer & { team: string; rank: number };
const plain = (p: Ranked): DeskPlayer => ({ playerId: p.playerId, name: p.name, goals: p.goals, assists: p.assists, games: p.games });
function heatTop(d: ShareData): Ranked[] {
  if (!d.leader) return [];
  const L = d.leader;
  return [
    { playerId: L.playerId, name: `${L.first} ${L.last}`, goals: L.goals, assists: L.assists, games: L.games, team: L.team, rank: 1 },
    ...d.top.slice(0, 4).map((r, i) => ({ ...fromRow(r), team: r.team, rank: i + 2 })),
  ];
}

const DISCLOSURE = `Heat = points per minute of ice time over the last 5 games, scaled 0–100. It's a side project of mine (card below), happy to explain how it's calculated.`;
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five'];

// One candidate per team on the top 5, best-ranked first. The desk skips teams
// whose subreddit was posted to in the last two weeks.
function teamPlans(d: ShareData, date: string): RedditPlan[] {
  const top = heatTop(d);
  const teams = [...new Set(top.map(p => p.team))].filter(t => TEAM_SUBS[t]);
  const list = top.map(p => `#${p.rank} ${p.name} (${p.team}) — ${p.goals}G ${p.assists}A`).join('\n');
  return teams.map(team => {
    const { sub, nick } = TEAM_SUBS[team];
    const ours = top.filter(p => p.team === team);
    const best = ours[0];
    const title = ours.length > 1
      ? `${WORDS[ours.length]} ${nick} are in the NHL's top 5 right now by points per minute over the last 5 games`
      : best.rank === 1
        ? `${best.name} is the hottest skater in the NHL right now — ${best.goals}G ${best.assists}A in his last ${best.games}`
        : `${best.name} is #${best.rank} in the NHL by points per minute over the last 5 games — ${best.goals}G ${best.assists}A`;
    return {
      subreddit: sub, title, card: 'heat' as ShareKind, players: top.map(plain),
      body: `The NHL's top 5 right now by points per minute of ice time over the last 5 games:\n\n${list}\n\n${DISCLOSURE}`,
      comment: `Full board with every player: ${redditLink('/hot', sub, date)}`,
    };
  });
}

// Today's candidates, best first; empty on a non-posting day or without data.
export function redditPlans(weekday: number, date: string, d: ShareData): RedditPlan[] {
  const day = DAYS[weekday];
  if (day === 'team') return teamPlans(d, date);
  if (!day) return [];
  const kind: ShareKind = day === 'fantasy' ? 'trends' : 'heat';
  const post = sharePosts(kind, d).find(p => p.channel.startsWith('Reddit'));
  if (!post?.title) return [];
  const sub = day === 'fantasy' ? 'fantasyhockey' : 'hockey';
  const players = day === 'fantasy'
    ? [...d.heatingUp.slice(0, 5), ...d.coolingOff.slice(0, 3)].map(fromRow)
    : heatTop(d).map(plain);
  return [{
    subreddit: sub, title: post.title, card: kind, players,
    body: `${post.body}\n\nIt's a side project of mine (card below), happy to explain how it's calculated.`,
    comment: `Full board with every player: ${redditLink('/hot', sub, date)}`,
  }];
}

// Reddit's submit form, filled in. The image goes in by paste (the desk copies it).
export const submitUrl = (p: RedditPlan) =>
  `https://www.reddit.com/r/${p.subreddit}/submit?type=TEXT&title=${encodeURIComponent(p.title)}&text=${encodeURIComponent(p.body)}`;

// Posts made before the desk kept its own log (localStorage), so it doesn't
// send the same subreddit two weeks running.
export const PAST_POSTS: { date: string; subreddit: string }[] = [
  { date: '2026-11-09', subreddit: 'AnaheimDucks' },
];
