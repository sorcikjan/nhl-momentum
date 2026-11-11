import { describe, expect, it } from 'vitest';
import { kindsFor, richFacets } from '@/lib/bluesky';

describe('bluesky link facets', () => {
  it('counts UTF-8 bytes, so a link after an emoji is still clickable', () => {
    const text = 'Hot 🔥 → https://hockeymomentum.com/hot?utm_source=bluesky';
    const [f] = richFacets(text);
    const bytes = new TextEncoder().encode(text);
    expect(new TextDecoder().decode(bytes.slice(f.index.byteStart, f.index.byteEnd))).toBe('https://hockeymomentum.com/hot?utm_source=bluesky');
    expect((f.features[0] as { uri: string }).uri).toBe('https://hockeymomentum.com/hot?utm_source=bluesky');
  });
  it('makes #NHL and #hockey tags, but not a # inside a link or "#3"', () => {
    const text = 'Top 5 → https://x.com/a#b\n\n#NHL #hockey (#3 is Hughes)';
    const tags = richFacets(text).flatMap(f => f.features).filter(f => f.$type === 'app.bsky.richtext.facet#tag');
    expect(tags.map(t => (t as { tag: string }).tag)).toEqual(['NHL', 'hockey']);
  });
  it('no link, no facet', () => {
    expect(richFacets('just text')).toEqual([]);
  });
});

describe('card rotation', () => {
  it('puts the day\'s card first and keeps the others as fallbacks', () => {
    expect(kindsFor(new Date('2026-11-09T13:00:00Z'))).toEqual(['heat', 'trends', 'night']); // Monday
    expect(kindsFor(new Date('2026-11-10T13:00:00Z'))).toEqual(['night', 'heat', 'trends']); // Tuesday
    expect(kindsFor(new Date('2026-11-11T13:00:00Z'))).toEqual(['trends', 'heat', 'night']); // Wednesday
  });
});
