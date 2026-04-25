// AI-generated insights using Gemini.
//
// Caching strategy:
//   - Player bio + perf_eval: stored in Supabase `ai_player_insights` table
//       bio refreshes every 48h, perf_eval every 6h
//   - Nightly stories: Next.js unstable_cache, 24h TTL per date
//
// Using gemini-2.5-flash-lite — higher free-tier quota than gemini-2.5-flash.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

export async function ask(prompt: string): Promise<string | null> {
  const client = getClient();
  if (!client) { console.error('[ai] ask: GEMINI_API_KEY not set'); return null; }
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() ?? null;
  } catch (err) {
    console.error('[ai] ask error:', err);
    return null;
  }
}

// ─── Shared player input ──────────────────────────────────────────────────────

export interface PlayerAIInput {
  name: string;
  team: string;
  position: string;
  rank: number | null;
  birthCity: string | null;
  birthCountry: string | null;
  age: number | null;
  heightInches: number | null;
  weightPounds: number | null;
  shootsCatches: string | null;
  draftYear: number | null;
  draftRound: number | null;
  draftPick: number | null;
  draftTeam: string | null;
  careerGames: number;
  careerGoals: number;
  careerAssists: number;
  careerPlusMinus: number | null;
  seaGames: number;
  seaGoals: number;
  seaAssists: number;
  seaPoints: number;
  seaPpm: number;
  seaShootPct: number;
  seaToiMin: number;
  momGames: number;
  momGoals: number;
  momAssists: number;
  momPpm: number;
  momShootPct: number;
  momToiMin: number;
  energyBar: number;
  breakoutDelta: number;
  recentGames: Array<{
    date: string;
    opponent: string;
    goals: number;
    assists: number;
    plusMinus: number;
    toiMin: number;
  }>;
}

// ─── Player bio / character ───────────────────────────────────────────────────

function buildBioPrompt(input: PlayerAIInput): string {
  const goalsPerGame = input.careerGames > 0 ? (input.careerGoals / input.careerGames).toFixed(2) : '—';
  const assistsPerGame = input.careerGames > 0 ? (input.careerAssists / input.careerGames).toFixed(2) : '—';
  const careerPoints = input.careerGoals + input.careerAssists;
  const heightFt = input.heightInches ? `${Math.floor(input.heightInches / 12)}′${input.heightInches % 12}″` : null;
  const draftLine = input.draftYear
    ? `Drafted ${input.draftYear}, Round ${input.draftRound}, Pick #${input.draftPick}${input.draftTeam ? ` by ${input.draftTeam}` : ''}`
    : 'Undrafted';

  return `You are a sports writer at Hockey Momentum profiling a player for fans who care about who a player actually is, not just their stats. Your job is to translate the numbers into a compelling portrait — their archetype, their value, their story on the ice.

Player: ${input.name} (${input.team}, ${input.position})
${input.age ? `Age: ${input.age}` : ''}${input.birthCity ? ` · From: ${input.birthCity}, ${input.birthCountry}` : ''}
${heightFt ? `Size: ${heightFt}${input.weightPounds ? `, ${input.weightPounds} lbs` : ''}` : ''}
Shoots: ${input.shootsCatches === 'L' ? 'Left' : input.shootsCatches === 'R' ? 'Right' : '—'}
${draftLine}

Career (${input.careerGames} GP): ${input.careerGoals}G ${input.careerAssists}A ${careerPoints}pts | ${goalsPerGame} G/game | ${assistsPerGame} A/game${input.careerPlusMinus != null ? ` | ${input.careerPlusMinus > 0 ? '+' : ''}${input.careerPlusMinus} +/-` : ''}
Current season (${input.seaGames} GP): ${input.seaGoals}G ${input.seaAssists}A | ${input.seaToiMin.toFixed(1)} min/game

Write 2–3 sentences that capture who this player IS. What makes them worth watching? Are they a pure scorer, a playmaker who makes everyone around them better, a two-way force, a power play weapon, an iron-minutes shutdown defender? Let the goals/assists split, ice time, and career rate do the talking — but say it in a way a fan wants to read. Direct. Specific. Third person. No generic praise like "plays hard every night" or "gives 110%".`;
}

// ─── Player performance eval ──────────────────────────────────────────────────

