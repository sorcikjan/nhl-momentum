import { describe, expect, it } from 'vitest';
import { teamHotView } from '@/lib/team-hot-view';
import type { StandingRow } from '@/lib/nhl-stats';

const standing = (abbrev: string, l10: string, streak: string): StandingRow => ({
  abbrev, name: abbrev, href: null, conference: '', division: '', gp: 20, w: 10, l: 8, otl: 2, pts: 22, gd: 0, l10, streak, heat: null,
});

describe('teamHotView', () => {
  it('ranks every team by Team Heat against the league average, with record and hottest skater', () => {
    const v = teamHotView({
      teamHeat: { MIN: 80, BOS: 40, TOR: 60 },
      teams: { MIN: { id: 30, name: 'Minnesota Wild' }, BOS: { id: 6, name: 'Boston Bruins' }, TOR: { id: 10, name: 'Toronto Maple Leafs' } },
      hottestByTeam: [{ player_id: 1, momentum_ppm: 0.1, season_ppm: 0.05, players: { first_name: 'Kirill', last_name: 'Kaprizov', teams: { abbrev: 'MIN' } } }],
    }, [standing('MIN', '7-2-1', 'W3')], (id, name) => `/teams/${id}/${name}`);
    expect(v.leagueAvg).toBe(60);
    expect(v.rows.map(r => [r.rank, r.abbrev, r.vsAvg])).toEqual([[1, 'MIN', 20], [2, 'TOR', 0], [3, 'BOS', -20]]);
    expect(v.rows[0]).toMatchObject({ name: 'Minnesota Wild', href: '/teams/30/Minnesota Wild', l10: '7-2-1', streak: 'W3' });
    expect(v.rows[0].hottest?.name).toBe('Kirill Kaprizov');
    expect(v.rows[1]).toMatchObject({ l10: null, streak: null, hottest: null });
  });

  it('no rankings: nothing to show', () => {
    expect(teamHotView(null)).toEqual({ rows: [], leagueAvg: null });
  });
});
