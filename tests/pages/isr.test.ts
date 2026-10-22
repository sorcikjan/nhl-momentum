import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Dynamic-segment pages are rendered on EVERY request (no ISR, "ƒ" in the build,
// cache-control: no-store) unless they declare generateStaticParams — even an
// empty list turns on render-on-first-visit + revalidate caching.
const pages = [
  'app/games/[id]/[slug]/page.tsx',
  'app/players/[id]/[slug]/page.tsx',
  'app/teams/[id]/[slug]/page.tsx',
  'app/recaps/[date]/[slug]/page.tsx',
  'app/predictions/[date]/page.tsx',
];

describe('ISR on dynamic pages (free-tier database)', () => {
  for (const p of pages) {
    it(`${p} is cached (generateStaticParams + revalidate)`, () => {
      const src = readFileSync(p, 'utf8');
      expect(src).toMatch(/export (async )?function generateStaticParams/);
      expect(src).toMatch(/export const revalidate = \d+/);
    });
  }
});
