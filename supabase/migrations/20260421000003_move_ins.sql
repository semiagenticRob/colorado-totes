create type unit_type as enum ('studio', '1br', '2br', '3br_plus', 'other');
create type move_in_state as enum ('pending_delivery', 'delivered', 'returned', 'cancelled');
create type move_in_event_type as enum (
  'created', 'delivered', 'returned', 'cancelled',
  'email_scheduled_sent', 'email_delivered_sent', 'email_reminder_sent', 'email_bounced'
);

create table move_ins (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  tenant_name text not null,
  tenant_email text not null,
  tenant_phone text,
  unit_label text not null,
  unit_type unit_type not null,
  move_in_date date not null,
  batch_count int not null check (batch_count > 0),
  state move_in_state not null default 'pending_delivery',
  delivered_at timestamptz,
  returned_at timestamptz,
  external_id text,
  created_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index move_ins_building_id_idx on move_ins(building_id);
create index move_ins_state_idx on move_ins(state);
create index move_ins_move_in_date_idx on move_ins(move_in_date);

create table move_in_events (
  id uuid primary key default gen_random_uuid(),
  move_in_id uuid not null references move_ins(id) on delete cascade,
  event_type move_in_event_type not null,
  actor_user_id uuid references users(id),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index move_in_events_move_in_id_idx on move_in_events(move_in_id);
