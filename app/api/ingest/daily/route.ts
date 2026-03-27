import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGamesByDate } from '@/lib/nhl-api';
import { energyMultiplier, goalieEnergyPenalty, calculatePlayerEnergy, GOALIE_DRAIN_PER_MIN, type GameRecord } from '@/lib/energy';
import type { NHLScheduledGame } from '@/types';

// ─── Daily Pipeline ────────────────────────────────────────────────────────────
// Run this every day via cron (or manually) to:
//
//   Phase 1 — Record outcomes for yesterday's games
//   Phase 2 — Fetch today's scheduled games, build team snapshots + predictions
//
// This is the core data collection loop that enables retrospective model
// comparison. Every day's raw team state is permanently stored in
// game_team_snapshots so any future model version can be backtested against it.
//
// GET /api/ingest/daily?date=YYYY-MM-DD&phase=outcomes|snapshots|energy
//   phase=outcomes   → Phase 1 only (record yesterday's results) — fast, ~2s
//   phase=snapshots  → Phase 2 only (build today's snapshots + predictions) — slower
//   phase=energy     → Phase 3 only (recalculate energy bars for active players)
//                      Supports &offset=N&limit=N (default 0/150) for pagination
//   (no phase param) → both phases (may timeout on large game slates)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get('date');
  // phase=outcomes  → only Phase 1 (record yesterday's results)
  // phase=snapshots → only Phase 2 (build today's snapshots + predictions)
  // (default)       → both phases (may timeout on large game slates)
  const phase = req.nextUrl.searchParams.get('phase') ?? 'all';

  const today = dateParam ?? new Date().toISOString().slice(0, 10);
  const yesterday = new Date(new Date(today + 'T12:00:00Z').getTime() - 86400000)
    .toISOString().slice(0, 10);

  const log: string[] = [];
  let outcomesRecorded = 0;
  let snapshotsSaved = 0;
  let predictionsStored = 0;
  let energyUpdated = 0;

  try {
    // ── Phase 1: Record outcomes for yesterday's completed games ───────────────
    if (phase === 'snapshots') {
      log.push('Phase 1: skipped (phase=snapshots)');
    } else {
    log.push(`Phase 1: recording outcomes for ${yesterday}`);

    const yesterdayGames = (await getGamesByDate(yesterday)) as NHLScheduledGame[];
    const completedGames = yesterdayGames.filter(
      g => g.gameState === 'FINAL' || g.gameState === 'OFF'
    );

    // Upsert game results into games table
    for (const g of completedGames) {
      await supabaseAdmin
        .from('games')
        .upsert({
          id: g.id,
          game_date: g.gameDate ?? yesterday,
          start_time_utc: g.startTimeUTC,
          home_team_id: g.homeTeam.id,
          away_team_id: g.awayTeam.id,
          home_score: g.homeTeam.score ?? null,
          away_score: g.awayTeam.score ?? null,
          game_state: g.gameState,
          venue: g.venue?.default ?? null,
          season: '20252026',
        }, { onConflict: 'id' });
    }

    // Score any existing predictions against actual outcomes
    for (const g of completedGames) {
      if (g.homeTeam.score === undefined || g.awayTeam.score === undefined) continue;

      const { data: preds } = await supabaseAdmin
        .from('predictions')
        .select('id, predicted_home_score, predicted_away_score, home_win_probability, away_win_probability')
        .eq('game_id', g.id);

      for (const pred of preds ?? []) {
        const correctWinner =
          (pred.home_win_probability > pred.away_win_probability) ===
          (g.homeTeam.score > g.awayTeam.score);

        const { error } = await supabaseAdmin
          .from('prediction_outcomes')
          .upsert({
            prediction_id: pred.id,
            game_id: g.id,
            actual_home_score: g.homeTeam.score,
            actual_away_score: g.awayTeam.score,
            home_score_error: Math.abs(g.homeTeam.score - Number(pred.predicted_home_score)),
            away_score_error: Math.abs(g.awayTeam.score - Number(pred.predicted_away_score)),
            correct_winner: correctWinner,
          }, { onConflict: 'game_id,prediction_id' });

        if (!error) outcomesRecorded++;
      }
    }

    log.push(`Outcomes recorded: ${outcomesRecorded} from ${completedGames.length} completed games`);
    } // end phase 1

    // ── Phase 2: Capture team snapshots + predictions for today's games ────────
    if (phase === 'outcomes') {
      log.push('Phase 2: skipped (phase=outcomes)');
    } else {
    log.push(`Phase 2: capturing snapshots + predictions for ${today}`);

    // Auto-run energy for players who played yesterday before building snapshots.
    // gamelogs + metrics ingest must have already run so game_player_stats is populated.
    {
      const GAME_DURATION_MS = 2.5 * 3_600_000;
      const now = new Date();
      const since = new Date(now.getTime() - 72 * 3_600_000);
      const sinceDate = since.toISOString().slice(0, 10);

      const { data: recentGames } = await supabaseAdmin
        .from('games')
        .select('id, game_date, start_time_utc')
        .gte('game_date', sinceDate)
        .in('game_state', ['FINAL', 'OFF']);

      const eGameMap = new Map((recentGames ?? []).map(g => [g.id, g]));
      const recentGameIds = Array.from(eGameMap.keys());

      if (recentGameIds.length > 0) {
        const [{ data: eSkaterStats }, { data: eGoalieStats }] = await Promise.all([
          supabaseAdmin.from('game_player_stats').select('player_id, game_id, toi_seconds').in('game_id', recentGameIds),
          supabaseAdmin.from('game_goalie_stats').select('player_id, game_id, toi_seconds').in('game_id', recentGameIds),
        ]);

        const playedPlayerIds = [...new Set([
          ...(eSkaterStats ?? []).map(r => r.player_id),
          ...(eGoalieStats ?? []).map(r => r.player_id),
        ])];

        if (playedPlayerIds.length > 0) {
          const recordsByPlayer = new Map<number, GameRecord[]>();
          for (const row of [...(eSkaterStats ?? []), ...(eGoalieStats ?? [])]) {
            const game = eGameMap.get(row.game_id);
            if (!game) continue;
            const startUtc = game.start_time_utc
              ? new Date(game.start_time_utc)
              : new Date(`${game.game_date}T20:00:00Z`);
            const gameEnd = new Date(startUtc.getTime() + GAME_DURATION_MS);
            if (!recordsByPlayer.has(row.player_id)) recordsByPlayer.set(row.player_id, []);
            recordsByPlayer.get(row.player_id)!.push({ game_end_utc: gameEnd, toi_seconds: row.toi_seconds ?? 0 });
          }

          const [{ data: playedPlayers }, { data: latestSnaps }] = await Promise.all([
            supabaseAdmin.from('players').select('id, position_code').in('id', playedPlayerIds),
            supabaseAdmin.from('player_metric_snapshots').select('id, player_id').in('player_id', playedPlayerIds).order('calculated_at', { ascending: false }),
          ]);

          const latestIdByPlayer = new Map<number, string>();
          for (const snap of latestSnaps ?? []) {
            if (!latestIdByPlayer.has(snap.player_id)) latestIdByPlayer.set(snap.player_id, snap.id);
          }

          const eUpdates: { id: string; energy_bar: number }[] = [];
          for (const player of playedPlayers ?? []) {
            const snapId = latestIdByPlayer.get(player.id);
            if (!snapId) continue;
            const drainRate = player.position_code === 'G' ? GOALIE_DRAIN_PER_MIN : undefined;
            const energy = calculatePlayerEnergy(recordsByPlayer.get(player.id) ?? [], now, drainRate);
            eUpdates.push({ id: snapId, energy_bar: energy });
          }

          const CONCURRENT = 10;
          for (let i = 0; i < eUpdates.length; i += CONCURRENT) {
            const results = await Promise.all(
              eUpdates.slice(i, i + CONCURRENT).map(({ id, energy_bar }) =>
                supabaseAdmin.from('player_metric_snapshots').update({ energy_bar }).eq('id', id)
              )
            );
            energyUpdated += results.filter(r => !r.error).length;
          }

          log.push(`Energy auto-updated: ${energyUpdated} players from last 72h games`);
        }
      }
    }

    const todayGames = (await getGamesByDate(today)) as NHLScheduledGame[];
    const upcomingGames = todayGames.filter(
      g => g.gameState === 'FUT' || g.gameState === 'PRE'
    );

    // Upsert today's games into games table
    for (const g of upcomingGames) {
      await supabaseAdmin
        .from('games')
        .upsert({
          id: g.id,
          game_date: g.gameDate ?? today,
          start_time_utc: g.startTimeUTC,
          home_team_id: g.homeTeam.id,
          away_team_id: g.awayTeam.id,
          home_score: null,
          away_score: null,
          game_state: g.gameState,
          venue: g.venue?.default ?? null,
          season: '20252026',
        }, { onConflict: 'id' });
    }

    for (const game of upcomingGames) {
      // Build home + away snapshots in parallel — they're fully independent
      await Promise.all([
        { teamId: game.homeTeam.id, isHome: true },
        { teamId: game.awayTeam.id, isHome: false },
      ].map(async ({ teamId, isHome }) => {
        // Get latest snapshot for each active player on this team
        const { data: players } = await supabaseAdmin
          .from('players')
          .select('id, position_code')
          .eq('team_id', teamId)
          .eq('is_active', true);

        if (!players?.length) return;

        const skaterIds = players.filter(p => p.position_code !== 'G').map(p => p.id).slice(0, 20);
        const goalieIds = players.filter(p => p.position_code === 'G').map(p => p.id).slice(0, 3);

        // Batch fetch all skater snapshots in one query, then deduplicate to latest per player
        const { data: allSkaterSnaps } = await supabaseAdmin
          .from('player_metric_snapshots')
          .select(`
            player_id, momentum_ppm, season_ppm, career_ppm, composite_ppm,
            energy_bar, sos_coefficient,
            players!inner(first_name, last_name, position_code, injury_status)
          `)
          .in('player_id', skaterIds)
          .order('calculated_at', { ascending: false });

        const seenSkaters = new Set<number>();
        const skaterSnaps = [];
        for (const data of allSkaterSnaps ?? []) {
          if (seenSkaters.has(data.player_id)) continue;
          seenSkaters.add(data.player_id);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = data.players as any;
          skaterSnaps.push({
            playerId: data.player_id,
            playerName: `${p.first_name} ${p.last_name}`,
            position: p.position_code,
            compositePpm: Number(data.composite_ppm ?? 0),
            momentumPpm: Number(data.momentum_ppm ?? 0),
            seasonPpm: Number(data.season_ppm ?? 0),
            careerPpm: Number(data.career_ppm ?? 0),
            energyBar: data.energy_bar ?? 100,
            injuryStatus: p.injury_status ?? null,
          });
        }

        // Fetch last 5 games (momentum) and full season for goalies in parallel
        const [{ data: allGoalieStats }, { data: seasonGoalieStats }, { data: goalieNames }] = await Promise.all([
          supabaseAdmin
            .from('game_goalie_stats')
            .select('player_id, shots_against, goals_against, save_pct, toi_seconds')
            .in('player_id', goalieIds)
            .order('recorded_at', { ascending: false })
            .limit(goalieIds.length * 5),
          supabaseAdmin
            .from('game_goalie_stats')
            .select('player_id, shots_against, goals_against, save_pct')
            .in('player_id', goalieIds),
          supabaseAdmin
            .from('players')
            .select('id, first_name, last_name')
            .in('id', goalieIds),
        ]);

        const goalieNameMap = new Map((goalieNames ?? []).map(g => [g.id, g]));
        const goalieStatsMap = new Map<number, typeof allGoalieStats>();
        for (const row of allGoalieStats ?? []) {
          if (!goalieStatsMap.has(row.player_id)) goalieStatsMap.set(row.player_id, []);
          goalieStatsMap.get(row.player_id)!.push(row);
        }
        const goalieSeasonMap = new Map<number, typeof seasonGoalieStats>();
        for (const row of seasonGoalieStats ?? []) {
          if (!goalieSeasonMap.has(row.player_id)) goalieSeasonMap.set(row.player_id, []);
          goalieSeasonMap.get(row.player_id)!.push(row);
        }

        // Fetch goalie energy from their latest snapshot
        const { data: goalieEnergySnaps } = await supabaseAdmin
          .from('player_metric_snapshots')
          .select('player_id, energy_bar')
          .in('player_id', goalieIds)
          .order('calculated_at', { ascending: false });
        const goalieEnergyMap = new Map<number, number>();
        for (const snap of goalieEnergySnaps ?? []) {
          if (!goalieEnergyMap.has(snap.player_id)) goalieEnergyMap.set(snap.player_id, snap.energy_bar ?? 100);
        }

        // Build goalie snapshot from first goalie with sufficient data
        let goalieSnap: { playerId: number; playerName: string; momentumShotsPerGoal: number; seasonShotsPerGoal: number; momentumSavePct: number; seasonSavePct: number; energyBar: number; teamRecentForm?: number; isBackToBack?: boolean } = { playerId: 0, playerName: 'Unknown', momentumShotsPerGoal: 22, seasonShotsPerGoal: 22, momentumSavePct: 0.905, seasonSavePct: 0.905, energyBar: 100 };
        for (const gid of goalieIds) {
          const momentum = goalieStatsMap.get(gid);
          if (momentum?.length) {
            // Momentum: last 5 games
            const mShots = momentum.reduce((s, r) => s + r.shots_against, 0);
            const mGoals = momentum.reduce((s, r) => s + r.goals_against, 0);
            const momentumSpg = mGoals > 0 ? Math.min(40, mShots / mGoals) : 22;
            const momentumSavePct = momentum.reduce((s, r) => s + (r.save_pct ?? 0), 0) / momentum.length;

            // Season: all available game_goalie_stats for this goalie
            const season = goalieSeasonMap.get(gid) ?? momentum;
            const sShots = season.reduce((s, r) => s + r.shots_against, 0);
            const sGoals = season.reduce((s, r) => s + r.goals_against, 0);
            const seasonSpg = sGoals > 0 ? Math.min(40, sShots / sGoals) : 22;
            const seasonSavePct = season.reduce((s, r) => s + (r.save_pct ?? 0), 0) / season.length;

            const gp = goalieNameMap.get(gid);
            goalieSnap = {
              playerId: gid,
              playerName: gp ? `${gp.first_name} ${gp.last_name}` : 'Unknown',
              momentumShotsPerGoal: Math.round(momentumSpg * 10) / 10,
              seasonShotsPerGoal: Math.round(seasonSpg * 10) / 10,
              momentumSavePct,
              seasonSavePct,
              energyBar: goalieEnergyMap.get(gid) ?? 100,
            };
            break;
          }
        }

        // Team energy bar = average of active skaters
        const teamEnergy = skaterSnaps.length
          ? Math.round(skaterSnaps.reduce((s, sk) => s + sk.energyBar, 0) / skaterSnaps.length)
          : 100;

        // Compute SOS and back-to-back from completed games up to today
        const { data: teamGames } = await supabaseAdmin
          .from('games')
          .select('game_date, home_team_id, away_team_id, home_score, away_score')
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .eq('season', '20252026')
          .not('home_score', 'is', null)
          .lt('game_date', today)
          .order('game_date', { ascending: true });

        const completedGamesForTeam = (teamGames ?? []).filter(
          g => g.home_score !== null && g.away_score !== null
        );

        // SOS — GF/GA ratio (v1.7+). More granular than binary win%.
        // Formula: 1.0 + (gfPerGame/gaPerGame - 1.0) × 0.3
        let goalsFor = 0, goalsAgainst = 0;
        for (const g of completedGamesForTeam) {
          const isHomeTeam = g.home_team_id === teamId;
          goalsFor += (isHomeTeam ? g.home_score! : g.away_score!);
          goalsAgainst += (isHomeTeam ? g.away_score! : g.home_score!);
        }
        const gfPerGame = completedGamesForTeam.length >= 5 ? goalsFor / completedGamesForTeam.length : 3.0;
        const gaPerGame = completedGamesForTeam.length >= 5 && goalsAgainst > 0 ? goalsAgainst / completedGamesForTeam.length : 3.0;
        const sosMultiplier = Math.round((1.0 + (gfPerGame / gaPerGame - 1.0) * 0.3) * 1000) / 1000;

        // Back-to-back detection
        const yesterday = new Date(today + 'T12:00:00Z');
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        const isBackToBack = completedGamesForTeam.some(g => g.game_date === yesterdayStr);

        // Recent form — last 5 games win%
        const last5 = completedGamesForTeam.slice(-5);
        let recentWins = 0;
        for (const g of last5) {
          const isHomeTeam = g.home_team_id === teamId;
          if ((isHomeTeam ? g.home_score! : g.away_score!) > (isHomeTeam ? g.away_score! : g.home_score!)) recentWins++;
        }
        const recentWinPct = last5.length >= 3 ? recentWins / last5.length : 0.5;
        const recentFormMultiplier = Math.round((1.0 + (recentWinPct - 0.5) * 0.3) * 1000) / 1000;

        // teamRecentForm, isBackToBack stored inside goalie_snapshot JSON
        goalieSnap = { ...goalieSnap, teamRecentForm: recentFormMultiplier, isBackToBack };

        // Save the model-agnostic team snapshot
        const { error: snapErr } = await supabaseAdmin
          .from('game_team_snapshots')
          .upsert({
            game_id: game.id,
            team_id: teamId,
            is_home: isHome,
            team_energy_bar: teamEnergy,
            sos_multiplier: sosMultiplier,
            sh_toi_percentile: 0.5,
            skater_snapshots: skaterSnaps,
            goalie_snapshot: goalieSnap,
          }, { onConflict: 'game_id,team_id' });

        if (!snapErr) snapshotsSaved++;
      })); // end Promise.all home+away

      // Build and store prediction using v1.7 formula on the new snapshots
      const { data: homeSnap } = await supabaseAdmin
        .from('game_team_snapshots')
        .select('*')
        .eq('game_id', game.id)
        .eq('is_home', true)
        .single();

      const { data: awaySnap } = await supabaseAdmin
        .from('game_team_snapshots')
        .select('*')
        .eq('game_id', game.id)
        .eq('is_home', false)
        .single();

      if (!homeSnap || !awaySnap) continue;

      // Run v1.7 formula — GF/GA SOS, B2B fatigue, season goalie stats,
      // HOME_EDGE=1.0 (neutral), season-weighted PPM 0.2/0.8, REGRESSION=0.6.
      // See backtest/route.ts for full change notes.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hSkaters = (homeSnap.skater_snapshots as any[]) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aSkaters = (awaySnap.skater_snapshots as any[]) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hGoalie = (homeSnap.goalie_snapshot as any) ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aGoalie = (awaySnap.goalie_snapshot as any) ?? {};

      const GOAL_SCALE = 70;
      const MIN_SPG = 12;
      const MAX_SPG = 40;
      // Neutral — let PPM/SOS signal carry directionality without home bias overlay
      const HOME_EDGE = 1.0;
      const AWAY_EDGE = 1.0;
      const REGRESSION = 0.6;
      // Weight-search result: season PPM is a stronger predictor than 5-game momentum
      const MOMENTUM_W = 0.2;
      const SEASON_W = 0.8;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function effectivePPM(s: any): number {
        if (s.momentumPpm !== undefined && s.seasonPpm !== undefined) {
          return MOMENTUM_W * s.momentumPpm + SEASON_W * s.seasonPpm;
        }
        return s.compositePpm ?? 0;
      }

      // Back-to-back fatigue: ~8% offensive output penalty (research-backed)
      const B2B_PENALTY = 0.92;
      const homeB2bMult = hGoalie.isBackToBack ? B2B_PENALTY : 1.0;
      const awayB2bMult = aGoalie.isBackToBack ? B2B_PENALTY : 1.0;

      const homeOff = hSkaters
        .filter((s: { injuryStatus: string | null }) => !s.injuryStatus)
        .reduce((sum: number, s: { compositePpm: number; momentumPpm?: number; seasonPpm?: number }) => sum + Math.max(0, effectivePPM(s)), 0)
        * Number(homeSnap.sos_multiplier)
        * (hGoalie.teamRecentForm ?? 1.0)
        * energyMultiplier(homeSnap.team_energy_bar ?? 100)
        * homeB2bMult;

      const awayOff = aSkaters
        .filter((s: { injuryStatus: string | null }) => !s.injuryStatus)
        .reduce((sum: number, s: { compositePpm: number; momentumPpm?: number; seasonPpm?: number }) => sum + Math.max(0, effectivePPM(s)), 0)
        * Number(awaySnap.sos_multiplier)
        * (aGoalie.teamRecentForm ?? 1.0)
        * energyMultiplier(awaySnap.team_energy_bar ?? 100)
        * awayB2bMult;

      // Defense: use season SPG (more stable than last-5 momentum SPG)
      const homeDef = Math.min(MAX_SPG, Math.max(MIN_SPG, hGoalie.seasonShotsPerGoal || hGoalie.momentumShotsPerGoal || 22))
        * goalieEnergyPenalty(hGoalie.energyBar ?? 100);
      const awayDef = Math.min(MAX_SPG, Math.max(MIN_SPG, aGoalie.seasonShotsPerGoal || aGoalie.momentumShotsPerGoal || 22))
        * goalieEnergyPenalty(aGoalie.energyBar ?? 100);

      const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
      const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
      const total = homeXG + awayXG;
      const homeBase = total > 0 ? homeXG / total : 0.5;
      const awayBase = total > 0 ? awayXG / total : 0.5;
      const homeAdj = Math.min(0.90, homeBase * HOME_EDGE);
      const awayAdj = Math.min(0.90, awayBase * AWAY_EDGE);
      const rawHomeWin = homeAdj / (homeAdj + awayAdj);
      const homeWin = 0.5 + (rawHomeWin - 0.5) * REGRESSION;
      const awayWin = 1 - homeWin;

      const { error: predErr } = await supabaseAdmin
        .from('predictions')
        .upsert({
          game_id: game.id,
          model_version: 'v1.7',
          predicted_home_score: Math.round(homeXG * 10) / 10,
          predicted_away_score: Math.round(awayXG * 10) / 10,
          home_win_probability: Math.round(homeWin * 1000) / 1000,
          away_win_probability: Math.round(awayWin * 1000) / 1000,
          ot_probability: 0,
          home_energy_bar: homeSnap.team_energy_bar,
          away_energy_bar: awaySnap.team_energy_bar,
          home_sos_multiplier: homeSnap.sos_multiplier,
          away_sos_multiplier: awaySnap.sos_multiplier,
          home_offensive_potential: Math.round(homeOff * GOAL_SCALE * 10) / 10,
          away_offensive_potential: Math.round(awayOff * GOAL_SCALE * 10) / 10,
          home_defensive_filter: homeDef,
          away_defensive_filter: awayDef,
          input_snapshot: {
            captured_at: new Date().toISOString(),
            home: { energyBar: homeSnap.team_energy_bar, skaterCount: hSkaters.length, goalie: hGoalie.playerName },
            away: { energyBar: awaySnap.team_energy_bar, skaterCount: aSkaters.length, goalie: aGoalie.playerName },
          },
        }, { onConflict: 'game_id,model_version' });

      if (!predErr) predictionsStored++;
    }

    log.push(`Team snapshots saved: ${snapshotsSaved}`);
    log.push(`Predictions stored: ${predictionsStored} for ${upcomingGames.length} upcoming games`);
    } // end phase 2

    // ── Phase 3: Recalculate energy bars for active players ────────────────────
    let energyInserted = 0;
    if (phase === 'energy') {
      const energyOffset = Number(req.nextUrl.searchParams.get('offset') ?? '0');
      const energyLimit  = Number(req.nextUrl.searchParams.get('limit')  ?? '150');
      const GAME_DURATION_MS = 2.5 * 3_600_000;
      const now   = new Date();
      const since = new Date(now.getTime() - 72 * 3_600_000);
      const sinceDate = since.toISOString().slice(0, 10);

      log.push(`Phase 3: recalculating energy (offset=${energyOffset}, limit=${energyLimit})`);

      const { data: ePlayers, error: epErr } = await supabaseAdmin
        .from('players')
        .select('id, position_code')
        .eq('is_active', true)
        .order('id')
        .range(energyOffset, energyOffset + energyLimit - 1);

      if (epErr) throw epErr;

      if (ePlayers?.length) {
        const ePlayerIds  = ePlayers.map(p => p.id);
        const eSkaterIds  = ePlayers.filter(p => p.position_code !== 'G').map(p => p.id);
        const eGoalieIds  = ePlayers.filter(p => p.position_code === 'G').map(p => p.id);

        const { data: recentGames } = await supabaseAdmin
          .from('games')
          .select('id, game_date, start_time_utc')
          .gte('game_date', sinceDate)
          .in('game_state', ['FINAL', 'OFF']);

        const eGameMap    = new Map((recentGames ?? []).map(g => [g.id, g]));
        const recentGIds  = Array.from(eGameMap.keys());

        const [{ data: eSkaterStats }, { data: eGoalieStats }] = await Promise.all([
          eSkaterIds.length && recentGIds.length
            ? supabaseAdmin.from('game_player_stats').select('player_id, game_id, toi_seconds').in('player_id', eSkaterIds).in('game_id', recentGIds)
            : Promise.resolve({ data: [] as { player_id: number; game_id: number; toi_seconds: number | null }[] }),
          eGoalieIds.length && recentGIds.length
            ? supabaseAdmin.from('game_goalie_stats').select('player_id, game_id, toi_seconds').in('player_id', eGoalieIds).in('game_id', recentGIds)
            : Promise.resolve({ data: [] as { player_id: number; game_id: number; toi_seconds: number | null }[] }),
        ]);

        const recordsByPlayer = new Map<number, GameRecord[]>();
        for (const row of [...(eSkaterStats ?? []), ...(eGoalieStats ?? [])]) {
          const game = eGameMap.get(row.game_id);
          if (!game) continue;
          const startUtc = game.start_time_utc
            ? new Date(game.start_time_utc)
            : new Date(`${game.game_date}T20:00:00Z`);
          const gameEnd = new Date(startUtc.getTime() + GAME_DURATION_MS);
          if (!recordsByPlayer.has(row.player_id)) recordsByPlayer.set(row.player_id, []);
          recordsByPlayer.get(row.player_id)!.push({ game_end_utc: gameEnd, toi_seconds: row.toi_seconds ?? 0 });
        }

        const { data: latestSnaps } = await supabaseAdmin
          .from('player_metric_snapshots')
          .select('id, player_id')
          .in('player_id', ePlayerIds)
          .order('calculated_at', { ascending: false });

        const latestIdByPlayer = new Map<number, string>();
        for (const snap of latestSnaps ?? []) {
          if (!latestIdByPlayer.has(snap.player_id)) latestIdByPlayer.set(snap.player_id, snap.id);
        }

        const eUpdates: { id: string; energy_bar: number }[] = [];
        const eInserts: { player_id: number; energy_bar: number; momentum_rank: number }[] = [];
        for (const player of ePlayers) {
          const drainRate = player.position_code === 'G' ? GOALIE_DRAIN_PER_MIN : undefined;
          const records   = recordsByPlayer.get(player.id) ?? [];
          const energy    = calculatePlayerEnergy(records, now, drainRate);
          const snapId    = latestIdByPlayer.get(player.id);
          if (snapId) eUpdates.push({ id: snapId, energy_bar: energy });
          else eInserts.push({ player_id: player.id, energy_bar: energy, momentum_rank: 0 });
        }

        const CONCURRENT = 10;
        for (let i = 0; i < eUpdates.length; i += CONCURRENT) {
          const results = await Promise.all(
            eUpdates.slice(i, i + CONCURRENT).map(({ id, energy_bar }) =>
              supabaseAdmin.from('player_metric_snapshots').update({ energy_bar }).eq('id', id)
            )
          );
          energyUpdated += results.filter(r => !r.error).length;
        }

        if (eInserts.length) {
          const { error: insErr } = await supabaseAdmin.from('player_metric_snapshots').insert(eInserts);
          if (!insErr) energyInserted += eInserts.length;
        }

        log.push(`Energy updated: ${energyUpdated}, inserted: ${energyInserted} of ${ePlayers.length} players`);
      }
    } // end phase 3

    return NextResponse.json({
      data: {
        date: today,
        outcomes_recorded: outcomesRecorded,
        snapshots_saved: snapshotsSaved,
        predictions_stored: predictionsStored,
        energy_updated: energyUpdated,
        energy_inserted: energyInserted,
        log,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message, log },
      { status: 500 }
    );
  }
}
