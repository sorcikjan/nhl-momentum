import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGamesByDate } from '@/lib/nhl-api';
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
// GET /api/ingest/daily?date=YYYY-MM-DD  (defaults to today)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get('date');
  const today = dateParam ?? new Date().toISOString().slice(0, 10);
  const yesterday = new Date(new Date(today + 'T12:00:00Z').getTime() - 86400000)
    .toISOString().slice(0, 10);

  const log: string[] = [];
  let outcomesRecorded = 0;
  let snapshotsSaved = 0;
  let predictionsStored = 0;

  try {
    // ── Phase 1: Record outcomes for yesterday's completed games ───────────────
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

    // ── Phase 2: Capture team snapshots + predictions for today's games ────────
    log.push(`Phase 2: capturing snapshots + predictions for ${today}`);

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
      // Build team snapshots from latest player_metric_snapshots for each team
      for (const { teamId, isHome } of [
        { teamId: game.homeTeam.id, isHome: true },
        { teamId: game.awayTeam.id, isHome: false },
      ]) {
        // Get latest snapshot for each active player on this team
        const { data: players } = await supabaseAdmin
          .from('players')
          .select('id, position_code')
          .eq('team_id', teamId)
          .eq('is_active', true);

        if (!players?.length) continue;

        const skaterIds = players.filter(p => p.position_code !== 'G').map(p => p.id);
        const goalieIds = players.filter(p => p.position_code === 'G').map(p => p.id);

        // Get most recent metric snapshot per skater (subquery approach)
        const skaterSnaps = [];
        for (const pid of skaterIds.slice(0, 20)) {  // top 20 skaters max
          const { data } = await supabaseAdmin
            .from('player_metric_snapshots')
            .select(`
              player_id, momentum_ppm, season_ppm, career_ppm, composite_ppm,
              energy_bar, sos_coefficient,
              players!inner(first_name, last_name, position_code, injury_status)
            `)
            .eq('player_id', pid)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single();

          if (data) {
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
        }

        // Build goalie snapshot (pick first active goalie)
        let goalieSnap = { playerId: 0, playerName: 'Unknown', momentumShotsPerGoal: 20, seasonShotsPerGoal: 20, momentumSavePct: 0.9, seasonSavePct: 0.9 };
        for (const gid of goalieIds.slice(0, 2)) {
          const { data } = await supabaseAdmin
            .from('game_goalie_stats')
            .select('shots_against, goals_against, save_pct, toi_seconds')
            .eq('player_id', gid)
            .order('recorded_at', { ascending: false })
            .limit(5);

          if (data?.length) {
            const totalShots = data.reduce((s, r) => s + r.shots_against, 0);
            const totalGoals = data.reduce((s, r) => s + r.goals_against, 0);
            // Cap SPG at 40 to avoid extreme values when a goalie hasn't conceded recently
            const spg = totalGoals > 0 ? Math.min(40, totalShots / totalGoals) : 22;
            const { data: gp } = await supabaseAdmin
              .from('players')
              .select('first_name, last_name')
              .eq('id', gid)
              .single();
            goalieSnap = {
              playerId: gid,
              playerName: gp ? `${gp.first_name} ${gp.last_name}` : 'Unknown',
              momentumShotsPerGoal: Math.round(spg * 10) / 10,
              seasonShotsPerGoal: Math.round(spg * 10) / 10,
              momentumSavePct: data.reduce((s, r) => s + r.save_pct, 0) / data.length,
              seasonSavePct: data.reduce((s, r) => s + r.save_pct, 0) / data.length,
            };
            break;
          }
        }

        // Team energy bar = average of active skaters
        const teamEnergy = skaterSnaps.length
          ? Math.round(skaterSnaps.reduce((s, sk) => s + sk.energyBar, 0) / skaterSnaps.length)
          : 100;

        // Save the model-agnostic team snapshot
        const { error: snapErr } = await supabaseAdmin
          .from('game_team_snapshots')
          .upsert({
            game_id: game.id,
            team_id: teamId,
            is_home: isHome,
            team_energy_bar: teamEnergy,
            sos_multiplier: 1.0,   // TODO: compute from opponent strength
            sh_toi_percentile: 0.5,
            skater_snapshots: skaterSnaps,
            goalie_snapshot: goalieSnap,
          }, { onConflict: 'game_id,team_id' });

        if (!snapErr) snapshotsSaved++;
      }

      // Build and store prediction using v1.0 formula on the new snapshots
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

      // Run v1.1 formula — fixes the unit mismatch from v1.0 via GOAL_SCALE
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hSkaters = (homeSnap.skater_snapshots as any[]) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aSkaters = (awaySnap.skater_snapshots as any[]) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hGoalie = (homeSnap.goalie_snapshot as any) ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aGoalie = (awaySnap.goalie_snapshot as any) ?? {};

      const GOAL_SCALE = 90; // calibration: PPM sum × GOAL_SCALE / SPG ≈ goals per game
      const MIN_SPG = 12;    // floor: prevents extreme predictions from hot-streak goalies
      const MAX_SPG = 40;    // cap: prevents near-zero from terrible-streak goalies

      const homeOff = hSkaters
        .filter((s: { injuryStatus: string | null }) => !s.injuryStatus)
        .reduce((sum: number, s: { compositePpm: number }) => sum + Math.max(0, s.compositePpm), 0)
        * Number(homeSnap.sos_multiplier)
        * (homeSnap.team_energy_bar >= 70 ? 1.0 : 0.6 + (homeSnap.team_energy_bar / 70) * 0.4);

      const awayOff = aSkaters
        .filter((s: { injuryStatus: string | null }) => !s.injuryStatus)
        .reduce((sum: number, s: { compositePpm: number }) => sum + Math.max(0, s.compositePpm), 0)
        * Number(awaySnap.sos_multiplier)
        * (awaySnap.team_energy_bar >= 70 ? 1.0 : 0.6 + (awaySnap.team_energy_bar / 70) * 0.4);

      const homeDef = Math.min(MAX_SPG, Math.max(MIN_SPG, hGoalie.momentumShotsPerGoal || 22));
      const awayDef = Math.min(MAX_SPG, Math.max(MIN_SPG, aGoalie.momentumShotsPerGoal || 22));

      const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
      const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
      const total = homeXG + awayXG;
      const convergence = total > 0 ? 1 - Math.abs(homeXG - awayXG) / Math.max(homeXG, awayXG, 0.01) : 0;
      const ot = Math.min(0.25, convergence * 0.2);
      const remaining = 1 - ot;
      const homeBase = total > 0 ? homeXG / total : 0.5;
      const awayBase = total > 0 ? awayXG / total : 0.5;
      const homeAdj = Math.min(0.85, homeBase * 1.05);
      const awayAdj = Math.min(0.85, awayBase * 0.95);
      const homeWin = (homeAdj / (homeAdj + awayAdj)) * remaining;
      const awayWin = remaining - homeWin;

      const { error: predErr } = await supabaseAdmin
        .from('predictions')
        .upsert({
          game_id: game.id,
          model_version: 'v1.1',
          predicted_home_score: Math.round(homeXG * 10) / 10,
          predicted_away_score: Math.round(awayXG * 10) / 10,
          home_win_probability: Math.round(homeWin * 1000) / 1000,
          away_win_probability: Math.round(awayWin * 1000) / 1000,
          ot_probability: Math.round(ot * 1000) / 1000,
          home_energy_bar: homeSnap.team_energy_bar,
          away_energy_bar: awaySnap.team_energy_bar,
          home_sos_multiplier: homeSnap.sos_multiplier,
          away_sos_multiplier: awaySnap.sos_multiplier,
          home_offensive_potential: homeOff,
          away_offensive_potential: awayOff,
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

    return NextResponse.json({
      data: {
        date: today,
        outcomes_recorded: outcomesRecorded,
        snapshots_saved: snapshotsSaved,
        predictions_stored: predictionsStored,
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
