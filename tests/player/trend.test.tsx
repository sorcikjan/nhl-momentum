import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TrendChart } from '@/components/player/TrendChart';
import { trendGames } from '@/lib/player-profile';

const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

describe('TrendChart', () => {
  it('skaters: Heat by default, every stat and three horizons to switch to', () => {
    const html = renderToStaticMarkup(<TrendChart data={{ kind: 'skater', seasonAvgHeat: 50, games: [], heat: [{ date: day(20), heat: 40 }, { date: day(1), heat: 70 }] }} />);
    for (const label of ['Heat', 'Points', 'Goals', 'Shots', 'Ice time', '+/-', 'Last 2 weeks', 'Last 6 weeks', 'Season']) expect(html).toContain(`>${label}</button>`);
    const pressed = [...html.matchAll(/aria-pressed="true"[^>]*>([^<]+)</g)].map(m => m[1]);
    expect(pressed).toEqual(['Heat', 'Last 6 weeks']);
    expect(html.replace(/<!-- -->/g, '')).toMatch(/Now <b[^>]*>70<\/b> · \+30 over this span/);
  });
  it('goalies get goalie stats, not Heat', () => {
    const html = renderToStaticMarkup(<TrendChart data={{ kind: 'goalie', seasonAvgHeat: null, heat: [], games: [
      { date: day(5), opp: 'TOR', svPct: 0.9, ga: 3, sa: 30 }, { date: day(2), opp: 'BOS', svPct: 0.95, ga: 1, sa: 20 },
    ] }} />);
    expect([...html.matchAll(/aria-pressed="true"[^>]*>([^<]+)</g)].map(m => m[1])).toEqual(['Save %', 'Last 25 games']);
    expect(html).not.toContain('>Heat</button>');
    // 46 saves on 50 shots, not the average of .900 and .950
    expect(html.replace(/<!-- -->/g, '')).toContain('.920</b> SV% over 2 games');
  });
  it('says so when a span has too little data', () => {
    expect(renderToStaticMarkup(<TrendChart data={{ kind: 'skater', seasonAvgHeat: null, games: [], heat: [] }} />)).toContain('Not enough games in this span yet.');
  });
});

describe('trendGames', () => {
  it('this season only, oldest first, with the opponent', () => {
    const rows = [
      { goals: 1, assists: 1, shots_on_goal: 4, toi_seconds: 1230, plus_minus: 1, games: { game_date: '2026-10-20', home_team_id: 1, away_team: { abbrev: 'TOR' }, home_team: { abbrev: 'EDM' } } },
      { goals: 0, assists: 0, games: { game_date: '2026-10-10', home_team_id: 2, away_team: { abbrev: 'EDM' }, home_team: { abbrev: 'BOS' } } },
      { goals: 2, assists: 0, games: { game_date: '2026-04-10', home_team_id: 1, away_team: { abbrev: 'CGY' }, home_team: { abbrev: 'EDM' } } },
    ];
    expect(trendGames(rows, 1, 'skater', '2026-09-01')).toEqual([
      { date: '2026-10-10', opp: 'BOS', g: 0, a: 0, pts: 0, sog: 0, toi: 0, pm: 0 },
      { date: '2026-10-20', opp: 'TOR', g: 1, a: 1, pts: 2, sog: 4, toi: 20.5, pm: 1 },
    ]);
  });
});
