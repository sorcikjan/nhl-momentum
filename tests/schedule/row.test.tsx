import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScheduleRow, type ScheduleRowData } from '@/components/schedule/ScheduleRow';
import { ScheduleEmpty } from '@/components/schedule/ScheduleEmpty';

const up: ScheduleRowData = {
  href: '/games/1/ana-at-nyr-1019', state: 'FUT', startTimeUTC: '2026-10-19T23:00:00Z',
  away: 'ANA', home: 'NYR', awayScore: null, homeScore: null,
  pick: { abbrev: 'ANA', pct: 55 }, pickResult: null, watch: { name: 'Mikael Granlund', heat: 58 },
  watchability: 74, recapHref: null, marquee: true,
};

describe('ScheduleRow', () => {
  it('shows time, pick, watch-for and watchability before the game', () => {
    const out = renderToStaticMarkup(<ScheduleRow g={up} />);
    expect(out).toContain('7:00 PM ET');
    expect(out).toContain('OUR PICK');
    expect(out).toContain('WATCHABILITY');
    expect(out).toContain('74');
    expect(out).toContain('★');
  });
  it('shows the score, the pick result and the recap link after the game', () => {
    const out = renderToStaticMarkup(<ScheduleRow g={{ ...up, state: 'OFF', awayScore: 2, homeScore: 3, pickResult: 'miss', watchability: null, recapHref: '/recaps/x', marquee: false }} />);
    expect(out).toContain('FINAL');
    expect(out).toContain('✗ MISS');
    expect(out).not.toContain('WATCHABILITY');
    expect(out).toContain('READ →');
    expect(out.match(/<a /g)).toHaveLength(1); // whole row is one link (to the game, which carries the recap)
  });
});

describe('ScheduleEmpty', () => {
  it('points to the next game day', () => {
    expect(renderToStaticMarkup(<ScheduleEmpty nextGameDate="2026-10-21" />)).toMatch(/Oct 21/);
  });
});
