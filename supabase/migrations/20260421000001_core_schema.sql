-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type user_role as enum ('pm_billing_admin', 'company_admin', 'totes_admin');
create type billing_status as enum ('setup_pending', 'active', 'delinquent');

-- Companies
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{"overdue_days": 14}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Buildings
create table buildings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address text not null,
  logo_storage_path text,
  stripe_customer_id text,
  billing_status billing_status not null default 'setup_pending',
  recommended_batches_by_unit_type jsonb not null
    default '{"studio":1,"1br":2,"2br":2,"3br_plus":3,"other":1}'::jsonb,
  tenant_contact_info jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index buildings_company_id_idx on buildings(company_id);

-- Users (mirrors auth.users)
create table users (
  id uuid primary key,
  company_id uuid references companies(id) on delete cascade,
  building_id uuid references buildings(id) on delete set null,
  role user_role not null,
  display_name text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index users_company_id_idx on users(company_id);
create index users_building_id_idx on users(building_id);
