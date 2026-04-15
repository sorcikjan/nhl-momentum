-- Add v1.8 model: calibrated xG anchored to NHL league average
-- Win probability logic identical to v1.7; xG output scaled to realistic values (2.0–4.0 range)

insert into model_versions (version, description, is_active)
values (
  'v1.8',
  'Calibrated xG: post-hoc scales raw ratio to NHL league avg 5.5 goals/game. Win probability identical to v1.7. Fixes unrealistic 0.0–0.1 xG display.',
  true
)
on conflict (version) do update set
  description = excluded.description,
  is_active = excluded.is_active;

-- Deactivate all prior versions
update model_versions set is_active = false where version != 'v1.8';
