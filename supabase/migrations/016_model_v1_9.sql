-- Add v1.9 model: v1.8 plus a +4-point home-ice edge on win probability.
-- Inserted inactive, then activated once v1.9 predictions existed for upcoming games:
--   update model_versions set is_active = (version = 'v1.9');
insert into model_versions (version, description, is_active)
values (
  'v1.9',
  'v1.8 + home-ice edge: +4 pts home win probability (long-run NHL home win rate ~54%). Score projection unchanged from v1.8.',
  false
)
on conflict (version) do update set description = excluded.description;
