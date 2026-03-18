-- Drop foreign key constraints on game_id so stats can be inserted
-- independently of the games table being fully populated.
-- game_id is still stored for joining later once games are seeded.

alter table game_player_stats drop constraint if exists game_player_stats_game_id_fkey;
alter table game_goalie_stats  drop constraint if exists game_goalie_stats_game_id_fkey;
