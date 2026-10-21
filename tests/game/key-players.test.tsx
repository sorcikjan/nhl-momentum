import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KeyPlayers } from '@/components/game/KeyPlayers';
import type { CardPlayer } from '@/lib/game-card';

const p = (id: number, extra: Partial<CardPlayer> = {}): CardPlayer => ({ playerId: id, name: `Joe Player${id}`, href: `/players/${id}/p`, photo: `https://x/${id}.png`, heat: 80, stat: '5 pts in last 3', ...extra });

describe('KeyPlayers (game page) — same rows as the game cards', () => {
  it('shows three per team with photo, line and Heat, linking each player', () => {
    const out = renderToStaticMarkup(<KeyPlayers away={{ abbrev: 'ANA', name: 'Anaheim', players: [p(1), p(2), p(3)] }} home={{ abbrev: 'NYR', name: 'NY Rangers', players: [p(4)] }} />);
    expect(out).toContain('Anaheim');
    expect(out.match(/data-card-player/g)).toHaveLength(4);
    expect(out).toContain('https://x/1.png');
    expect(out).toContain('5 pts in last 3');
    expect(out).toContain('>80<');
    expect(out).toContain('href="/players/1/p"');
  });
  it('stacks on phones, side by side from sm up', () => {
    const out = renderToStaticMarkup(<KeyPlayers away={{ abbrev: 'ANA', name: 'Anaheim', players: [p(1)] }} home={{ abbrev: 'NYR', name: 'NY Rangers', players: [] }} />);
    expect(out).toContain('grid-cols-1');
    expect(out).toContain('sm:grid-cols-2');
    expect(out).toContain('Lineup pending');
  });
});
