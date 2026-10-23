// AI-generated insights using Gemini.
//
// Caching strategy:
//   - Player bio + perf_eval: stored in Supabase `ai_player_insights` table
//       bio refreshes every 48h, perf_eval every 6h
//   - Nightly stories: Next.js unstable_cache, 24h TTL per date
//
// Using gemini-2.5-flash — better quality than lite; JSON extraction handles code-fence wrapping.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

// Last failure from ask(), so callers (recap route, health checks) can report the
// real cause instead of "check the logs".
export let lastAiError: string | null = null;

// Retry with exponential backoff for transient 503 / 429 errors, then fall through
// the model chain. Google retires model ids without notice (gemini-2.0-flash went
// 404 in 2026 and silently killed recaps), so the chain ends on an alias.
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

// Background/bulk generation (player bios, perf evals, news blurbs) runs on the
// cheaper model with no retries, so it can't drain the daily quota the recap needs.
// Before this, ~150–300 player-page generations a day — each retried up to 9×
// once quota ran out — left nothing for the 08:00 recap.
export const BULK = { models: ['gemini-2.5-flash-lite'], maxRetries: 1 } as const;

export async function ask(
  prompt: string,
  opts: { models?: readonly string[]; maxRetries?: number } = {},
): Promise<string | null> {
  const { models = MODEL_CHAIN, maxRetries = 3 } = opts;
  const client = getClient();
  if (!client) { lastAiError = 'GEMINI_API_KEY not set'; console.error('[ai] ask: GEMINI_API_KEY not set'); return null; }

  const failures: string[] = [];
  for (const modelName of models) {
    const model = client.getGenerativeModel({ model: modelName });
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text()?.trim();
        if (modelName !== models[0] || attempt > 0) {
          console.log(`[ai] ask: succeeded on model=${modelName} attempt=${attempt + 1}`);
        }
        lastAiError = null;
        return text ?? null;
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        // 503, 429, and 500 are transient — except a 429 for an exhausted daily
        // quota, which won't recover by retrying; move to the next model instead.
        const quotaExhausted = status === 429 && /quota/i.test(String((err as Error)?.message ?? ''));
        const isTransient = !quotaExhausted && (status === 503 || status === 429 || status === 500);
        if (isTransient && attempt < maxRetries - 1) {
          const delayMs = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
          console.warn(`[ai] ask: ${status} on model=${modelName} attempt=${attempt + 1}, retrying in ${delayMs}ms`);
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        const msg = `${modelName}: ${status ?? 'error'} ${String((err as Error)?.message ?? err).slice(0, 160)}`;
        failures.push(msg);
        console.warn(`[ai] ask: ${msg} — trying next model`);
        break;
      }
    }
  }

  lastAiError = failures.join(' | ') || 'all models and retries exhausted';
  console.error('[ai] ask: all models failed:', lastAiError);
  return null;
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

  return `You are a sports writer at Momentum profiling a player for fans who care about who a player actually is, not just their stats. Your job is to translate the numbers into a compelling portrait — their archetype, their value, their story on the ice.

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

  return `You are a beat writer at Momentum. Your job is to tell fans what's actually happening with a player's form right now — not to recite numbers, but to interpret what the numbers mean. Is this player a must-watch right now, or someone to monitor from a distance?

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
  const BIO_TTL_H   = 7 * 24;  // bios barely change
  const PERF_TTL_H  = 24;      // form changes at most once per game day

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
    needsBio  ? ask(buildBioPrompt(input), BULK)      : Promise.resolve(null),
    needsPerf ? ask(buildPerfEvalPrompt(input), BULK) : Promise.resolve(null),
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
export const generatePlayerBio = async (input: PlayerAIInput) => ask(buildBioPrompt(input), BULK);
export const generatePlayerPerfEval = async (input: PlayerAIInput) => ask(buildPerfEvalPrompt(input), BULK);

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

  const prompt = `You are a sports writer at Momentum. Your job is to write the "last night" briefing that a hockey fan reads over their morning coffee — punchy, specific, and worth their time. These are fans who love the game and trust the data, but they want to read a story, not a spreadsheet.

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
  awayName?: string;          // full name, e.g. "Buffalo Sabres"
  homeName?: string;
  awayScore: number;
  homeScore: number;
  finish?: 'REG' | 'OT' | 'SO'; // how the game ended (NHL score feed)
  goals?: string[];           // "P1 05:58 BUF Josh Doan (P. Krebs) EV" — the only scoring facts the model may use
  tallies?: PlayerTally[];    // per-player goals/assists from the same feed, to check the article against
  predictedCorrectly: boolean | null;
  homeWinProbability: number | null;
  seriesContext?: string;
}

// One player's line in one game, from the NHL score feed. `name` is the feed's
// short form ("C. Knuble"): initial, period, last name.
export interface PlayerTally { name: string; goals: number; assists: number }

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
    const seriesPart = g.seriesContext ? ` [PLAYOFF: ${g.seriesContext}]` : '';
    const names = g.awayName && g.homeName ? ` (${g.awayName} at ${g.homeName})` : '';
    const finish = g.finish === 'OT' ? ' [FINAL/OT]' : g.finish === 'SO' ? ' [FINAL/SHOOTOUT]' : g.finish === 'REG' ? ' [FINAL in regulation — no overtime]' : '';
    const goals = g.goals?.length ? `\n    Goals: ${g.goals.join('; ')}` : '';
    return `${g.awayTeam} ${g.awayScore} @ ${g.homeTeam} ${g.homeScore}${names}${finish}${context ? ` [${context}]` : ''}${seriesPart}${g.predictedCorrectly !== null ? ` [model: ${g.predictedCorrectly ? '✓' : '✗'}]` : ''}${g.homeWinProbability != null ? ` [gave ${winner} ${awayWon ? ((1 - g.homeWinProbability) * 100).toFixed(0) : (g.homeWinProbability * 100).toFixed(0)}% win prob]` : ''}${goals}`;
  }).join('\n');

  const prompt = `You are a senior sports writer at Momentum. Your voice is ESPN energy meets data credibility — you love the game, you trust the numbers, and you know how to make both come alive on the page. Write a daily recap article for ${input.dateLabel} that reads like real sports journalism. Not a data dump. Not a press release. A story.${newsSection}

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

