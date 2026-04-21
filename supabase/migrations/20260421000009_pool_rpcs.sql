create or replace function increment_pool(
  p_building_id uuid, p_location tote_location, p_amount int
) returns void language sql as $$
  update tote_pools set count = count + p_amount, updated_at = now()
  where building_id = p_building_id and location = p_location;
$$;

create or replace function decrement_pool(
  p_building_id uuid, p_location tote_location, p_amount int
) returns void language plpgsql as $$
begin
  update tote_pools set count = count - p_amount, updated_at = now()
  where building_id = p_building_id and location = p_location;
  if (select count from tote_pools where building_id = p_building_id and location = p_location) < 0 then
    raise exception 'pool % would go negative', p_location;
  end if;
end;
$$;
