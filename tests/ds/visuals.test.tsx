import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ArchetypeBadge, EnergyBar, FormStreak, HeatBar, HeatDial, HeatPill, ProbabilityBar, ScoreRow, Sparkline,
  energyLabel,
} from '@/components/ds';

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('HeatPill / HeatDial', () => {
  it('colors by the heat scale', () => {
    expect(html(<HeatPill heat={87} />)).toContain('#ff3a0f');
  });
  it('shows a dash, never NaN, when heat is unknown', () => {
    const out = html(<HeatPill heat={null} />);
    expect(out).toContain('—');
    expect(out).not.toContain('NaN');
    expect(html(<HeatDial heat={null} />)).not.toContain('NaN');
  });
  it('shows a real zero', () => {
    expect(html(<HeatDial heat={0} />)).toMatch(/>0</);
  });
});

describe('EnergyBar', () => {
  it('labels by the design thresholds', () => {
    expect(energyLabel(80)).toBe('FRESH');
    expect(energyLabel(50)).toBe('MODERATE');
    expect(energyLabel(39)).toBe('DRAINED');
    expect(html(<EnergyBar value={39} showLabel />)).toContain('DRAINED');
  });
});

describe('Sparkline', () => {
  it('renders nothing for fewer than two points', () => {
    expect(html(<Sparkline values={[1]} />)).toBe('');
  });
  it('renders an svg path for a series', () => {
    expect(html(<Sparkline values={[10, 40, 30]} />)).toContain('<path');
  });
});

describe('ProbabilityBar', () => {
  it('shows both percentages', () => {
    const out = html(<ProbabilityBar home={{ abbrev: 'EDM', pct: 62 }} away={{ abbrev: 'COL', pct: 38 }} pick="home" />);
    expect(out).toContain('62%');
    expect(out).toContain('38%');
  });
});

describe('FormStreak', () => {
  it('renders one cell per result', () => {
    const out = html(<FormStreak results={['W', 'L', 'OTL']} />);
    expect(out.match(/data-result=/g)).toHaveLength(3);
  });
});

describe('ScoreRow', () => {
  it('shows scores when the game is final', () => {
    const out = html(<ScoreRow away="EDM" home="COL" awayScore={3} homeScore={2} status="FINAL" />);
    expect(out).toContain('3');
    expect(out).toContain('FINAL');
  });
});

describe('HeatBar / ArchetypeBadge', () => {
  it('fills to the heat percent', () => {
    expect(html(<HeatBar heat={64} />)).toContain('width:64%');
  });
  it('labels the AI archetype', () => {
    expect(html(<ArchetypeBadge archetype="Playmaker" compact />)).toContain('Playmaker');
  });
});