Then exactly ONE paragraph (2-3 sentences): the result, the one thing that decided it, and the standout performance with exact stats. Each game has its own full story on its own page, linked from here — this article is the night at a glance, so don't retell every goal.

Always use the player's FULL FIRST AND LAST NAME (e.g. "Connor McDavid", not just "McDavid") in both paragraphs.

3. MOMENTUM WATCH section (start with "### Momentum Watch"):
3-4 sentences connecting pre-game momentum data to what happened on the ice. Always use full names. Which players' PPM signals were validated tonight? Who outperformed or underperformed their momentum trend? Be specific — use the % above/below season avg figures from the performer data.

4. LOOKING AHEAD section (start with "### Looking Ahead"):
2-3 sentences. Forward-looking observations — back-to-backs, playoff implications, players to watch. Concrete, not generic. Use full names.

TONE: ESPN excitement meets data credibility. Write like someone who watched every shift and ran every number. Direct sentences. Active verbs. Short paragraphs. One idea per sentence. No clichés ("lit the lamp", "finding the back of the net", "putting pucks on net", "battle in the trenches", "gutsy effort"). No filler ("it was a night of", "fans were treated to", "in what was a"). If it doesn't add information or energy, cut it.

FULL NAMES: Every time you mention a player, use their full first and last name. Never use last name only.

FACTS — NON-NEGOTIABLE: Use only the facts in this prompt. Every goal, scorer, assist, period, time, and how each game ended is listed above; if a detail isn't listed, don't write it. Never invent goals, times, saves, comebacks, crowd reactions, or quotes. Never say a game went to overtime or a shootout unless it is marked [FINAL/OT] or [FINAL/SHOOTOUT]. Refer to teams only by the full names given (e.g. "Buffalo Sabres") or their city/nickname from those names — never any other nickname.

