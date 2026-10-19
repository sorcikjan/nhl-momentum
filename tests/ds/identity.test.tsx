import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilterChips, Headshot, Kicker, SectionHeading, Stat, TeamChip } from '@/components/ds';

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('TeamChip', () => {
  it('renders the abbreviation in team colors', () => {
    const out = html(<TeamChip abbrev="EDM" />);
    expect(out).toContain('EDM');
    expect(out).toContain('#041E42');
  });
  it('adds the heat ring when ringed', () => {
    expect(html(<TeamChip abbrev="EDM" ringed />)).toContain('var(--heat)');
  });
});

describe('Headshot', () => {
  it('falls back to initials without a photo', () => {
    expect(html(<Headshot src={null} name="Connor McDavid" />)).toContain('CM');
  });
  it('renders the image when a photo exists', () => {
    const out = html(<Headshot src="https://assets.nhle.com/x.png" name="Connor McDavid" />);
    expect(out).toContain('<img');
    expect(out).toContain('alt="Connor McDavid"');
  });
});

describe('Kicker', () => {
  it('renders uppercase label text', () => {
    expect(html(<Kicker>Last night</Kicker>)).toContain('Last night');
  });
});

describe('SectionHeading', () => {
  it('renders the requested heading level with kicker and title', () => {
    const out = html(<SectionHeading kicker="OUR PREDICTION" title="Oilers win." as="h1" />);
    expect(out).toMatch(/<h1[^>]*>Oilers win\.<\/h1>/);
    expect(out).toContain('OUR PREDICTION');
  });
  it('defaults to h2', () => {
    expect(html(<SectionHeading kicker="K" title="T" />)).toMatch(/<h2/);
  });
});

describe('Stat', () => {
  it('renders value and label', () => {
    const out = html(<Stat label="Goals" value={12} />);
    expect(out).toContain('12');
    expect(out).toContain('Goals');
  });
});

describe('FilterChips', () => {
  it('marks exactly the active option', () => {
    const out = html(
      <FilterChips
        options={[
          { label: 'All', href: '/games?range=all', active: false },
          { label: 'Today', href: '/games?range=today', active: true },
        ]}
      />,
    );
    expect(out.match(/aria-current="page"/g)).toHaveLength(1);
    expect(out).toMatch(/aria-current="page"[^>]*>Today|>Today</);
  });
});

describe('long names (390px)', () => {
  it('Headshot caption truncates long names', () => {
    const out = html(<Headshot src={null} name="Oliver Ekman-Larsson-Andersson" caption />);
    expect(out).toContain('truncate');
  });
});
