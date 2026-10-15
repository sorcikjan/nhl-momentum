-- Read-only diagnostics, callable via RPC by the service role:
--   POST /rest/v1/rpc/db_diagnostics
-- Table sizes (incl. indexes + bloat), live/dead rows, buffer cache hit rate,
-- connections, and the queries reading the most disk (pg_stat_statements).
-- Lets us see what's straining the free-tier instance without dashboard access.
create or replace function db_diagnostics()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  result json;
  top json;
begin
  begin
    select json_agg(q) into top from (
      select left(regexp_replace(query, '\s+', ' ', 'g'), 200) as query,
             calls,
             round(total_exec_time)::bigint as total_ms,
             round(mean_exec_time)::bigint  as mean_ms,
             shared_blks_read                as disk_blocks_read,
             shared_blks_hit                 as cache_blocks_hit
      from extensions.pg_stat_statements
      order by shared_blks_read desc
      limit 12
    ) q;
  exception when others then
    top := json_build_object('error', sqlerrm);
  end;

  select json_build_object(
    'db_size', pg_size_pretty(pg_database_size(current_database())),
    'db_bytes', pg_database_size(current_database()),
    'shared_buffers', current_setting('shared_buffers'),
    'cache_hit_ratio', (
      select round(sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 4)
      from pg_statio_user_tables
    ),
    'connections', (select count(*) from pg_stat_activity),
    'tables', (
      select json_agg(t) from (
        select relname as table_name,
               pg_size_pretty(pg_total_relation_size(relid)) as total_size,
               pg_size_pretty(pg_indexes_size(relid))        as index_size,
               n_live_tup as live_rows,
               n_dead_tup as dead_rows,
               last_autovacuum
        from pg_stat_user_tables
        order by pg_total_relation_size(relid) desc
        limit 12
      ) t
    ),
    'top_disk_queries', top
  ) into result;
  return result;
end;
$$;

revoke all on function db_diagnostics() from public, anon, authenticated;
grant execute on function db_diagnostics() to service_role;
