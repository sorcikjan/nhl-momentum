// Morning share cards (/share): what each card shows and the post text that
// goes with it, per channel. Pure — the data comes in from fetchShareData().
import type { PlayerRowData } from '@/lib/player-row';
import type { HeatLeader } from '@/lib/home';
import type { Moment } from '@/lib/moments';
import { SITE_URL } from '@/lib/site';

export type ShareKind = 'heat' | 'trends' | 'night';
export const SHARE_KINDS: ShareKind[] = ['heat', 'trends', 'night'];

export type NightGame = { away: string; awayScore: number; home: string; homeScore: number };
export type ShareData = {
  dateLabel: string;            // "TUE, NOV 3" — the morning the cards are for
  leader: HeatLeader | null;
  top: PlayerRowData[];         // #2–#5
  heatingUp: PlayerRowData[];
  coolingOff: PlayerRowData[];
  night: { date?: string; dateLabel: string; games: NightGame[]; goals: Moment[] } | null; // date: YYYY-MM-DD (ET)
};

export type Post = { channel: string; title?: string; body: string; comment?: string };

// Every link carries where it was posted, so GA4 shows which channel brings people.
export const shareLink = (path: string, source: string) =>
  `${SITE_URL}${path}?utm_source=${source}&utm_medium=social&utm_campaign=morning`;

const pace = (r: PlayerRowData) => (r.chip ? ` (${r.chip.text} vs season pace)` : '');
const l5 = (r: PlayerRowData) => r.l5.replace(/^L5 /, '');
const HEAT_IS = 'Heat = points per minute of ice time over the last 5 games, on a 0–100 scale.';

function heatPosts(d: ShareData): Post[] {
  if (!d.leader) return [];
  const L = d.leader;
  const lines = [
    `1. ${L.first} ${L.last} (${L.team}) — Heat ${L.heat} · ${L.goals}G ${L.assists}A in his last ${L.games}`,
    ...d.top.slice(0, 4).map((r, i) => `${i + 2}. ${r.name} (${r.team}) — Heat ${r.value} · ${l5(r)}`),
  ];
  const short = [`1. ${L.last} ${L.heat}`, ...d.top.slice(0, 2).map((r, i) => `${i + 2}. ${r.name.split(' ').slice(-1)[0]} ${r.value}`)].join(' · ');
  return [
    { channel: 'Reddit · r/hockey, r/NHLAnalytics', title: `The 5 hottest skaters in the NHL right now, by points per minute of ice time over the last 5 games`,
      body: `${lines.join('\n')}\n\n${HEAT_IS} Ice time matters: a point in 12 minutes counts more than one in 22.`,
      comment: `Full board, with every player's Heat and trend: ${shareLink('/hot', 'reddit')}` },
    { channel: 'Bluesky / X', body: `Hottest in the NHL right now 🔥\n${short}\n\nWho else is on fire → ${shareLink('/hot', 'bluesky')}` },
  ];
}

function trendPosts(d: ShareData): Post[] {
  if (!d.heatingUp.length) return [];
  const up = d.heatingUp.slice(0, 5).map(r => `• ${r.name} (${r.team}, ${r.pos}) — ${l5(r)}${pace(r)}`);
  const down = d.coolingOff.slice(0, 3).map(r => `• ${r.name} (${r.team}) — ${l5(r)}${pace(r)}`);
  return [
    { channel: 'Reddit · r/fantasyhockey', title: `Heating up: ${d.heatingUp.length >= 5 ? 5 : d.heatingUp.length} skaters producing well above their season pace over the last 5 games`,
      body: `Points per minute of ice time, last 5 games vs their own season:\n\n${up.join('\n')}${down.length ? `\n\nCooling off:\n${down.join('\n')}` : ''}\n\nNot a projection — just who's producing right now. Small samples, so check the ice time before you add.`,
      comment: `Every skater's last-5 form and trend: ${shareLink('/hot', 'reddit')}` },
    { channel: 'Bluesky / X', body: `Heating up in the NHL 📈\n${d.heatingUp.slice(0, 3).map(r => `${r.name} ${r.chip?.text ?? ''}`.trim()).join(' · ')}\n\nvs their season pace, last 5 games → ${shareLink('/hot', 'bluesky')}` },
  ];
}

// "OT WINNER · HAT TRICK" → "OT winner · hat trick"
const lowerKicker = (k: string) => k.toLowerCase().replace(/\bot\b/g, 'OT');

function nightPosts(d: ShareData): Post[] {
  const n = d.night;
  if (!n?.games.length) return [];
  const best = n.goals[0];
  const goal = best ? `\nGoal of the night: ${best.scorer}, ${lowerKicker(best.kicker)} (${best.score}, ${best.when})` : '';
  return [
    { channel: 'Bluesky / X', body: `Last night in the NHL: ${n.games.length} game${n.games.length === 1 ? '' : 's'}.${goal}\n\nEvery score and the best goals → ${shareLink('/recaps', 'bluesky')}` },
  ];
}

export function sharePosts(kind: ShareKind, d: ShareData): Post[] {
  return kind === 'heat' ? heatPosts(d) : kind === 'trends' ? trendPosts(d) : nightPosts(d);
}

export const SHARE_TITLES: Record<ShareKind, string> = {
  heat: 'Heat top 5',
  trends: 'Heating up · cooling off',
  night: 'Last night',
};

// Hashtags put the post into Bluesky's hockey feeds; with no followers yet,
// that's the only way anyone sees it.
const BLUESKY_TAGS = '#NHL #hockey';

// The daily Bluesky post: the card's text plus a description of the card for
// screen readers (Bluesky shows alt text, and the card is mostly numbers).
export function blueskyPost(kind: ShareKind, d: ShareData): { text: string; alt: string } | null {
  const text = sharePosts(kind, d).find(p => p.channel.startsWith('Bluesky'))?.body;
  if (!text) return null;
  const rows = (rs: PlayerRowData[]) => rs.map(r => `${r.name} (${r.team}) Heat ${r.value}, ${l5(r)}`).join('; ');
  const alt =
    kind === 'heat' && d.leader ? `Heat Index, ${d.dateLabel}. #1 ${d.leader.first} ${d.leader.last} (${d.leader.team}) Heat ${d.leader.heat}, ${d.leader.goals}G ${d.leader.assists}A in ${d.leader.games} games. Then ${rows(d.top.slice(0, 4))}.`
    : kind === 'trends' ? `Heating up, ${d.dateLabel}: ${rows(d.heatingUp.slice(0, 5))}. Cooling off: ${rows(d.coolingOff.slice(0, 3))}.`
    : `Last night in the NHL, ${d.night?.dateLabel}: ${d.night?.games.map(g => `${g.away} ${g.awayScore}, ${g.home} ${g.homeScore}`).join('; ')}.`;
  return { text: `${text}\n\n${BLUESKY_TAGS}`, alt };
}
