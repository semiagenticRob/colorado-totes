create type cost_category as enum (
  'delivery', 'pickup', 'warehousing', 'management_fee', 'subscription'
);
create type invoice_status as enum (
  'draft', 'finalized', 'paid', 'failed', 'void'
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  billing_period date not null,
  stripe_invoice_id text,
  status invoice_status not null default 'draft',
  subtotal_cents int not null default 0,
  total_cents int not null default 0,
  finalized_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, billing_period)
);

create table cost_line_items (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  move_in_id uuid references move_ins(id) on delete set null,
  category cost_category not null,
  passthrough_cents int not null default 0,
  markup_cents int not null default 0,
  total_cents int generated always as (passthrough_cents + markup_cents) stored,
  incurred_on date not null,
  billing_period date not null,
  invoice_id uuid references invoices(id) on delete set null,
  entered_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cost_line_items_building_period_idx
  on cost_line_items(building_id, billing_period);
create index cost_line_items_invoice_id_idx on cost_line_items(invoice_id);
