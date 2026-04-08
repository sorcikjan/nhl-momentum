-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security Policies
--
-- The service role key (supabaseAdmin) bypasses RLS automatically — all
-- server-side writes continue to work unchanged.
--
-- The anon key (public browser client) gets these policies applied:
--   SELECT allowed on all tables (public read-only analytics site)
--   INSERT/UPDATE/DELETE blocked (no anon write policies defined)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE teams                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE players                ENABLE ROW LEVEL SECURITY;
ALTER TABLE games                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_player_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_goalie_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_outcomes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_team_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_odds          ENABLE ROW LEVEL SECURITY;

-- Public read-only policies
CREATE POLICY "public_read" ON teams                   FOR SELECT USING (true);
CREATE POLICY "public_read" ON players                 FOR SELECT USING (true);
CREATE POLICY "public_read" ON games                   FOR SELECT USING (true);
CREATE POLICY "public_read" ON game_player_stats       FOR SELECT USING (true);
CREATE POLICY "public_read" ON game_goalie_stats       FOR SELECT USING (true);
CREATE POLICY "public_read" ON player_metric_snapshots FOR SELECT USING (true);
CREATE POLICY "public_read" ON model_versions          FOR SELECT USING (true);
CREATE POLICY "public_read" ON predictions             FOR SELECT USING (true);
CREATE POLICY "public_read" ON prediction_outcomes     FOR SELECT USING (true);
CREATE POLICY "public_read" ON game_team_snapshots     FOR SELECT USING (true);
CREATE POLICY "public_read" ON external_odds           FOR SELECT USING (true);
