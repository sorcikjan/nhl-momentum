import { fallbackImage, heatPostImage, nightPostImage, trendsPostImage, type PostRow } from '@/lib/og';
import { fetchShareData } from '@/lib/share-data';
import { SHARE_KINDS, type ShareKind } from '@/lib/share-cards';
import type { PlayerRowData } from '@/lib/player-row';

const TONE = { rise: '#00e5a0', cold: '#3a88ff', muted: '#8a94a6' } as const;
const row = (r: PlayerRowData): PostRow => ({
  photo: r.photo, team: r.team, name: r.name, sub: `${r.team} · ${r.pos} · ${r.l5}`,
  value: r.value, heat: r.valueHeat, chip: r.chip ? { text: r.chip.text, color: TONE[r.chip.tone] } : null,
});

// GET /share/card/{heat|trends|night} — this morning's share card, 1080×1350.
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!SHARE_KINDS.includes(kind as ShareKind)) return new Response('Not found', { status: 404 });
  const d = await fetchShareData();
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
