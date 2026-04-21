create type tote_location as enum ('in_building', 'at_3pl', 'out_with_tenant');
create type tote_loss_reason as enum ('lost', 'damaged', 'decommissioned');
create type tote_acquisition_type as enum ('initial', 'reorder');

create table tote_pools (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  location tote_location not null,
  count int not null default 0 check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, location)
);

create table tote_losses (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  count int not null check (count > 0),
  reason tote_loss_reason not null,
  reported_by_user_id uuid references users(id),
  notes text,
  created_at timestamptz not null default now()
);
create index tote_losses_building_id_idx on tote_losses(building_id);

create table tote_acquisitions (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  count int not null check (count > 0),
  acquisition_type tote_acquisition_type not null,
  notes text,
  created_at timestamptz not null default now()
);
create index tote_acquisitions_building_id_idx on tote_acquisitions(building_id);