Respond with valid JSON (no markdown, no code blocks):
{
  "title": "[headline max 70 chars — lead with the biggest story, name a specific player or team, make it compelling enough to click]",
  "summary": "2 sentences max 160 chars total. Name date, key players, teams. Written for Google snippet.",
  "featured_game": "[AWAY_ABBREV @ HOME_ABBREV — the exact game your headline is about, e.g. MTL @ TOR]",
  "content": "[lede paragraph]\\n\\n[optional second lede paragraph]\\n\\n### {AWAY} {score} @ {HOME} {score}\\n\\n[one paragraph — the game at a glance]\\n\\n[repeat for each game]\\n\\n### Momentum Watch\\n\\n[paragraph]\\n\\n### Looking Ahead\\n\\n[paragraph]"
}`;

  // Generate, then reject outputs that contradict the facts we supplied (the old
  // prompt had no scoring data, and recaps invented overtime winners and team
  // nicknames). One retry, then give up — no recap beats a wrong one.
  let feedback = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await ask(prompt + feedback);
    if (!raw) return null;
    const parsed = parseRecapOutput(raw, input);
    if (!parsed) { lastAiError = 'unparseable model response'; continue; }
    const problem = recapFactProblem(parsed, input.games);
    if (!problem) return parsed;
    lastAiError = `recap rejected: ${problem}`;
    console.warn(`[ai] recap attempt ${attempt + 1} rejected: ${problem}`);
    feedback = `\n\nYOUR PREVIOUS DRAFT WAS REJECTED BY THE FACT CHECK: ${problem}. Write it again, using only the facts above.`;
  }
  return null;
}

// Cheap consistency checks against the structured game data.
export function recapFactProblem(out: DailyRecapOutput, games: RecapGame[]): string | null {
  const text = `${out.title}\n${out.summary}\n${out.content}`;
  const anyExtra = games.some(g => g.finish === 'OT' || g.finish === 'SO');
  const allKnown = games.every(g => g.finish);
  if (allKnown && !anyExtra && /overtime|\bOT\b|shootout|extra (frame|period|session)|sudden death/i.test(text)) {
    return 'mentions overtime/shootout but every game ended in regulation';
  }
  for (const g of games) {
    for (const full of [g.awayName, g.homeName]) {
      if (!full) continue;
      // Two-word nicknames: Maple Leafs, Red Wings, Blue Jackets, Golden Knights
      const words = full.split(' ');
      const nickLen = /^(Maple|Red|Blue|Golden)$/.test(words[words.length - 2] ?? '') ? 2 : 1;
      const city = words.slice(0, -nickLen).join(' ');            // "Buffalo", "Vegas"
      const nick = words[words.length - nickLen];                 // "Sabres", "Golden"
      if (!city) continue;
      // "<City> <Word>" where Word isn't the real nickname → invented name ("Buffalo Bills")
      const re = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+([A-Z][a-z]+)`, 'g');
      for (const m of text.matchAll(re)) {
        if (m[1] !== nick) {
          return `wrong team name "${city} ${m[1]}" (should be ${full})`;
        }
      }
    }
  }
  return playerClaimProblem(text, games.flatMap(g => g.tallies ?? []));
}

const NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const num = (w: string) => NUM[w.toLowerCase()] ?? (/^\d+$/.test(w) ? Number(w) : null);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Player stat claims checked against the score feed: hat tricks, "two goals",
// "scored twice", "three assists", "four-point night". Each claim belongs to
// the nearest player named before it in the same sentence ("Celebrini's hat
// trick", "Knuble scored twice"); sentences pooling players ("combined for")
// and team numbers ("a two-goal lead") are left alone. The recap of 2026-10-20
// gave Macklin Celebrini a hat trick; the feed had him at two goals.
const TEAM_NOUN = /^\s*(deficit|lead|cushion|advantage|margin|hole|gap|win|victory|game|edge|swing|outburst|period|frame|rally|comeback|burst)/i;
// "a four-point night" is about a player; "a five-goal unanswered run" is not.
const PLAYER_NOUN = /^\s*(night|performance|outing|effort|showing|evening|afternoon|haul|day)\b/i;
// A claim and its player sit in the same clause: nothing like this between them.
const CLAUSE_BREAK = /[:;]|\b(while|but|only|before|after|then|whereas|until)\b/i;

