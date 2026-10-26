// Last night's best goals: every goal in the NHL score feed scored by what
// made it matter (an OT winner, a late equalizer, shorthanded, a hat trick),
// garbage goals out (empty net, own goals, blowouts). Only goals that clear
// the bar make it — a quiet night shows fewer, not worse.

export type Moment = {
  gameId: number;
  href: string;          // the official clip on NHL.com
  kicker: string;        // "OT WINNER"
  scorer: string;        // "Matthew Tkachuk"
  playerId: number;
  team: string;
  photo: string | null;
  score: string;         // "FLA 4–3 CHI"
  when: string;          // "OT 2:11", "3rd 18:40"
  line: string;          // "5th goal of the season · Heat 81"
  points: number;
  // From the clip's NHL.com page (withClips): its still, its title and the
  // player NHL.com itself embeds. Null when the page couldn't be read.
  thumb?: string | null;
  title?: string | null;
  embed?: string | null;
};

const BAR = 4;
const FLOOR = 3;   // a quiet night tops up to MIN with tagged goals this good
const MIN = 3;
const MAX = 5;
const PER_GAME = 2;

const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
const clock = (t: string) => t.replace(/^0(?=\d:)/, '');
const secs = (t: string) => { const [m, s] = t.split(':').map(Number); return (m || 0) * 60 + (s || 0); };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bestGoals(feed: { games?: any[] }, heatBy: Record<number, number> = {}): Moment[] {
  const all: Moment[] = [];
  for (const g of feed.games ?? []) {
    const type = g.gameOutcome?.lastPeriodType;
    if (type !== 'REG' && type !== 'OT' && type !== 'SO') continue;
    const home = g.homeTeam?.abbrev, away = g.awayTeam?.abbrev;
    const hs = g.homeTeam?.score ?? 0, as = g.awayTeam?.score ?? 0;
    const winner = hs > as ? home : away;
    const loserScore = Math.min(hs, as);
    const score = hs > as ? `${home} ${hs}–${as} ${away}` : `${away} ${as}–${hs} ${home}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goals = ((g.goals ?? []) as any[]).filter(gl => gl.periodDescriptor?.periodType !== 'SO');
    const byPlayer = new Map<number, number>();
    let prevH = 0, prevA = 0;
    const picks: Moment[] = [];
    for (const gl of goals) {
      const isHome = gl.teamAbbrev === home;
      const nowH = gl.homeScore ?? prevH, nowA = gl.awayScore ?? prevA;
      const before = isHome ? prevH - prevA : prevA - prevH;   // scorer's lead before the goal
      prevH = nowH; prevA = nowA;
      const nth = (byPlayer.get(gl.playerId) ?? 0) + 1;
      byPlayer.set(gl.playerId, nth);
      if (gl.goalModifier === 'empty-net' || gl.goalModifier === 'own-goal') continue;
      if (!gl.highlightClipSharingUrl) continue;
      if (Math.abs(before) >= 3) continue;

      const ot = gl.periodDescriptor?.periodType === 'OT';
      const p3late = gl.period === 3 && secs(gl.timeInPeriod ?? '0:00') >= 15 * 60;
      const mine = isHome ? nowH : nowA;
      const gwg = gl.teamAbbrev === winner && mine === loserScore + 1 && before === 0 && type !== 'SO';
      const tags: [number, string][] = [];
      if (ot) tags.push([7, 'OT WINNER']);
      else if (gwg && p3late) tags.push([6, 'LATE WINNER']);
      else if (before === -1 && p3late) tags.push([5, 'LATE EQUALIZER']);
      else if (gwg) tags.push([3, 'GAME WINNER']);
      else if (before === 0 && p3late) tags.push([3, 'LATE GO-AHEAD']);
      if (gl.goalModifier === 'penalty-shot') tags.push([4, 'PENALTY SHOT']);
      if (gl.strength === 'sh') tags.push([3, 'SHORTHANDED']);
      if (nth === 3) tags.push([3, 'HAT TRICK']);
      const heat = heatBy[gl.playerId];
      let points = tags.reduce((s, [p]) => s + p, 0);
      if (Math.abs(hs - as) === 1) points += 1;
      if (heat != null && heat >= 80) points += 1;
      if (points < FLOOR || !tags.length) continue;

      const name = `${gl.firstName?.default ?? ''} ${gl.lastName?.default ?? ''}`.trim() || gl.name?.default || '';
      const line = [
        gl.goalsToDate ? `${ord(gl.goalsToDate)} goal of the season` : null,
        heat != null ? `Heat ${heat}` : null,
      ].filter(Boolean).join(' · ');
      picks.push({
        gameId: g.id, href: gl.highlightClipSharingUrl, kicker: tags.sort((a, b) => b[0] - a[0]).map(t => t[1]).slice(0, 2).join(' · '),
        scorer: name, playerId: gl.playerId, team: gl.teamAbbrev, photo: gl.mugshot ?? gl.headshot ?? null,
        score, when: ot ? `OT ${clock(gl.timeInPeriod)}` : `${ord(gl.period)} ${clock(gl.timeInPeriod)}`, line, points,
      });
    }
    all.push(...picks.sort((a, b) => b.points - a.points).slice(0, PER_GAME));
  }
  all.sort((a, b) => b.points - a.points);
  const strong = all.filter(m => m.points >= BAR);
  return (strong.length >= MIN ? strong : all.slice(0, MIN)).slice(0, MAX);
}

const decode = (t: string) => t.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

// What a clip page publishes about itself: og:image, og:title, and the
// player URL NHL.com embeds for that clip.
export function parseClipPage(html: string, clipId: string | null) {
  const meta = (prop: string) => html.match(new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]+)"`))?.[1] ?? null;
  const title = meta('og:title');
  const embed = clipId
    ? html.match(new RegExp(`https://players\\.brightcove\\.net/\\d+/[\\w-]+/index\\.html\\?videoId=${clipId}`))?.[0] ?? null
    : null;
  return { thumb: meta('og:image'), title: title ? decode(title).replace(/\s*\|\s*NHL\.com\s*$/, '') : null, embed };
}

// Each moment's still, title and player. A clip page that fails leaves the
// card as it was (it still links to NHL.com). Clip pages don't change: a day's cache.
export async function withClips(moments: Moment[]): Promise<Moment[]> {
  return Promise.all(moments.map(async m => {
    try {
      const res = await fetch(m.href, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return m;
      return { ...m, ...parseClipPage(await res.text(), m.href.match(/-(\d+)$/)?.[1] ?? null) };
    } catch {
      return m;
    }
  }));
}
