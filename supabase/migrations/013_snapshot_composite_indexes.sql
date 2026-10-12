-- player_metric_snapshots is insert-only (~750k rows by Oct 2026). Every reader
-- asks for "latest snapshot per player": .in('player_id', …).order('calculated_at desc').
-- With only single-column indexes the planner walks pms_calc_idx backwards across
-- the whole table, which hits the statement timeout and stalls the metrics phase.
create index if not exists pms_player_calc_idx
  on player_metric_snapshots (player_id, calculated_at desc);

-- Same "latest N games per player" pattern in metrics/energy/profile reads.
create index if not exists gps_player_game_idx
  on game_player_stats (player_id, game_id desc);
create index if not exists ggs_player_game_idx
  on game_goalie_stats (player_id, game_id desc);
