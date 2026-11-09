import { describe, expect, it } from 'vitest';
import { kindsFor, linkFacets } from '@/lib/bluesky';

describe('bluesky link facets', () => {
  it('counts UTF-8 bytes, so a link after an emoji is still clickable', () => {
    const text = 'Hot 🔥 → https://hockeymomentum.com/hot?utm_source=bluesky';
    const [f] = linkFacets(text);
    const bytes = new TextEncoder().encode(text);
    expect(new TextDecoder().decode(bytes.slice(f.index.byteStart, f.index.byteEnd))).toBe('https://hockeymomentum.com/hot?utm_source=bluesky');
    expect(f.features[0].uri).toBe('https://hockeymomentum.com/hot?utm_source=bluesky');
  });
  it('no link, no facet', () => {
    expect(linkFacets('just text')).toEqual([]);
  });
});

describe('card rotation', () => {
  it('puts the day\'s card first and keeps the others as fallbacks', () => {
    expect(kindsFor(new Date('2026-11-09T13:00:00Z'))).toEqual(['heat', 'trends', 'night']); // Monday
    expect(kindsFor(new Date('2026-11-10T13:00:00Z'))).toEqual(['night', 'heat', 'trends']); // Tuesday
    expect(kindsFor(new Date('2026-11-11T13:00:00Z'))).toEqual(['trends', 'heat', 'night']); // Wednesday
  });
});
