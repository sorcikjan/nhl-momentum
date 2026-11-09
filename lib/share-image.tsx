// The morning share cards as 1080×1350 PNGs — served at /share/card/{kind} and
// attached to the Bluesky morning post.
import { fallbackImage, heatPostImage, nightPostImage, trendsPostImage, type PostRow } from '@/lib/og';
import type { ShareData, ShareKind } from '@/lib/share-cards';
import type { PlayerRowData } from '@/lib/player-row';

export const CARD_SIZE = { width: 1080, height: 1350 } as const;

const TONE = { rise: '#00e5a0', cold: '#3a88ff', muted: '#8a94a6' } as const;
const row = (r: PlayerRowData): PostRow => ({
  photo: r.photo, team: r.team, name: r.name, sub: `${r.team} · ${r.pos} · ${r.l5}`,
  value: r.value, heat: r.valueHeat, chip: r.chip ? { text: r.chip.text, color: TONE[r.chip.tone] } : null,
});

export function shareCardImage(kind: ShareKind, d: ShareData) {
  if (kind === 'heat' && d.leader) {
    const L = d.leader;
    return heatPostImage(d.dateLabel, {
      name: `${L.first} ${L.last}`, team: L.team, teamName: L.teamName, photo: L.photo, heat: L.heat,
      line: `${L.goals}G ${L.assists}A in ${L.games} games`, pace: L.pace,
    }, d.top.slice(0, 4).map(row));
  }
  if (kind === 'trends' && d.heatingUp.length) return trendsPostImage(d.dateLabel, d.heatingUp.slice(0, 5).map(row), d.coolingOff.slice(0, 3).map(row));
  if (kind === 'night' && d.night?.games.length) {
    return nightPostImage(d.night.dateLabel, d.night.games, d.night.goals.map(g => ({ scorer: g.scorer, team: g.team, photo: g.photo, kicker: g.kicker, score: g.score, when: g.when })));
  }
  return fallbackImage('HOCKEY MOMENTUM', 'Hockey Intelligence, Daily.');
}