export function playerClaimProblem(text: string, tallies: PlayerTally[]): string | null {
  const players = tallies.flatMap(t => {
    const m = t.name.match(/^(\p{L})\.\s*(.+)$/u);
    if (!m) return [];
    const [, first, last] = m;
    const shared = tallies.filter(o => o.name.replace(/^\p{L}\.\s*/u, '') === last).length > 1;
    // "Cole Knuble" always; plain "Knuble" too unless two players share the name (the Tkachuks).
    const re = shared
      ? new RegExp(`\\b${esc(first)}[\\p{L}'’-]*\\s+${esc(last)}(?![\\p{L}])`, 'gu')
      : new RegExp(`(?<![\\p{L}])${esc(last)}(?![\\p{L}])`, 'gu');
    return [{ ...t, re }];
  });
  if (!players.length) return null;
  const maxGoals = Math.max(...tallies.map(t => t.goals));
  for (const sentence of text.split(/(?<=[.!?])\s+(?=[A-Z])|\n+/)) {
    if (/hat[- ]trick/i.test(sentence) && maxGoals < 3) return `"${sentence.trim()}" — nobody scored three goals`;
    if (/\bcombined\b|\btogether\b|between them/i.test(sentence)) continue;
    const mentions = players.flatMap(p => [...sentence.matchAll(p.re)].map(m => ({ p, at: m.index ?? 0 })));
    if (!mentions.length) continue;
    const owner = (at: number) => {
      const m = mentions.filter(x => x.at < at).sort((a, b) => b.at - a.at)[0];
      return m && !CLAUSE_BREAK.test(sentence.slice(m.at, at)) ? m.p : undefined;
    };
    const claims: { at: number; claim: string; ok: (t: PlayerTally) => boolean }[] = [];
    for (const m of sentence.matchAll(/hat[- ]trick/gi)) claims.push({ at: m.index ?? 0, claim: 'a hat trick', ok: t => t.goals >= 3 });
    for (const m of sentence.matchAll(/scored twice/gi)) claims.push({ at: m.index ?? 0, claim: 'two goals', ok: t => t.goals === 2 });
    const counted: [RegExp, string, (t: PlayerTally) => number][] = [
      [/\b(\w+)([- ])goals?\b/gi, 'goals', t => t.goals],
      [/\b(\w+)([- ])assists?\b/gi, 'assists', t => t.assists],
      [/\b(\w+)([- ])points?\b/gi, 'points', t => t.goals + t.assists],
    ];
    for (const [re, what, value] of counted) {
      for (const m of sentence.matchAll(re)) {
        const n = num(m[1]);
        const after = sentence.slice((m.index ?? 0) + m[0].length);
        if (n == null || (m[2] === '-' ? !PLAYER_NOUN.test(after) : TEAM_NOUN.test(after))) continue;
        claims.push({ at: m.index ?? 0, claim: `${m[1]} ${what}`, ok: t => value(t) === n });
      }
    }
    for (const c of claims) {
      const p = owner(c.at);
      if (p && !c.ok(p)) return `"${sentence.trim()}" — ${p.name} had ${p.goals}G ${p.assists}A, not ${c.claim}`;
    }
  }
  return null;
}

// ─── Game story ───────────────────────────────────────────────────────────────
// One article per finished game, shown on the game's page (the page people
// search for: "Senators Panthers recap"). The night recap links to these.

export interface GameStoryInput {
  dateLabel: string;
  game: RecapGame;              // with goals, tallies and how it ended
  stars: string[];              // official three stars, e.g. "1. Tim Stützle (OTT): 1G 1A"
  performers: RecapPerformer[]; // this game's skaters with a point
}

export interface GameStoryOutput { headline: string; dek: string; body: string }

export async function generateGameStory(input: GameStoryInput): Promise<GameStoryOutput | null> {
  const g = input.game;
  const awayWon = g.awayScore > g.homeScore;
  const winner = awayWon ? (g.awayName ?? g.awayTeam) : (g.homeName ?? g.homeTeam);
  const finish = g.finish === 'OT' ? 'FINAL/OT' : g.finish === 'SO' ? 'FINAL/SHOOTOUT' : g.finish === 'REG' ? 'FINAL in regulation — no overtime' : 'FINAL';
  const model = g.homeWinProbability == null ? 'No pre-game prediction.'
    : `Our model gave ${winner} a ${Math.round((awayWon ? 1 - g.homeWinProbability : g.homeWinProbability) * 100)}% chance to win; the pick was ${g.predictedCorrectly ? 'right' : g.predictedCorrectly === false ? 'wrong' : 'not graded'}.`;
  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);
  const performers = input.performers.map(p => {
    const vs = p.momentumPpm && p.seasonPpm && p.seasonPpm > 0
      ? `, recent form ${Math.round((p.momentumPpm - p.seasonPpm) / p.seasonPpm * 100)}% ${p.momentumPpm > p.seasonPpm ? 'above' : 'below'} his season average` : '';
    return `  ${p.name} (${p.team}, ${p.position}): ${p.goals}G ${p.assists}A, ${sign(p.plusMinus)}, ${p.toiMin.toFixed(1)} min${vs}`;
  }).join('\n');

  const prompt = `You are a senior sports writer at momentum., an NHL analytics site. Write the game story for one game played ${input.dateLabel}. Readers find it by searching for the game, so it must stand on its own.

GAME: ${g.awayName ?? g.awayTeam} ${g.awayScore} at ${g.homeName ?? g.homeTeam} ${g.homeScore} [${finish}]
Goals (period, time, team, scorer, assists): ${g.goals?.length ? g.goals.join('; ') : 'not available'}
Official three stars:
${input.stars.join('\n') || '  not available'}
Skaters with a point:
${performers || '  not available'}
${model}

WRITE:
- "headline": max 70 characters. Name the player or team that decided it, with a strong verb. No dates, no "recap".
- "dek": one or two sentences, max 180 characters: who won, the score, and the one fact that mattered most.
- "body": three paragraphs separated by a blank line, 170–230 words in total.
  1. How the game unfolded: the scoring sequence and turning points, from the goals list.
  2. The standout performances, with exact stats woven into sentences.
  3. The data angle: what our model expected and whether it held, and the recent-form numbers above where they explain the result.

RULES — NON-NEGOTIABLE: Use only the facts above. Every goal, scorer, assist, period and time is listed; if a detail isn't listed, don't write it. No invented saves, hits, crowd reactions, quotes or streaks. Never say overtime or shootout unless the game is marked so. Name teams only by the names given or their city or nickname from those names. Use each player's full name on first mention. No clichés ("lit the lamp", "found the back of the net").

Respond with valid JSON only: {"headline": "...", "dek": "...", "body": "..."}`;

  let feedback = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await ask(prompt + feedback);
    if (!raw) return null;
    let out: GameStoryOutput;
    try {
      out = parseJsonObject<GameStoryOutput>(raw);
    } catch {
      lastAiError = 'unparseable game story';
      continue;
    }
    if (!out.headline?.trim() || !out.body?.trim() || out.body.replace(/[^a-zA-Z]/g, '').length < 200) {
      lastAiError = 'game story too short or missing fields';
      continue;
    }
    const problem = recapFactProblem({ title: out.headline, summary: out.dek ?? '', content: out.body }, [g]);
    if (!problem) return { headline: out.headline.trim(), dek: (out.dek ?? '').trim(), body: out.body.trim() };
    lastAiError = `game story rejected: ${problem}`;
    console.warn(`[ai] game story ${g.awayTeam}@${g.homeTeam} attempt ${attempt + 1} rejected: ${problem}`);
    feedback = `\n\nYOUR PREVIOUS DRAFT WAS REJECTED BY THE FACT CHECK: ${problem}. Write it again, using only the facts above.`;
  }
  return null;
}


