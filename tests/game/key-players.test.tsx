import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KeyPlayers } from '@/components/game/KeyPlayers';
import type { KeyPlayer } from '@/lib/key-players';

const kp = (id: number, team: string, extra: Partial<KeyPlayer> = {}): KeyPlayer => ({
  playerId: id, name: `Player ${id}`, href: `/players/${id}/p`, photo: `https://x/${id}.png`, team, pos: 'C', heat: 80, line: '5 pts in last 3', ...extra,
});

describe('KeyPlayers', () => {
  it('shows three per team side by side with photo, reason and Heat', () => {
    const out = renderToStaticMarkup(<KeyPlayers away={{ abbrev: 'ANA', name: 'Anaheim', players: [kp(1, 'ANA'), kp(2, 'ANA'), kp(3, 'ANA')] }} home={{ abbrev: 'NYR', name: 'NY Rangers', players: [kp(4, 'NYR')] }} />);
    expect(out).toContain('Anaheim');
    expect(out).toContain('NY Rangers');
    expect(out.match(/data-key-player/g)).toHaveLength(4);
    expect(out).toContain('https://x/1.png');
    expect(out).toContain('5 pts in last 3');
    expect(out).toContain('>80<');
    // Stacked on phones (names and stat lines need the width), side by side from sm up.
    expect(out).toContain('grid-cols-1');
    expect(out).toContain('sm:grid-cols-2');
  });
  it('shows the post-game Heat change instead of Heat', () => {
    const out = renderToStaticMarkup(<KeyPlayers away={{ abbrev: 'ANA', name: 'Anaheim', players: [kp(1, 'ANA', { heat: null, delta: 12, line: '2G · 4 SOG' })] }} home={{ abbrev: 'NYR', name: 'NY Rangers', players: [] }} />);
    expect(out).toContain('↑ 12');
    expect(out).toContain('No lineup data yet.');
  });
  it('truncates long names inside the narrow mobile columns', () => {
    const out = renderToStaticMarkup(<KeyPlayers away={{ abbrev: 'ANA', name: 'Anaheim', players: [kp(1, 'ANA', { name: 'Oliver Ekman-Larsson-Andersson' })] }} home={{ abbrev: 'NYR', name: 'NY Rangers', players: [] }} />);
    expect(out).toContain('truncate');
  });
});
