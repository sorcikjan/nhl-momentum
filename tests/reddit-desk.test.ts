import { describe, expect, it } from 'vitest';
import { nextPostingDay, redditPlans, submitUrl, TEAM_SUBS } from '@/lib/reddit-desk';
import type { ShareData } from '@/lib/share-cards';
import type { PlayerRowData } from '@/lib/player-row';

const row = (playerId: number, name: string, team: string, l5 = 'L5 2G 9A', chip = '+80%'): PlayerRowData => ({
  playerId, href: '/p', name, photo: null, team, mark: '↑', markTone: 'rise', pos: 'C', l5, chip: { text: chip, tone: 'rise' }, value: '86', valueHeat: 86,
});
const d: ShareData = {
  dateLabel: 'WED, NOV 11',
  leader: { playerId: 1, href: '/p', first: 'Cutter', last: 'Gauthier', photo: null, team: 'ANA', teamName: 'Anaheim Ducks', pos: 'C', heat: 100, pace: 91, goals: 11, assists: 2, games: 5, tonight: null },
  top: [row(2, 'Mikael Granlund', 'ANA'), row(3, 'Jack Hughes', 'NJD', 'L5 5G 6A'), row(4, 'Beckett Sennecke', 'ANA', 'L5 2G 8A'), row(5, 'Logan Cooley', 'UTA', 'L5 7G 2A')],
  heatingUp: [row(6, 'Viggo Björck', 'WPG', 'L5 0G 4A', '+286%')],
  coolingOff: [row(7, 'Artturi Lehkonen', 'COL', 'L5 1G 0A · season 42', '−79%')],
  night: null,
};

describe('reddit desk', () => {
  it('Wednesday: one team-subreddit candidate per team on the top 5, best first', () => {
    const plans = redditPlans(3, '2026-11-11', d);
    expect(plans.map(p => p.subreddit)).toEqual(['AnaheimDucks', 'devils', 'Utah_Hockey']);
    expect(plans[0].title).toBe("Three Ducks are in the NHL's top 5 right now by points per minute over the last 5 games");
    expect(plans[1].title).toBe('Jack Hughes is #3 in the NHL by points per minute over the last 5 games — 5G 6A');
    expect(plans[0].body).toContain('#1 Cutter Gauthier (ANA) — 11G 2A');
    expect(plans[0].comment).toContain('utm_campaign=anaheimducks_1111');
    expect(plans[0].players.find(p => p.playerId === 4)).toEqual({ playerId: 4, name: 'Beckett Sennecke', goals: 2, assists: 8, games: 5 });
  });
  it('Monday is r/fantasyhockey with the trends card; Friday r/hockey with the Heat card', () => {
    const [mon] = redditPlans(1, '2026-11-16', d);
    expect(mon.subreddit).toBe('fantasyhockey');
    expect(mon.card).toBe('trends');
    expect(mon.players.map(p => p.goals + p.assists)).toEqual([4, 1]);
    const [fri] = redditPlans(5, '2026-11-13', d);
    expect(fri.subreddit).toBe('hockey');
    expect(fri.body).not.toContain('http');
  });
  it('plain text only, since the editor shows markdown raw', () => {
    for (const p of [1, 3, 5].flatMap(w => redditPlans(w, '2026-11-11', d))) expect(p.body).not.toMatch(/\*\*|^- /m);
  });
  it('no post on other days; says when the next one is', () => {
    expect(redditPlans(2, '2026-11-10', d)).toEqual([]);
    expect(nextPostingDay(2)).toBe('Wednesday');
    expect(nextPostingDay(5)).toBe('Monday');
  });
  it('the submit link carries title and text', () => {
    const url = submitUrl(redditPlans(5, '2026-11-13', d)[0]);
    expect(url).toMatch(/^https:\/\/www\.reddit\.com\/r\/hockey\/submit\?type=TEXT&title=/);
    expect(decodeURIComponent(url)).toContain('Cutter Gauthier');
  });
  it('covers all 32 teams', () => {
    expect(Object.keys(TEAM_SUBS)).toHaveLength(32);
  });
});
