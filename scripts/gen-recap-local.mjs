/**
 * Local one-shot recap generator for 2026-04-28.
 * Run with: node scripts/gen-recap-local.mjs
 *
 * Reads credentials from .env.local, fetches data from Supabase,
 * calls Gemini, and upserts the result to daily_recaps.
 */

import { readFileSync } from 'fs';
import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';
import { GoogleGenerativeAI } from '../node_modules/@google/generative-ai/dist/index.mjs';

// ── 1. Load .env.local ──────────────────────────────────────────────────────
const envPath = new URL('../.env.local', import.meta.url).pathname;
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Strip surrounding quotes if present
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY   = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) {
  console.error('Missing env vars:', { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_KEY: !!SUPABASE_KEY, GEMINI_KEY: !!GEMINI_KEY });
  process.exit(1);
}

const TARGET_DATE = '2026-04-28';

// ── 2. Supabase client ──────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── 3. Helper: get active model version ────────────────────────────────────
async function latestModelVersion() {
  const { data } = await supabase
    .from('model_versions')
    .select('version')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data?.version ?? 'v1.8';
}

// ── 4. Helper: check if game ID is playoff ──────────────────────────────────
function isPlayoffGameId(id) {
  // NHL playoff game IDs have a specific structure — season year * 1000000 + 030xxx
  // Regular season ends with 020xxx
  if (!id) return false;
  const str = String(id);
  // Playoff games: last 6 digits start with 03
  return str.length >= 8 && str.slice(-6, -4) === '03';
}

