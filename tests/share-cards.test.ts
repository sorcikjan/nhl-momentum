import { describe, expect, it } from 'vitest';
import { blueskyPost, sharePosts, shareLink, type ShareData } from '@/lib/share-cards';
import type { PlayerRowData } from '@/lib/player-row';

const row = (name: string, value: string, chip: string | null = '+40%'): PlayerRowData => ({
  playerId: name.length, href: '/p', name, photo: null, team: 'BOS', mark: '↑', markTone: 'rise', pos: 'C',
  l5: 'L5 3G 4A', chip: chip ? { text: chip, tone: 'rise' } : null, value, valueHeat: Number(value),
});
const d: ShareData = {
  dateLabel: 'TUE, NOV 3',
  leader: { playerId: 1, href: '/p', first: 'David', last: 'Pastrnak', photo: null, team: 'BOS', teamName: 'Boston Bruins', pos: 'RW', heat: 97, pace: 60, goals: 5, assists: 4, games: 5, tonight: null },
  top: [row('Jack Eichel', '90'), row('Cale Makar', '88'), row('Nikita Kucherov', '85'), row('Leon Draisaitl', '84')],
  heatingUp: [row('Adam Klapka', '70'), row('Andrew Copp', '66')],
  coolingOff: [row('Sidney Crosby', '20', '−45%')],
  night: { dateLabel: 'MON, NOV 2', games: [{ away: 'VGK', awayScore: 2, home: 'BOS', homeScore: 3 }], goals: [] },
};

describe('share posts', () => {
  it('Heat top 5 for Reddit: the list in the post, the link only in the comment', () => {
    const [reddit, social] = sharePosts('heat', d);
    expect(reddit.body).toContain('1. David Pastrnak (BOS) — Heat 97 · 5G 4A in his last 5');
    expect(reddit.body).toContain('5. Leon Draisaitl (BOS) — Heat 84 · 3G 4A');
    expect(reddit.body).not.toContain('http');
    expect(reddit.comment).toContain(shareLink('/hot', 'reddit'));
    expect(social.body).toContain('utm_source=bluesky');
  });
  it('trends name the pace and stay honest about small samples', () => {
    const [reddit] = sharePosts('trends', d);
    expect(reddit.title).toContain('2 skaters');
    expect(reddit.body).toContain('Adam Klapka (BOS, C) — 3G 4A (+40% vs season pace)');
    expect(reddit.body).toContain('Cooling off:');
  });
  it('a card without data has nothing to post', () => {
    expect(sharePosts('heat', { ...d, leader: null })).toEqual([]);
    expect(sharePosts('night', { ...d, night: null })).toEqual([]);
  });
  it('keeps OT upper-case when the goal kicker goes into a sentence', () => {
    const goal = { scorer: 'Cole Caufield', kicker: 'OT WINNER', score: 'MTL 5–4 UTA', when: 'OT 0:30' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [post] = sharePosts('night', { ...d, night: { ...d.night!, goals: [goal as any] } });
    expect(post.body).toContain('Cole Caufield, OT winner (MTL 5–4 UTA, OT 0:30)');
  });
});

describe('bluesky post', () => {
  it('uses the short social text and describes the card in the alt text', () => {
    const p = blueskyPost('heat', d)!;
    expect(p.text).toContain('Hottest in the NHL right now');
    expect(p.text).toContain('utm_source=bluesky');
    expect(p.alt).toContain('#1 David Pastrnak (BOS) Heat 97, 5G 4A in 5 games');
    expect(p.alt).toContain('Jack Eichel (BOS) Heat 90, 3G 4A');
    expect([...p.text].length).toBeLessThanOrEqual(300);
  });
  it('lists last night\'s scores in the night alt text', () => {
    expect(blueskyPost('night', d)!.alt).toContain('VGK 2, BOS 3');
  });
  it('nothing to post without data', () => {
    expect(blueskyPost('heat', { ...d, leader: null })).toBeNull();
  });
});
