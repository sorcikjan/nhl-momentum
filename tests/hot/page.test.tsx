import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { hotView } from '@/lib/hot-view';
import { HotBody } from '@/components/hot/HotBody';

const sk = (id: number, ppm: number, sea: number, team = 'EDM') => ({
  player_id: id, momentum_ppm: ppm, season_ppm: sea, momentum_goals: 3, momentum_assists: 4, momentum_games: 5, season_points: 20,
  players: { first_name: 'Joe', last_name: `Player${id}`, position_code: 'C', teams: { abbrev: team, name: `Team ${team}` } },
});
const leaders = Array.from({ length: 30 }, (_, i) => sk(i + 1, 0.12 - i * 0.003, 0.06));

describe('hotView', () => {
  it('#1 as the leader card, 2–10 beside it, 11–50 below', () => {
    const v = hotView({ momentumLeaders: { skaters: leaders } });
    expect(v.leader?.playerId).toBe(1);
    expect(v.top.map(r => r.mark)).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(v.more[0]).toMatchObject({ mark: '11', playerId: 11 });
    expect(v.more).toHaveLength(20);
  });
  it('heating up shows new names only, rising above season pace', () => {
    const v = hotView({ momentumLeaders: { skaters: leaders }, breakoutWatch: [sk(2, 0.1, 0.04), sk(40, 0.1, 0.04), sk(41, 0.03, 0.05)] });
    expect(v.heatingUp.map(r => r.playerId)).toEqual([40]);
  });
  it('one row per team', () => {
    const v = hotView({ hottestByTeam: [sk(1, 0.1, 0.05, 'EDM'), sk(2, 0.08, 0.05, 'FLA')] });
    expect(v.teams.map(t => [t.team, t.teamName, t.row.playerId])).toEqual([['EDM', 'Team EDM', 1], ['FLA', 'Team FLA', 2]]);
  });
});

describe('HotBody', () => {
  const v = hotView({ momentumLeaders: { skaters: leaders }, breakoutWatch: [sk(40, 0.1, 0.04)], coolingWatch: [sk(41, 0.02, 0.08)], hottestByTeam: [sk(1, 0.1, 0.05)] });
  const out = renderToStaticMarkup(<HotBody view={v} updated="OCT 23" />);
  it('reads top-down: what Heat is, who leads, who moves, every team, the rest, FAQ', () => {
    const idx = ['HOW TO READ HEAT', '#1 · HOTTEST RIGHT NOW', 'Heating up.', 'Going cold.', 'Who&#x27;s hot on every team.', 'The rest of the Heat Index.', 'Questions, answered.'].map(k => out.indexOf(k));
    expect(idx.every(i => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });
  it('one h1, search-facing', () => {
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('The hottest players in the NHL right now.');
  });
  it('the long tail is in the HTML, behind a click', () => {
    expect(out).toContain('<details');
    expect(out).toContain('Player30');
  });
});