// ── 5. Fetch series standings for playoff context ───────────────────────────
async function fetchSeriesStandings() {
  // Returns a map of "round-series" -> { awayWins, homeWins, awayTeam, homeTeam }
  // We'll query directly from Supabase series_standings if available,
  // otherwise skip series context.
  try {
    const { data } = await supabase
      .from('series_standings')
      .select('round, series_letter, away_wins, home_wins, away_team_id, home_team_id, away_team:teams!series_standings_away_team_id_fkey(abbrev), home_team:teams!series_standings_home_team_id_fkey(abbrev)');
    const map = new Map();
    for (const s of (data ?? [])) {
      map.set(`${s.round}-${s.series_letter}`, {
        awayWins: s.away_wins ?? 0,
        homeWins: s.home_wins ?? 0,
        awayTeam: s.away_team,
        homeTeam: s.home_team,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

function parsePlayoffGameId(id) {
  // e.g. 2025030123 → round=1, series=2, gameInSeries=3
  const str = String(id);
  const last4 = str.slice(-4);
  const round = parseInt(last4[0], 10);
  const series = parseInt(last4[1], 10);
  const gameInSeries = parseInt(last4.slice(2), 10);
  return { round, series, gameInSeries };
}

// ── 6. Main: fetch recap data ───────────────────────────────────────────────
async function fetchRecapData(date) {
  const modelVersion = await latestModelVersion();
  console.log(`[data] Using model version: ${modelVersion}`);

  // Games
  const { data: games, error: gErr } = await supabase
    .from('games')
    .select(`
      id, game_date, home_score, away_score, youtube_highlight_id,
      venue, start_time_utc, three_stars, team_game_stats,
      home_team:teams!games_home_team_id_fkey(id, abbrev, name, logo_url),
      away_team:teams!games_away_team_id_fkey(id, abbrev, name, logo_url)
    `)
    .eq('game_date', date)
    .in('game_state', ['FINAL', 'OFF']);

  if (gErr) { console.error('[data] games error:', gErr); return null; }
  if (!games?.length) { console.log('[data] No finished games for', date); return null; }
  console.log(`[data] Found ${games.length} games`);

  const gameIds = games.map(g => g.id);

  // Parallel queries
  const [
    { data: predictions },
    { data: stats },
    { data: goalieStats },
  ] = await Promise.all([
    supabase
      .from('predictions')
      .select('game_id, home_win_probability, predicted_home_score, predicted_away_score, prediction_outcomes(correct_winner, actual_home_score, actual_away_score)')
      .eq('model_version', modelVersion)
      .in('game_id', gameIds),
    supabase
      .from('game_player_stats')
      .select(`
        player_id, game_id, goals, assists, plus_minus, toi_seconds, shots_on_goal,
        players(first_name, last_name, position_code, headshot_url),
        teams(id, abbrev, name)
      `)
      .in('game_id', gameIds)
      .neq('players.position_code', 'G'),
    supabase
      .from('game_goalie_stats')
      .select('player_id, game_id, goals_against, saves:shots_against, toi_seconds, decision, players(first_name, last_name), teams(abbrev)')
      .in('game_id', gameIds)
      .eq('goals_against', 0)
      .gt('toi_seconds', 3000),
  ]);

  console.log(`[data] predictions=${predictions?.length ?? 0}, skater stats=${stats?.length ?? 0}, shutouts=${goalieStats?.length ?? 0}`);

  // predMap
  const predMap = new Map();
  for (const p of (predictions ?? [])) predMap.set(p.game_id, p);

  // Top performers (skaters only, sorted by points)
  const topPerformers = (stats ?? [])
    .filter(s => s.players)
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
    .slice(0, 8);

  // Momentum snapshots for top performers
  const topIds = topPerformers.map(p => p.player_id);
  const snapshots = topIds.length
    ? (await supabase
        .from('player_metric_snapshots')
        .select('player_id, momentum_ppm, season_ppm, momentum_rank')
        .in('player_id', topIds)
        .order('calculated_at', { ascending: false })
        .limit(topIds.length * 2)).data ?? []
    : [];

  const snapMap = new Map();
  for (const s of snapshots) {
    if (!snapMap.has(s.player_id)) snapMap.set(s.player_id, s);
  }

  // Series context (playoff)
  const seriesMap = new Map();
  if (games.length && isPlayoffGameId(games[0]?.id)) {
    console.log('[data] Playoff games detected — fetching series standings');
    const allSeries = await fetchSeriesStandings();
    for (const g of games) {
      const { round, series, gameInSeries } = parsePlayoffGameId(g.id);
      const s = allSeries.get(`${round}-${series}`);
      if (!s) continue;
      const awayW = s.awayWins - ((g.game_state === 'FINAL' || g.game_state === 'OFF') && (g.away_score ?? 0) > (g.home_score ?? 0) ? 1 : 0);
      const homeW = s.homeWins - ((g.game_state === 'FINAL' || g.game_state === 'OFF') && (g.home_score ?? 0) > (g.away_score ?? 0) ? 1 : 0);
      const label = awayW === homeW
        ? `Tied ${awayW}–${homeW}`
        : awayW > homeW
        ? `${s.awayTeam?.abbrev} leads ${awayW}–${homeW}`
        : `${s.homeTeam?.abbrev} leads ${homeW}–${awayW}`;
      seriesMap.set(g.id, `Game ${gameInSeries} · ${label}`);
    }
  }

  return {
    games,
    predMap,
    seriesMap,
    topPerformers: topPerformers.map(p => ({ ...p, snapshot: snapMap.get(p.player_id) ?? null })),
    shutouts: goalieStats ?? [],
  };
}

// ── 7. Fetch recent soft signals (news context) ─────────────────────────────
async function fetchRecentSoftSignals(withinHours = 48, limit = 10) {
  const since = new Date(Date.now() - withinHours * 3_600_000).toISOString();
  const { data } = await supabase
    .from('soft_signals')
    .select('type, title, content, source, published_at')
    .gte('fetched_at', since)
    .order('published_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ── 8. Build prompt (mirrors generateDailyRecap in ai.ts) ──────────────────
function buildPrompt(input) {
  const sign = n => n >= 0 ? `+${n}` : String(n);

  const gameHeaders = input.games.map(g => {
    const awayWon = g.awayScore > g.homeScore;
    const winner = awayWon ? g.awayTeam : g.homeTeam;
    const margin = Math.abs(g.awayScore - g.homeScore);
    const context = g.predictedCorrectly === false ? 'UPSET' : margin >= 4 ? 'BLOWOUT' : margin === 1 ? 'ONE-GOAL GAME' : '';
    const seriesPart = g.seriesContext ? ` [PLAYOFF: ${g.seriesContext}]` : '';
    return `${g.awayTeam} ${g.awayScore} @ ${g.homeTeam} ${g.homeScore}${context ? ` [${context}]` : ''}${seriesPart}${g.predictedCorrectly !== null ? ` [model: ${g.predictedCorrectly ? '✓' : '✗'}]` : ''}${g.homeWinProbability != null ? ` [gave ${winner} ${awayWon ? ((1 - g.homeWinProbability) * 100).toFixed(0) : (g.homeWinProbability * 100).toFixed(0)}% win prob]` : ''}`;
  }).join('\n');

  const shutoutLines = input.shutouts.length
    ? '\nShutouts:\n' + input.shutouts.map(s => `  ${s.name} (${s.team}): ${s.saves} saves`).join('\n')
    : '';

  const modelAccuracy = input.games.filter(g => g.predictedCorrectly !== null);
  const correct = modelAccuracy.filter(g => g.predictedCorrectly === true).length;
  const modelLine = modelAccuracy.length > 0
    ? `\nModel accuracy last night: ${correct}/${modelAccuracy.length} games predicted correctly`
    : '';

  const performerLines = input.topPerformers.slice(0, 8).map(p => {
    const pts = p.goals + p.assists;
    const momContext = p.momentumPpm && p.seasonPpm && p.seasonPpm > 0
      ? ` [momentum PPM ${p.momentumPpm.toFixed(4)}, ${((p.momentumPpm - p.seasonPpm) / p.seasonPpm * 100).toFixed(0)}% ${p.momentumPpm > p.seasonPpm ? 'above' : 'below'} season avg]`
      : '';
    return `  ${p.name} (${p.team}, ${p.position}): ${p.goals}G ${p.assists}A = ${pts}pts, ${sign(p.plusMinus)}, ${p.toiMin.toFixed(1)} min${momContext}`;
  }).join('\n');

  const newsSection = input.newsContext
    ? `\nRecent NHL news context (use only if directly relevant to last night's games):\n${input.newsContext}\n`
    : '';

  return `You are a senior sports writer at Hockey Momentum. Your voice is ESPN energy meets data credibility — you love the game, you trust the numbers, and you know how to make both come alive on the page. Write a daily recap article for ${input.dateLabel} that reads like real sports journalism. Not a data dump. Not a press release. A story.${newsSection}

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

Then exactly TWO paragraphs separated by a blank line:

PARAGRAPH 1 (2-3 sentences) — The game story: how it unfolded, key scoring sequences, momentum shifts, turning points. Active verbs, specific moments. Make the reader feel like they watched it.

PARAGRAPH 2 (2-3 sentences) — The analytical layer: what the pre-game momentum data said vs. what actually happened on the ice, the prediction outcome (if upset, explain why the data missed it; if correct, validate what the signal caught), standout individual performance with exact stats woven naturally into the sentence.

Always use the player's FULL FIRST AND LAST NAME (e.g. "Connor McDavid", not just "McDavid") in both paragraphs.

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
  "content": "[lede paragraph]\\n\\n[optional second lede paragraph]\\n\\n### {AWAY} {score} @ {HOME} {score}\\n\\n[paragraph 1 — game story]\\n\\n[paragraph 2 — analytics]\\n\\n[repeat for each game]\\n\\n### Momentum Watch\\n\\n[paragraph]\\n\\n### Looking Ahead\\n\\n[paragraph]"
}`;
}

// ── 9. Balanced-brace JSON extractor ────────────────────────────────────────
function extractJson(raw) {
  // Strip markdown code fences
  let s = raw.trim()
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();

  const start = s.indexOf('{');
  if (start === -1) return s;
  s = s.slice(start);

  // Walk character by character, tracking depth and string state
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  return end !== -1 ? s.slice(0, end + 1) : s;
}

// ── 10. Repair literal newlines inside JSON strings ─────────────────────────
function repairJsonStrings(json) {
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

// ── 11. Call Gemini ──────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[gemini] Calling ${modelName} attempt ${attempt + 1}...`);
        const result = await model.generateContent(prompt);
        const text = result.response.text()?.trim();
        console.log(`[gemini] ${modelName} succeeded, response length: ${text?.length ?? 0}`);
        return text ?? null;
      } catch (err) {
        const status = err?.status;
        const isTransient = status === 503 || status === 429 || status === 500;
        if (isTransient && attempt < 2) {
          const delayMs = 2000 * Math.pow(2, attempt);
          console.warn(`[gemini] ${status} on ${modelName} attempt ${attempt + 1}, retrying in ${delayMs}ms`);
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        if (modelName === 'gemini-2.5-flash') {
          console.warn(`[gemini] ${modelName} failed (status=${status ?? err?.message}), falling back to gemini-2.0-flash`);
          break;
        }
        console.error('[gemini] All models failed:', err?.message ?? err);
        return null;
      }
    }
  }
  return null;
}

// ── 12. Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n=== Generating recap for ${TARGET_DATE} ===\n`);

  // Fetch data
  const raw = await fetchRecapData(TARGET_DATE);
  if (!raw) {
    console.error('No game data found for', TARGET_DATE);
    process.exit(1);
  }

  // Build AI input (mirror route.ts)
  const dateLabel = new Date(TARGET_DATE + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const games = raw.games.map(g => {
    const pred = raw.predMap.get(g.id);
    let predictedCorrectly = null;
    if (pred) {
      const homeWon = (g.home_score ?? 0) > (g.away_score ?? 0);
      const predHomeWin = (pred.home_win_probability ?? 0.5) >= 0.5;
      const outcome = pred.prediction_outcomes?.[0];
      predictedCorrectly = outcome?.correct_winner != null
        ? outcome.correct_winner === true
        : predHomeWin === homeWon;
    }
    return {
      awayTeam: g.away_team?.abbrev ?? '?',
      homeTeam: g.home_team?.abbrev ?? '?',
      awayScore: g.away_score ?? 0,
      homeScore: g.home_score ?? 0,
      predictedCorrectly,
      homeWinProbability: pred?.home_win_probability ?? null,
      seriesContext: raw.seriesMap?.get(g.id) ?? null,
    };
  });

  const topPerformers = raw.topPerformers.map(p => ({
    name:         `${p.players.first_name} ${p.players.last_name}`,
    team:         p.teams?.abbrev ?? '?',
    position:     p.players.position_code,
    goals:        p.goals ?? 0,
    assists:      p.assists ?? 0,
    plusMinus:    p.plus_minus ?? 0,
    toiMin:       (p.toi_seconds ?? 0) / 60,
    momentumPpm:  p.snapshot?.momentum_ppm ?? null,
    seasonPpm:    p.snapshot?.season_ppm ?? null,
    momentumRank: p.snapshot?.momentum_rank ?? null,
  }));

  const shutouts = raw.shutouts.map(s => ({
    name:  `${s.players?.first_name} ${s.players?.last_name}`,
    team:  s.teams?.abbrev ?? '?',
    saves: (s.saves ?? 0) - (s.goals_against ?? 0),
  }));

  // Soft signals / news context
  const signals = await fetchRecentSoftSignals(48, 10).catch(() => []);
  const newsContext = signals.length
    ? signals.map(s => `- ${s.title}${s.content ? ': ' + s.content.slice(0, 120) : ''} (${s.source})`).join('\n')
    : null;

  console.log(`\n[input] Games: ${games.length}, Performers: ${topPerformers.length}, Shutouts: ${shutouts.length}`);
  console.log('[input] Games summary:');
  for (const g of games) {
    console.log(`  ${g.awayTeam} ${g.awayScore} @ ${g.homeTeam} ${g.homeScore}${g.seriesContext ? ' — ' + g.seriesContext : ''}`);
  }
  console.log('[input] Top performers:');
  for (const p of topPerformers) {
    console.log(`  ${p.name} (${p.team}): ${p.goals}G ${p.assists}A`);
  }
  if (shutouts.length) {
    console.log('[input] Shutouts:');
    for (const s of shutouts) console.log(`  ${s.name} (${s.team}): ${s.saves} saves`);
  }
  if (newsContext) console.log('[input] News context loaded:', signals.length, 'items');

  // Build prompt
  const prompt = buildPrompt({ date: TARGET_DATE, dateLabel, games, topPerformers, shutouts, newsContext });
  console.log(`\n[prompt] Length: ${prompt.length} chars`);

  // Call Gemini
  const raw_response = await callGemini(prompt);
  if (!raw_response) {
    console.error('Gemini returned null — aborting');
    process.exit(1);
  }

  // Extract and parse JSON
  let parsed;
  try {
    const extracted = extractJson(raw_response);
    const repaired  = repairJsonStrings(extracted);
    parsed = JSON.parse(repaired);
    if (!parsed.title || !parsed.content) throw new Error('Missing title or content in parsed response');
  } catch (err) {
    console.error('[parse] JSON parse failed:', err.message);
    console.error('[parse] Raw response (first 500 chars):', raw_response.slice(0, 500));
    // Fallback: use raw as content
    const lines = raw_response.trim().split('\n');
    parsed = {
      title: lines[0]?.replace(/^#+\s*/, '').slice(0, 100) ?? `NHL Recap — ${dateLabel}`,
      summary: lines[1]?.slice(0, 160) ?? '',
      content: raw_response.trim(),
      featured_game: null,
    };
    console.warn('[parse] Using fallback: treating raw response as content');
  }

  console.log(`\n[result] Title: "${parsed.title}"`);
  console.log(`[result] Summary: "${parsed.summary}"`);
  console.log(`[result] Featured game: "${parsed.featured_game ?? 'none'}"`);
  console.log(`[result] Content length: ${parsed.content?.length ?? 0} chars`);

  // Upsert to Supabase
  const { error: upsertErr } = await supabase
    .from('daily_recaps')
    .upsert({
      date: TARGET_DATE,
      title:         parsed.title,
      summary:       parsed.summary,
      content:       parsed.content,
      games_count:   games.length,
      generated_at:  new Date().toISOString(),
    }, { onConflict: 'date' });

  if (upsertErr) {
    console.error('[supabase] Upsert failed:', upsertErr);
    process.exit(1);
  }

  console.log(`\n[supabase] Recap upserted for ${TARGET_DATE}`);
  console.log('\n=== Done ===');
  console.log(`Title: ${parsed.title}`);
  console.log(`Content length: ${parsed.content.length} characters`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