function buildPerfEvalPrompt(input: PlayerAIInput): string {
  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);
  const ppmDeltaPct = input.seaPpm > 0
    ? ((input.momPpm - input.seaPpm) / input.seaPpm * 100).toFixed(0)
    : null;
  const shootDeltaPpt = ((input.momShootPct - input.seaShootPct) * 100).toFixed(1);
  const toiDelta = (input.momToiMin - input.seaToiMin).toFixed(1);

  const gameLogLines = input.recentGames.slice(0, 5).map(g =>
    `  ${g.date}: vs ${g.opponent} — ${g.goals}G ${g.assists}A (${sign(g.plusMinus)}), ${g.toiMin.toFixed(1)} min`
  ).join('\n');

  return `You are a beat writer at Hockey Momentum. Your job is to tell fans what's actually happening with a player's form right now — not to recite numbers, but to interpret what the numbers mean. Is this player a must-watch right now, or someone to monitor from a distance?

Player: ${input.name} (${input.team}, ${input.position})${input.rank ? ` · Currently ranked #${input.rank} globally` : ''}

Season baseline (${input.seaGames} games): ${input.seaGoals}G ${input.seaAssists}A ${input.seaPoints}pts | PPM ${input.seaPpm.toFixed(4)} | Shot% ${(input.seaShootPct * 100).toFixed(1)}% | ${input.seaToiMin.toFixed(1)} min/game

Last ${input.momGames} games: ${input.momGoals}G ${input.momAssists}A | PPM ${input.momPpm.toFixed(4)}${ppmDeltaPct ? ` (${Number(ppmDeltaPct) >= 0 ? '+' : ''}${ppmDeltaPct}% vs season)` : ''} | Shot% ${(input.momShootPct * 100).toFixed(1)}% (${Number(shootDeltaPpt) >= 0 ? '+' : ''}${shootDeltaPpt}pp) | ${input.momToiMin.toFixed(1)} min/game (${Number(toiDelta) >= 0 ? '+' : ''}${toiDelta} vs season)

Energy bar: ${input.energyBar}/100 — how fresh vs fatigued the recent workload suggests
Breakout delta: ${sign(Number(input.breakoutDelta.toFixed(4)))} PPM

Recent game log:
${gameLogLines || '  No recent games'}

Write 2–3 sentences on this player's current form. Hot streak or cold spell? Is the recent trend meaningful or noise? Connect the numbers to what it means in practice — if a scorer has gone quiet, say so and why it might matter. If someone's quietly playing the best hockey of their season, make that clear. Data-backed but readable. Third person. No clichés.`;
}

// ─── Supabase-cached player insights ─────────────────────────────────────────
// Reads from ai_player_insights; generates + stores if stale or missing.

export async function getPlayerInsights(
  playerId: number,
  input: PlayerAIInput,
): Promise<{ bio: string | null; perfEval: string | null }> {
  const BIO_TTL_H   = 48;
  const PERF_TTL_H  = 6;

  // Load existing row
  const { data: row } = await supabaseAdmin
    .from('ai_player_insights')
    .select('bio, perf_eval, generated_at')
    .eq('player_id', playerId)
    .single();

  const now = Date.now();
  const ageH = row?.generated_at
    ? (now - new Date(row.generated_at).getTime()) / 3_600_000
    : Infinity;

  const needsBio  = !row?.bio  || ageH > BIO_TTL_H;
  const needsPerf = !row?.perf_eval || ageH > PERF_TTL_H;

  if (!needsBio && !needsPerf) {
    return { bio: row!.bio, perfEval: row!.perf_eval };
  }

  // Generate only what's stale — run in parallel if both needed
  const [newBio, newPerf] = await Promise.all([
    needsBio  ? ask(buildBioPrompt(input))      : Promise.resolve(null),
    needsPerf ? ask(buildPerfEvalPrompt(input)) : Promise.resolve(null),
  ]);

  const upsertData = {
    player_id:    playerId,
    bio:          needsBio  ? (newBio  ?? row?.bio  ?? null) : row?.bio,
    perf_eval:    needsPerf ? (newPerf ?? row?.perf_eval ?? null) : row?.perf_eval,
    generated_at: new Date().toISOString(),
  };

  await supabaseAdmin
    .from('ai_player_insights')
    .upsert(upsertData, { onConflict: 'player_id' });

  return {
    bio:      upsertData.bio,
    perfEval: upsertData.perf_eval,
  };
}

// Keep old exports for backwards compat (used in page.tsx)
export const generatePlayerBio = async (input: PlayerAIInput) => ask(buildBioPrompt(input));
export const generatePlayerPerfEval = async (input: PlayerAIInput) => ask(buildPerfEvalPrompt(input));

// ─── Nightly stories ──────────────────────────────────────────────────────────

export interface NightlyGameResult {
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
}

export interface NightlyPerformer {
  name: string;
  team: string;
  position: string;
  goals: number;
  assists: number;
  plusMinus: number;
  toiMin: number;
}

export interface NightlyStoriesInput {
  date: string;
  games: NightlyGameResult[];
  topPerformers: NightlyPerformer[];
}

async function _generateNightlyStories(input: NightlyStoriesInput): Promise<string | null> {
  if (!input.games.length) return null;

  const gameLines = input.games
    .map(g => `  ${g.awayTeam} ${g.awayScore} @ ${g.homeTeam} ${g.homeScore}`)
    .join('\n');

  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);
  const performerLines = input.topPerformers.slice(0, 8).map(p =>
    `  ${p.name} (${p.team}, ${p.position}): ${p.goals}G ${p.assists}A ${sign(p.plusMinus)}, ${p.toiMin.toFixed(1)} min`
  ).join('\n');

  const prompt = `You are a sports writer at Hockey Momentum. Your job is to write the "last night" briefing that a hockey fan reads over their morning coffee — punchy, specific, and worth their time. These are fans who love the game and trust the data, but they want to read a story, not a spreadsheet.

