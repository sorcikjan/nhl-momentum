-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 012: in_minors flag on players
-- Tracks players who have been assigned to AHL/minor league affiliates.
-- Detected daily by /api/ingest/player-assignments via NHL API seasonTotals.
-- ─────────────────────────────────────────────────────────────────────────────

alter table players
  add column if not exists in_minors boolean not null default false;
