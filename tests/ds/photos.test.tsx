import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeamChip } from '@/components/ds';
import { rankingRows } from '@/lib/rankings-view';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import { hotView } from '@/lib/hot-view';
import { HotBody } from '@/components/hot/HotBody';
import { PlayerList } from '@/components/ds';

const PHOTO = 'https://assets.nhle.com/mugs/nhl/20262027/EDM/8478402.png';
const sk = (id: number, photo: string | null = PHOTO) => ({
  player_id: id, momentum_ppm: 0.1, season_ppm: 0.08, season_goals: 5, season_assists: 5, season_points: 10,
  momentum_goals: 3, momentum_assists: 4, momentum_games: 5,
  players: { first_name: 'Connor', last_name: `McDavid${id}`, position_code: 'C', headshot_url: photo, teams: { abbrev: 'EDM' } },
});

describe('team logos', () => {
  it('TeamChip shows the official NHL logo for dark backgrounds', () => {
    const out = renderToStaticMarkup(<TeamChip abbrev="EDM" />);
    expect(out).toContain('<img');
    expect(out).toContain('https://assets.nhle.com/logos/nhl/svg/EDM_dark.svg');
    expect(out).toContain('alt="Edmonton"');
  });
  it('keeps the pick ring', () => {
    expect(renderToStaticMarkup(<TeamChip abbrev="EDM" ringed />)).toContain('var(--heat)');
  });
  it('renders nothing broken without a team', () => {
    expect(renderToStaticMarkup(<TeamChip abbrev="" />)).not.toContain('<img');
  });
});

describe('player photos in player rows', () => {
  it('rankings rows carry and show the headshot', () => {
    const rows = rankingRows([sk(1)], { pos: 'ALL', sort: 'heat' }, []);
    expect(rows[0].photo).toBe(PHOTO);
    expect(renderToStaticMarkup(<RankingsTable rows={rows} />)).toContain(PHOTO);
  });
  it('heat page shows headshots', () => {
    const v = hotView({ momentumLeaders: { skaters: [sk(1), sk(2)] }, breakoutWatch: [sk(3)], coolingWatch: [sk(4)] });
    expect(v.leader?.photo).toBe(PHOTO);
    const out = renderToStaticMarkup(<HotBody view={v} updated="OCT 23" />);
    expect(out.split(PHOTO).length - 1).toBeGreaterThanOrEqual(4);
  });
  it('homepage rank lists show headshots, initials when missing', () => {
    const row = { mark: '1', markTone: null, pos: 'C', l5: 'L5 3G 4A', chip: null, valueHeat: 80, value: '80' };
    const out = renderToStaticMarkup(<PlayerList rows={[
      { ...row, playerId: 1, href: '/p/1', name: 'Connor McDavid', team: 'EDM', photo: PHOTO },
      { ...row, playerId: 2, href: '/p/2', name: 'Leon Draisaitl', team: 'EDM', photo: null },
    ]} />);
    expect(out).toContain(PHOTO);
    expect(out).toContain('LD');
  });
});