Date: ${input.date}

Final scores:
${gameLines}

Top performers:
${performerLines}

Write 3–5 sentences covering last night's most compelling stories. Lead with whatever was most surprising, dramatic, or interesting — not just the highest score. Name players with their full first and last name. Use specific numbers to back every claim. If a performance was exceptional, say why it matters. If a result was unexpected, say so directly.

Tone: confident, direct, a little opinionated. Active verbs. Short sentences that land. No clichés ("lit the lamp", "finding the back of the net", "battle in the trenches"). No filler ("it was a night of...", "fans were treated to..."). Write like you watched every shift.`;

  return ask(prompt);
}

export const generateNightlyStories = unstable_cache(
  _generateNightlyStories,
  ['nightly-stories-v3'],
  { revalidate: 60 * 60 * 24 },
);

// ─── Daily recap article ──────────────────────────────────────────────────────

export interface RecapGame {
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  predictedCorrectly: boolean | null;
  homeWinProbability: number | null;
}

export interface RecapPerformer {
  name: string;
  team: string;
  position: string;
  goals: number;
  assists: number;
  plusMinus: number;
  toiMin: number;
  momentumPpm: number | null;
  seasonPpm: number | null;
  momentumRank: number | null;
}

export interface RecapShutout {
  name: string;
  team: string;
  saves: number;
}

export interface DailyRecapInput {
  date: string;
  dateLabel: string;
  games: RecapGame[];
  topPerformers: RecapPerformer[];
  shutouts: RecapShutout[];
  newsContext?: string | null;  // recent headlines from RSS/Newsdata
}

export interface DailyRecapOutput {
  title: string;
  summary: string;
  content: string;
  /** Abbreviation of the game featured in the headline, e.g. "MTL @ TOR" */
  featured_game?: string;
}

export async function generateDailyRecap(input: DailyRecapInput): Promise<DailyRecapOutput | null> {
  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);

  const gameLines = input.games.map(g => {
    const winner = g.awayScore > g.homeScore ? g.awayTeam : g.homeTeam;
    const pred = g.predictedCorrectly === true ? '✓ (predicted)' : g.predictedCorrectly === false ? '✗ (upset)' : '';
    return `  ${g.awayTeam} ${g.awayScore} @ ${g.homeTeam} ${g.homeScore}${pred ? ' — ' + pred : ''}${g.homeWinProbability != null ? ` [model gave ${winner} ${g.awayScore > g.homeScore ? (100 - g.homeWinProbability * 100).toFixed(0) : (g.homeWinProbability * 100).toFixed(0)}% win probability]` : ''}`;
  }).join('\n');

  const performerLines = input.topPerformers.slice(0, 8).map(p => {
    const pts = p.goals + p.assists;
    const momContext = p.momentumPpm && p.seasonPpm && p.seasonPpm > 0
      ? ` [momentum PPM ${p.momentumPpm.toFixed(4)}, ${((p.momentumPpm - p.seasonPpm) / p.seasonPpm * 100).toFixed(0)}% ${p.momentumPpm > p.seasonPpm ? 'above' : 'below'} season avg]`
      : '';
    return `  ${p.name} (${p.team}, ${p.position}): ${p.goals}G ${p.assists}A = ${pts}pts, ${sign(p.plusMinus)}, ${p.toiMin.toFixed(1)} min${momContext}`;
  }).join('\n');

  const shutoutLines = input.shutouts.length
    ? '\nShutouts:\n' + input.shutouts.map(s => `  ${s.name} (${s.team}): ${s.saves} saves`).join('\n')
    : '';

  const modelAccuracy = input.games.filter(g => g.predictedCorrectly !== null);
  const correct = modelAccuracy.filter(g => g.predictedCorrectly === true).length;
  const modelLine = modelAccuracy.length > 0
    ? `\nModel accuracy last night: ${correct}/${modelAccuracy.length} games predicted correctly`
    : '';

  const newsSection = input.newsContext
    ? `\nRecent NHL news context (use only if directly relevant to last night's games):\n${input.newsContext}\n`
    : '';

  const gameHeaders = input.games.map(g => {
    const awayWon = g.awayScore > g.homeScore;
    const winner = awayWon ? g.awayTeam : g.homeTeam;
    const margin = Math.abs(g.awayScore - g.homeScore);
    const context = g.predictedCorrectly === false ? 'UPSET' : margin >= 4 ? 'BLOWOUT' : margin === 1 ? 'ONE-GOAL GAME' : '';
    return `${g.awayTeam} ${g.awayScore} @ ${g.homeTeam} ${g.homeScore}${context ? ` [${context}]` : ''}${g.predictedCorrectly !== null ? ` [model: ${g.predictedCorrectly ? '✓' : '✗'}]` : ''}${g.homeWinProbability != null ? ` [gave ${winner} ${awayWon ? ((1 - g.homeWinProbability) * 100).toFixed(0) : (g.homeWinProbability * 100).toFixed(0)}% win prob]` : ''}`;
  }).join('\n');

  const prompt = `You are a senior sports writer at Hockey Momentum. Your voice is ESPN energy meets data credibility — you love the game, you trust the numbers, and you know how to make both come alive on the page. Write a daily recap article for ${input.dateLabel} that reads like real sports journalism. Not a data dump. Not a press release. A story.${newsSection}

GAMES (${input.games.length}):
${gameHeaders}
${shutoutLines}
${modelLine}

TOP PERFORMERS (goals+assists):
${performerLines}

ARTICLE STRUCTURE — follow this exactly:

1. LEDE (1-2 paragraphs): Open with the night's single most compelling story. Don't start with "Tonight", "Last night", or "It was a night". Lead with a specific player, a specific number, or a specific moment. Make the first sentence impossible to ignore — the kind of line that makes a fan stop scrolling. One concrete fact, one strong verb, one clear story.

2. GAME SECTIONS: One section per game, ordered from most to least interesting. Each section must start with EXACTLY this header format on its own line:
### {AWAY_ABBREV} {AWAY_SCORE} @ {HOME_ABBREV} {HOME_SCORE}
Then 4-6 sentences of specific, narrative recap. Always use the player's FULL FIRST AND LAST NAME (e.g. "Connor McDavid", not just "McDavid"). Include exact stats from the data. Describe how the game unfolded — momentum shifts, key sequences, turning points. If the model got it wrong, explain why it was hard to call. If a performer had strong momentum data going in, connect it to what happened on the ice. Make the reader feel like they watched the game.

3. MOMENTUM WATCH section (start with "### Momentum Watch"):
3-4 sentences connecting pre-game momentum data to what happened on the ice. Always use full names. Which players' PPM signals were validated tonight? Who outperformed or underperformed their momentum trend? Be specific — use the % above/below season avg figures from the performer data.

4. LOOKING AHEAD section (start with "### Looking Ahead"):
2-3 sentences. Forward-looking observations — back-to-backs, playoff implications, players to watch. Concrete, not generic. Use full names.

TONE: ESPN excitement meets data credibility. Write like someone who watched every shift and ran every number. Direct sentences. Active verbs. Short paragraphs. One idea per sentence. No clichés ("lit the lamp", "finding the back of the net", "putting pucks on net", "battle in the trenches", "gutsy effort"). No filler ("it was a night of", "fans were treated to", "in what was a"). If it doesn't add information or energy, cut it. Depth over brevity — write approximately twice as much per game section as you normally would.

FULL NAMES: Every time you mention a player, use their full first and last name. Never use last name only.

Respond with valid JSON (no markdown, no code blocks):
{
  "title": "[headline max 70 chars — lead with the biggest story, name a specific player or team, make it compelling enough to click]",
  "summary": "2 sentences max 160 chars total. Name date, key players, teams. Written for Google snippet.",
  "featured_game": "[AWAY_ABBREV @ HOME_ABBREV — the exact game your headline is about, e.g. MTL @ TOR]",
  "content": "[lede paragraph]\\n\\n[optional second lede paragraph]\\n\\n### {AWAY} {score} @ {HOME} {score}\\n\\n[game paragraph]\\n\\n[repeat for each game]\\n\\n### Momentum Watch\\n\\n[paragraph]\\n\\n### Looking Ahead\\n\\n[paragraph]"
}`;

  const raw = await ask(prompt);
  if (!raw) return null;

  try {
    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as DailyRecapOutput;
    if (!parsed.title || !parsed.content) return null;
    return parsed;
  } catch {
    // Fallback: treat whole response as content
    const lines = raw.trim().split('\n');
    return {
      title: lines[0]?.replace(/^#+\s*/, '').slice(0, 100) ?? `NHL Recap — ${input.dateLabel}`,
      summary: lines[1]?.slice(0, 160) ?? '',
      content: raw,
    };
  }
}
