import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Every page's main heading comes from the shared SectionHeading (one <h1>, with a
// kicker) — no hand-styled headings, so all pages read as one product.
const pages = [
  'app/teams/[id]/[slug]/page.tsx', 'app/recaps/page.tsx', 'app/recaps/[date]/[slug]/page.tsx',
  'app/accuracy/page.tsx', 'app/search/page.tsx',
];

describe.each(pages)('%s', file => {
  const src = readFileSync(file, 'utf8');
  it('uses SectionHeading as its h1', () => {
    expect(src).toMatch(/<SectionHeading[\s\S]*?as="h1"/);
  });
  it('has no hand-styled <h1>', () => {
    expect(src).not.toMatch(/<h1[\s>]/);
  });
  it('no longer narrows itself with its own max-width wrapper or var(--neon)', () => {
    expect(src).not.toMatch(/max-w-(lg|2xl|3xl|5xl|6xl) mx-auto/);
    expect(src).not.toContain('var(--neon)');
  });
});
