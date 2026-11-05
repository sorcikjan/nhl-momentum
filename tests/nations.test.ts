import { describe, expect, it } from 'vitest';
import {
  CZE, LVA, NATIONS, SWE, goalieForm, goalieLeague, goalieLine, localGoal, localTime, median, nationPlayers, nightLabel, nightSummary, rankOf,
  skaterLine, type LogGame,
} from '@/lib/nations';
import type { Moment } from '@/lib/moments';

const game = (x: Partial<LogGame>): LogGame => ({
  gameId: 1, gameDate: '2026-11-02', teamAbbrev: 'BOS', opponentAbbrev: 'VGK', homeRoadFlag: 'H',
  goals: 0, assists: 0, toi: '20:00', ...x,
});

describe('nation page', () => {
  it('finds the nation on the rosters, with Czech names and the NHL spelling for links', () => {
    const roster = {
      forwards: [
        { id: 8477956, firstName: { default: 'David' }, lastName: { default: 'Pastrnak', cs: 'Pastrňák' }, positionCode: 'R', birthCountry: 'CZE', headshot: 'h.png' },
        { id: 1, firstName: { default: 'Brad' }, lastName: { default: 'Marchand' }, positionCode: 'L', birthCountry: 'CAN' },
      ],
      goalies: [{ id: 8482487, firstName: { default: 'Jakub' }, lastName: { default: 'Dobes' }, positionCode: 'G', birthCountry: 'CZE' }],
    };
    const ps = nationPlayers([{ team: 'BOS', roster }], CZE);
    expect(ps.map(p => p.name)).toEqual(['David Pastrňák', 'Jakub Dobeš']);
    expect(ps[0]).toMatchObject({ slugLast: 'Pastrnak', pos: 'RW', goalie: false });
    expect(ps[1].goalie).toBe(true);
  });

  it('says what a skater did the way a Czech paper does', () => {
    expect(CZE.t.phrase(0, 0)).toBe('bez bodu');
    expect(CZE.t.phrase(1, 1)).toBe('gól a asistence');
    expect(CZE.t.phrase(2, 0)).toBe('2 góly');
    expect(CZE.t.phrase(3, 2)).toBe('hattrick a 2 asistence');
    expect(CZE.t.phrase(5, 0)).toBe('5 gólů');
    expect(skaterLine(CZE, { goals: 0, assists: 1, shots: 7, toi: '21:31', plusMinus: -2 })).toBe('0+1 · 7 střel · 21:31 na ledě · −2');
    expect(skaterLine(CZE, { goals: 0, assists: 0, shots: 1, toi: '20:00' })).toBe('0+0 · 1 střela · 20:00 na ledě');
    expect(goalieLine(CZE, { decision: 'W', started: true, shotsAgainst: 31, goalsAgainst: 3 })).toBe('výhra · 28 zákroků z 31 · 90,3 %');
  });

  it('names the night from Prague: Monday ET games end on Tuesday morning', () => {
    expect(nightLabel(CZE, '2026-11-02')).toBe('noc na úterý 3. 11.');
    expect(nightLabel(CZE, '2026-11-04')).toBe('noc na čtvrtek 5. 11.');
  });

  it('goalies over their last five starts, relief outings left out', () => {
    const f = goalieForm([
      game({ gamesStarted: 1, decision: 'W', shotsAgainst: 30, goalsAgainst: 1, toi: '60:00' }),
      game({ gamesStarted: 0, shotsAgainst: 10, goalsAgainst: 4, toi: '20:00' }),
      game({ gamesStarted: 1, decision: 'O', shotsAgainst: 30, goalsAgainst: 3, toi: '60:00' }),
    ]);
    expect(f).toMatchObject({ starts: 2, record: '1–0–1' });
    expect(f.svPct).toBeCloseTo(56 / 60);
    expect(f.gaa).toBeCloseTo(2);
  });

  it('retells a goal card in Czech', () => {
    const m = { kicker: 'LATE WINNER · HAT TRICK', when: '3rd 18:54', line: '12th goal of the season · Heat 81', scorer: 'David Pastrnak' } as Moment;
    expect(localGoal(m, 'David Pastrňák', CZE)).toMatchObject({
      kicker: 'VÍTĚZNÝ V ZÁVĚRU · HATTRICK', when: '3. TŘ. 18:54', line: '12. gól v sezoně · Heat 81', scorer: 'David Pastrňák',
    });
    expect(localGoal({ ...m, when: 'OT 1:44' }, 'x', CZE).when).toBe('PRODL. 1:44');
  });

  it('places them in the whole league', () => {
    expect(rankOf([90, 50, 50, 30], 50)).toBe(2);
    expect(median([10, 40, 20])).toBe(20);
    expect(median([])).toBeNull();
    expect(CZE.t.skaterLeague({ rank: 12, of: 546 }, { points: 14, rank: 35 })).toBe('NHL: forma 12. z 546 · 14 bodů v sezoně, 35. místo');
    expect(CZE.t.skaterLeague(null, { points: 1, rank: 400 })).toBe('NHL: 1 bod v sezoně, 400. místo');
    expect(goalieLeague(CZE, { svPct: 0.912, games: 9, rank: 8, of: 41 })).toBe('NHL: sezona 91,2 %, 8. z 41 brankářů');
    expect(goalieLeague(CZE, { svPct: 0.9, games: 2, rank: null, of: 41 })).toBe('NHL: sezona 90,0 % · na pořadí chybí zápasy (2/5)');
  });

  it('sums up the night in one sentence', () => {
    const rows = [
      { name: 'Adam Klapka', phrase: 'gól a asistence', points: 11 },
      { name: 'Radko Gudas', phrase: 'bez bodu', points: 0 },
      { name: 'Dan Vladař', phrase: '', points: -1 },
    ];
    expect(nightSummary(CZE, 'noc na úterý 3. 11.', rows)).toBe('V noci na úterý 3. 11. nastoupili 3 Češi a nasbírali 2 body. Nejlépe: Adam Klapka (gól a asistence).');
    expect(nightSummary(CZE, 'noc na úterý 3. 11.', rows.slice(1))).toBe('V noci na úterý 3. 11. nastoupili 2 Češi, bodově se ale neprosadil nikdo.');
  });

  it('a relief goalie gets no decision', () => {
    expect(goalieLine(CZE, { started: false, shotsAgainst: 10, goalsAgainst: 1 })).toMatch(/^\S.* · 9 zákroků z 10 · 90,0 %$/);
  });

  it('speaks every nation’s language, never English', () => {
    for (const n of Object.values(NATIONS)) {
      const t = n.t;
      for (const s of [t.phrase(1, 2), t.count(5, 'goal'), nightLabel(n, '2026-11-02'), t.ui.sub(12), t.ui.title, t.ui.description]) {
        expect(s, n.code).toBeTruthy();
        expect(s, n.code).not.toMatch(/\b(goals|shots|saves|Monday|Tuesday)\b/);
      }
      expect(nightSummary(n, nightLabel(n, '2026-11-02'), [{ name: 'A B', phrase: t.phrase(1, 0), points: 10 }])).toContain('A B');
      expect(localTime('2026-11-05T00:00:00Z', n)).toMatch(/\d/);
    }
  });

  it('Swedish and Latvian plurals', () => {
    expect(SWE.t.count(1, 'goal')).toBe('1 mål');
    expect(SWE.t.count(3, 'shot')).toBe('3 skott');
    expect(LVA.t.count(21, 'point')).toBe('21 punkts');
    expect(LVA.t.count(0, 'point')).toBe('0 punktu');
    expect(LVA.t.count(11, 'point')).toBe('11 punkti');
  });
});
