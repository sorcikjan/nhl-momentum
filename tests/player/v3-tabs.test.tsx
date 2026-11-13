import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProfileTabs } from '@/components/player/v3/ProfileTabs';
import { MiniHeader } from '@/components/player/v3/MiniHeader';

const panels = { now: <p>NOW-PANEL</p>, games: <p>GAMES-PANEL</p>, player: <p>PLAYER-PANEL</p>, career: <p>CAREER-PANEL</p> };

describe('ProfileTabs', () => {
  it('every panel is in the HTML, only the requested one visible', () => {
    const out = renderToStaticMarkup(<ProfileTabs hero={<div>HERO</div>} mini={<div>MINI</div>} panels={panels} initial="career" />);
    for (const k of ['NOW', 'GAMES', 'PLAYER', 'CAREER']) expect(out).toContain(`${k}-PANEL`);
    const visible = [...out.matchAll(/<section[^>]*data-panel="(\w+)"(?![^>]*hidden)[^>]*>/g)].map(m => m[1]);
    expect(visible).toEqual(['career']);
    expect(out).toContain('aria-selected="true"');
  });
  it('the hero shows on Now, the compact header on other tabs', () => {
    expect(renderToStaticMarkup(<ProfileTabs hero={<div>HERO</div>} mini={<div>MINI</div>} panels={panels} initial="now" />)).toContain('HERO');
    expect(renderToStaticMarkup(<ProfileTabs hero={<div>HERO</div>} mini={<div>MINI</div>} panels={panels} initial="games" />)).not.toContain('HERO');
  });
});

describe('MiniHeader', () => {
  const base = { photo: null, name: 'Michal Postava', line: '#35 · G', metric: { value: '–', label: 'SAVE %' as const }, team: 'DET' };
  it('next game when he is playing', () => {
    expect(renderToStaticMarkup(<MiniHeader {...base} status={null} next="Sat vs NYI" />)).toContain('Sat vs NYI');
  });
  it('his status takes the next game\'s place', () => {
    const out = renderToStaticMarkup(<MiniHeader {...base} status={{ text: 'In the AHL · Grand Rapids', tone: 'amber' }} next="Sat vs NYI" />);
    expect(out).toContain('In the AHL · Grand Rapids');
    expect(out).not.toContain('Sat vs NYI');
  });
});
