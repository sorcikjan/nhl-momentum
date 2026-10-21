import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameCard } from '@/components/game/GameCard';
import { cardPlayers, lastName, type GameCardData } from '@/lib/game-card';
import type { KeyPlayer } from '@/lib/key-players';

const kp = (id: number, name: string, heat: number, team: string): KeyPlayer =>
  ({ playerId: id, name, href: `/players/${id}/x`, photo: null, team, pos: 'C', heat, line: '' });

describe('cardPlayers', () => {
  it('fills photos and keeps the Heat order', () => {
    const r = cardPlayers([kp(1, 'Matvei Michkov', 59, 'PHI'), kp(2, 'Trevor Zegras', 45, 'PHI')], new Map([[1, 'm.png']]), null);
    expect(r).toEqual([
      { playerId: 1, name: 'Matvei Michkov', href: '/players/1/x', photo: 'm.png', heat: 59, stat: null },
      { playerId: 2, name: 'Trevor Zegras', href: '/players/2/x', photo: null, heat: 45, stat: null },
    ]);
  });
  it('shows three, even when given a deeper pool', () => {
    const r = cardPlayers([1, 2, 3, 4, 5].map(i => kp(i, `P ${i}`, 90 - i, 'X')), new Map(), null);
    expect(r.map(p => p.playerId)).toEqual([1, 2, 3]);
  });
  it('after the game: the top-Heat players who actually played, with what they did', () => {
    // #2 was scratched (no box-score row): skip him, take the next one who dressed.
    const stats = new Map([[1, { goals: 2, assists: 1 }], [3, { goals: 0, assists: 0 }], [4, { goals: 0, assists: 1 }]]);
    const r = cardPlayers([1, 2, 3, 4, 5].map(i => kp(i, `P ${i}`, 90 - i, 'X')), new Map(), stats);
    expect(r.map(p => p.playerId)).toEqual([1, 3, 4]);
    expect(r.map(p => p.stat)).toEqual(['2G 1A', '–', '1A']);
  });
});

describe('lastName', () => {
  it('keeps multi-word last names', () => {
    expect(lastName('Tage Van Thompson')).toBe('Van Thompson');
    expect(lastName('Pelé')).toBe('Pelé');
  });
});

const side = (abbrev: string, name: string, extra: Partial<GameCardData['home']> = {}): GameCardData['home'] => ({
  abbrev, name, score: null, pct: null,
  players: [
    { playerId: abbrev.length * 10 + 1, name: 'Matvei Michkov', href: '/p/1', photo: 'https://x/1.png', heat: 59, stat: null },
    { playerId: abbrev.length * 10 + 2, name: 'Trevor Zegras', href: '/p/2', photo: null, heat: 45, stat: null },
    { playerId: abbrev.length * 10 + 3, name: 'Travis Konecny', href: '/p/3', photo: null, heat: 30, stat: null },
  ],
  ...extra,
});
const upcoming: GameCardData = {
  id: 1, href: '/games/1/phi-at-buf', state: 'FUT', startTimeUTC: '2026-10-21T23:30:00Z',
  away: side('PHI', 'Philadelphia', { pct: 35 }), home: side('BUF', 'Buffalo', { pct: 65 }),
  pick: { abbrev: 'BUF', pct: 65 }, pickResult: null,
};

describe('GameCard', () => {
  it('upcoming: time, our pick, each side\'s win %, three players per team with Heat', () => {
    const out = renderToStaticMarkup(<GameCard g={upcoming} />);
    expect(out).toContain('7:30 PM ET');
    expect(out).toContain('BUF 65%');
    expect(out).toContain('35%');
    expect(out).toContain('Philadelphia');
    expect(out.match(/data-card-player/g)).toHaveLength(6);
    expect(out).toContain('Michkov');
    expect(out).toContain('>59<');
    expect(out).toContain('https://x/1.png');
    expect(out).toContain('grid-cols-2');
  });
  it('final: score, pick result and what each player did — same layout', () => {
    const fin: GameCardData = {
      ...upcoming, state: 'OFF', pickResult: 'hit',
      away: side('PHI', 'Philadelphia', { score: 2 }),
      home: { ...side('BUF', 'Buffalo', { score: 4 }), players: side('BUF', 'Buffalo').players.map((p, i) => ({ ...p, stat: ['2G 1A', '–', '1A'][i] })) },
    };
    const out = renderToStaticMarkup(<GameCard g={fin} />);
    expect(out).toContain('FINAL');
    expect(out).toContain('PICK HIT');
    expect(out).toContain('>4<');
    expect(out).toContain('2G 1A');
        expect(out.match(/data-card-player/g)).toHaveLength(6);
    expect(out).not.toContain('7:30 PM ET');
  });
  it('live: LIVE marker and the score', () => {
    const out = renderToStaticMarkup(<GameCard g={{ ...upcoming, state: 'LIVE', away: side('PHI', 'Philadelphia', { score: 1 }), home: side('BUF', 'Buffalo', { score: 0 }) }} />);
    expect(out).toContain('LIVE');
    expect(out).toContain('>1<');
  });
  it('footer carries watchability or a recap link without nesting links', () => {
    const out = renderToStaticMarkup(<GameCard g={{ ...upcoming, watchability: 74, marquee: true }} />);
    expect(out).toContain('74');
    expect(out).toContain('WATCHABILITY');
    const fin = renderToStaticMarkup(<GameCard g={{ ...upcoming, state: 'OFF', recapHref: '/recaps/x/y' }} />);
    expect(fin).toContain('href="/recaps/x/y"');
    expect(fin).not.toMatch(/<a\s[^>]*>(?:(?!<\/a>)[\s\S])*<a\s/);
  });
  it('reads in order: teams/result first, then the prediction, then the players', () => {
    const out = renderToStaticMarkup(<GameCard g={upcoming} />);
    const team = out.indexOf('Buffalo'), pick = out.indexOf('BUF 65%'), player = out.indexOf('data-card-player');
    expect(team).toBeGreaterThan(-1);
    expect(pick).toBeGreaterThan(team);
    expect(player).toBeGreaterThan(pick);
    expect(out.match(/BUF 65%/g)).toHaveLength(1); // the pick is stated once
  });
  it('final: score before the pick result', () => {
    const fin: GameCardData = { ...upcoming, state: 'OFF', pickResult: 'hit', away: side('PHI', 'Philadelphia', { score: 2 }), home: side('BUF', 'Buffalo', { score: 4 }) };
    const out = renderToStaticMarkup(<GameCard g={fin} />);
    expect(out.indexOf('PICK HIT')).toBeGreaterThan(out.indexOf('>4<'));
  });
  it('a side without players says so instead of leaving a hole', () => {
    const out = renderToStaticMarkup(<GameCard g={{ ...upcoming, away: { ...upcoming.away, players: [] } }} />);
    expect(out).toContain('Lineup pending');
  });
  it('names truncate in the narrow mobile columns', () => {
    expect(renderToStaticMarkup(<GameCard g={upcoming} />)).toContain('truncate');
  });
});
