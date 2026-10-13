-- Retention for player_metric_snapshots (insert-only; metrics runs several times a
-- day, so it reached ~755k rows by Oct 2026 and its scans took the DB down).
--
-- Keeps every snapshot from the last `keep_days` days, and before that only the
-- latest snapshot per player per UTC day. Nothing reads intra-day history older
-- than a week: the profile timeline reads the last 300 snapshots per player, which
-- with daily granularity now covers ~300 days instead of a few weeks.
--
-- Deletes at most `max_rows` per call. The daily worker calls it via RPC ('prune'
-- phase) with a small batch; the existing backlog is cleared once by hand (bottom).
create or replace function prune_player_metric_snapshots(keep_days int default 7, max_rows int default 20000)
returns integer
language plpgsql
security definer
set search_path = public
set statement_timeout = '600s'
as $$
declare
  deleted integer;
begin
  with ranked as (
    select id,
           row_number() over (
             partition by player_id, (calculated_at at time zone 'UTC')::date
             order by calculated_at desc
           ) as rn
    from player_metric_snapshots
    where calculated_at < now() - make_interval(days => keep_days)
  ),
  doomed as (
    select id from ranked where rn > 1 limit max_rows
  )
  delete from player_metric_snapshots p
  using doomed d
  where p.id = d.id;

  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke all on function prune_player_metric_snapshots(int, int) from public, anon, authenticated;
grant execute on function prune_player_metric_snapshots(int, int) to service_role;

-- One-off backlog cleanup (run once in the SQL editor after creating the function):
--   select prune_player_metric_snapshots(7, 2000000);