// Repair literal control characters inside JSON string values.
// Gemini occasionally outputs real \n/\r/\t inside string values instead of
// their JSON escape sequences — this makes JSON.parse throw even though the
// structure is otherwise valid.
function repairJsonStrings(json: string): string {
  let out = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\') { out += ch; esc = true; continue; }
    if (ch === '"') { out += ch; inStr = !inStr; continue; }
    if (inStr) {
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') { out += '\\r'; continue; }
      if (ch === '\t') { out += '\\t'; continue; }
    }
    out += ch;
  }
  return out;
}

// Find the balanced closing brace of the outermost JSON object.
// lastIndexOf('}') picks up braces inside article text and truncates the parse.
function findJsonEnd(str: string, start: number): number {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  return -1;
}

// The outermost JSON object in a model response (code fences stripped,
// raw control characters inside strings repaired). Throws if none parses.
function parseJsonObject<T>(raw: string): T {
  const stripped = raw.trim()
    .replace(/^```json\s*/im, '').replace(/^```\s*/im, '').replace(/\s*```\s*$/im, '').trim();
  const jsonStart = stripped.indexOf('{');
  const jsonEnd = jsonStart !== -1 ? findJsonEnd(stripped, jsonStart) : -1;
  const extracted = jsonStart !== -1 && jsonEnd > jsonStart ? stripped.slice(jsonStart, jsonEnd + 1) : stripped;
  return JSON.parse(repairJsonStrings(extracted)) as T;
}

function parseRecapOutput(raw: string, input: DailyRecapInput): DailyRecapOutput | null {

  // A truncated or empty model response (e.g. "{" alone) parses/falls-through
  // "successfully" but produces a title/content with no real words — reject
  // rather than let it reach the DB and render as broken text on the site.
  const hasRealWords = (s: string | undefined | null) => (s ?? '').replace(/[^a-zA-Z]/g, '').length >= 8;

  try {
    const parsed = parseJsonObject<DailyRecapOutput>(raw);
    if (!hasRealWords(parsed.title) || !hasRealWords(parsed.content)) return null;
    return parsed;
  } catch {
    // Fallback: treat whole response as content, stripping any code fence header
    const stripped = raw.trim()
      .replace(/^```json\s*/im, '').replace(/^```\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const lines = stripped.split('\n');
    const title = lines[0]?.replace(/^#+\s*/, '').slice(0, 100);
    if (!hasRealWords(title) || !hasRealWords(stripped)) return null;
    return {
      title: title ?? `NHL Recap — ${input.dateLabel}`,
      summary: lines[1]?.slice(0, 160) ?? '',
      content: stripped,
    };
  }
}
