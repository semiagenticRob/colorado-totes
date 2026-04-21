-- Demo company
insert into companies (id, name, slug)
values ('11111111-1111-1111-1111-111111111111', 'Demo Property Co', 'demo');

-- Two buildings
insert into buildings (id, company_id, name, address, billing_status)
values
  ('22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111',
   'Sunrise Tower', '123 Main St, Denver, CO', 'active'),
  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   'Mesa Flats', '456 Elm St, Denver, CO', 'active');

-- Initial tote pools (200 at each building, all in_building)
insert into tote_pools (building_id, location, count) values
  ('22222222-2222-2222-2222-222222222222', 'in_building', 200),
  ('22222222-2222-2222-2222-222222222222', 'at_3pl', 0),
  ('22222222-2222-2222-2222-222222222222', 'out_with_tenant', 0),
  ('33333333-3333-3333-3333-333333333333', 'in_building', 200),
  ('33333333-3333-3333-3333-333333333333', 'at_3pl', 0),
  ('33333333-3333-3333-3333-333333333333', 'out_with_tenant', 0);
