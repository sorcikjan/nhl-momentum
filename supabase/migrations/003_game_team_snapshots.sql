-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Game team snapshots for model-agnostic backtesting
-- ─────────────────────────────────────────────────────────────────────────────
-- This table captures the FULL metric state of each team at game time,
-- completely independent of any prediction model.
-- Any future model version can be re-applied to these snapshots to backtest.
-- ─────────────────────────────────────────────────────────────────────────────

create table game_team_snapshots (
  id                  uuid primary key default uuid_generate_v4(),
  game_id             integer not null,   -- no FK so we can store pre-game
  team_id             integer references teams(id),
  is_home             boolean not null,

  -- Team-level inputs (same values passed to buildPrediction)
  team_energy_bar     integer,            -- 0-100
  sos_multiplier      numeric(4,3),       -- 0.8-1.2
  sh_toi_percentile   numeric(4,3),       -- 0-1, league percentile for SH TOI

  -- Full skater metric vectors (array of objects, one per active skater)
  -- Each entry: { player_id, name, position, composite_ppm, momentum_ppm,
  --               season_ppm, career_ppm, energy_bar, injury_status }
  skater_snapshots    jsonb not null default '[]',

  -- Goalie metric vector
  -- { player_id, name, momentum_shots_per_goal, season_shots_per_goal,
  --   momentum_save_pct, season_save_pct, games_played }
  goalie_snapshot     jsonb not null default '{}',

  captured_at         timestamptz default now(),

  unique(game_id, team_id)
);

create index gts_game_idx on game_team_snapshots(game_id);
create index gts_team_idx on game_team_snapshots(team_id);
create index gts_captured_idx on game_team_snapshots(captured_at desc);

-- Also broaden prediction_outcomes unique constraint to allow multiple outcomes
-- per game (one per prediction, not one per game) so backtested predictions
-- can also be scored.
-- Drop existing unique(game_id) and replace with unique(game_id, prediction_id).
alter table prediction_outcomes drop constraint if exists prediction_outcomes_game_id_key;
alter table prediction_outcomes add constraint po_game_pred_unique unique(game_id, prediction_id);
