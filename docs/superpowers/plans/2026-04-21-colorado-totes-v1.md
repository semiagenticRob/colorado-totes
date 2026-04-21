# Colorado Totes V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the V1 Colorado Totes SaaS portal per `docs/superpowers/specs/2026-04-21-colorado-totes-v1-design.md` — a multi-tenant B2B portal for property management companies with Stripe auto-charge billing, Resend-based tenant email sequence, Supabase-backed auth + RLS, and a separate Colorado Totes admin portal for 3PL coordination.

**Architecture:** Next.js 15 App Router monolith deployed on Vercel. Supabase provides Postgres + Auth + Storage. Business logic lives in pure-TS `lib/domain/`; DB access is exclusive to typed repositories in `lib/db/`. Stripe (one Customer per building) and Resend (React Email templates) are isolated behind `lib/billing/` and `lib/email/`. Multi-tenancy is enforced by Postgres RLS keyed off JWT claims.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind · shadcn/ui · Supabase (Postgres + Auth + Storage) · Stripe · Resend + React Email · Vitest · Playwright · Vercel · GitHub Actions

**Phases:**

- Phase 0 — Repo scaffold, tooling, CI
- Phase 1 — Schema + RLS foundations
- Phase 2 — Auth, users, role/scope middleware
- Phase 3 — Domain layer (pure logic)
- Phase 4 — Repository layer
- Phase 5 — Totes Admin portal: company & building onboarding
- Phase 6 — PM portal shell + Stripe card setup
- Phase 7 — Move-in flow (create → deliver → return)
- Phase 8 — Tenant email sequence + cron
- Phase 9 — Inventory, losses, acquisitions UI
- Phase 10 — Palletization queue + pickup
- Phase 11 — Cost line items + monthly invoice cron + Stripe webhooks
- Phase 12 — Company Admin portal (scope picker, rollups, user mgmt)
- Phase 13 — Dashboards, overdue flags, low-stock warnings
- Phase 14 — Public landing, login, invite flow
- Phase 15 — E2E tests + prod deploy

Each task produces a focused commit. TDD is mandatory for `lib/domain/` and `lib/db/`; component-level testing is lighter; E2E lives at the end.

---

## Phase 0 — Repo scaffold, tooling, CI

### Task 0.1: Initialize Next.js project with TypeScript + Tailwind

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.nvmrc`

- [ ] **Step 1: Bootstrap Next.js**

Run from the repo root (`/Users/robertwarren/Projects/colorado-totes`):

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint --use-npm --yes
```

Accept overwrite of README if prompted (our README is near-empty).

- [ ] **Step 2: Pin Node version**

Create `.nvmrc` with contents:

```
20
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: server boots on :3000 and renders the default page. Kill with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app with TypeScript and Tailwind"
```

---

### Task 0.2: Add ESLint + Prettier + typecheck scripts

**Files:**

- Create: `.eslintrc.json`, `.prettierrc`, `.prettierignore`
- Modify: `package.json` (scripts + devDependencies)

- [ ] **Step 1: Install tooling**

```bash
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-next prettier eslint-config-prettier
```

- [ ] **Step 2: Create `.eslintrc.json`**

```json
{
  "extends": ["next/core-web-vitals", "next/typescript", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

- [ ] **Step 3: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 4: Create `.prettierignore`**

```
node_modules
.next
.vercel
supabase/.temp
coverage
```

- [ ] **Step 5: Add scripts to `package.json`**

Merge into `"scripts"`:

```json
"lint": "next lint",
"format": "prettier --write .",
"format:check": "prettier --check .",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 6: Run all three to verify**

```bash
npm run lint && npm run format:check && npm run typecheck
```

All three must pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add eslint, prettier, and typecheck tooling"
```

---

### Task 0.3: Add Vitest for unit + integration tests

**Files:**

- Create: `vitest.config.ts`, `tests/.gitkeep`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

```bash
npm i -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Add test scripts to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 4: Create placeholder test to verify runner**

Create `tests/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add vitest with smoke test"
```

---

### Task 0.4: Define the module boundaries (empty directories + README stubs)

**Files:**

- Create: `lib/domain/README.md`, `lib/db/README.md`, `lib/email/README.md`, `lib/billing/README.md`

- [ ] **Step 1: Create `lib/domain/README.md`**

```markdown
# lib/domain

Pure TypeScript business logic. **No DB imports. No HTTP. No Stripe/Resend/Supabase clients.** Every function in here must be callable from a Vitest unit test without any setup.
```

- [ ] **Step 2: Create `lib/db/README.md`**

```markdown
# lib/db

The only module that imports the Supabase client. Exposes typed repository functions. All other layers go through this.
```

- [ ] **Step 3: Create `lib/email/README.md`**

```markdown
# lib/email

React Email templates + Resend send helpers. Only module that imports the Resend SDK.
```

- [ ] **Step 4: Create `lib/billing/README.md`**

```markdown
# lib/billing

Stripe SDK wrapper + invoice assembly + webhook handling. Only module that imports the Stripe SDK.
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: document module boundaries in lib/"
```

---

### Task 0.5: GitHub Actions CI workflow

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck
      - run: npm test
```

- [ ] **Step 2: Commit and push to trigger**

```bash
git add -A
git commit -m "ci: add lint/format/typecheck/test workflow"
git push origin main
```

Verify the workflow runs green on GitHub. If it fails, fix inline, push, re-verify.

---

## Phase 1 — Schema + RLS foundations

### Task 1.1: Install and initialize Supabase CLI

**Files:**

- Create: `supabase/config.toml` (auto-generated), `supabase/.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Install Supabase CLI as a dev dependency**

```bash
npm i -D supabase
```

- [ ] **Step 2: Initialize Supabase project structure**

```bash
npx supabase init
```

Answer prompts with defaults (do not generate VS Code settings).

- [ ] **Step 3: Add db scripts to `package.json`**

```json
"db:start": "supabase start",
"db:stop": "supabase stop",
"db:reset": "supabase db reset",
"db:diff": "supabase db diff",
"db:push": "supabase db push"
```

- [ ] **Step 4: Boot local Supabase once to validate**

```bash
npm run db:start
```

Expected: Docker starts containers, URLs printed. Then:

```bash
npm run db:stop
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add supabase CLI and db scripts"
```

---

### Task 1.2: First migration — extensions, enums, companies, buildings, users

**Files:**

- Create: `supabase/migrations/20260421000001_core_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply to local DB**

```bash
npm run db:start
npm run db:reset
```

Expected: migration applied, tables created.

- [ ] **Step 3: Verify schema**

```bash
npx supabase db psql -c "\dt public.*"
```

Expected: `companies`, `buildings`, `users` present.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(db): add core tenancy schema (companies, buildings, users)"
```

---

### Task 1.3: Second migration — inventory tables

**Files:**

- Create: `supabase/migrations/20260421000002_inventory.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply**

```bash
npm run db:reset
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): add inventory tables (pools, losses, acquisitions)"
```

---

### Task 1.4: Third migration — move-ins

**Files:**

- Create: `supabase/migrations/20260421000003_move_ins.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply and commit**

```bash
npm run db:reset
git add -A
git commit -m "feat(db): add move_ins and move_in_events"
```

---

### Task 1.5: Fourth migration — costs and invoices

**Files:**

- Create: `supabase/migrations/20260421000004_billing.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply and commit**

```bash
npm run db:reset
git add -A
git commit -m "feat(db): add invoices and cost_line_items"
```

---

### Task 1.6: Fifth migration — tenant emails

**Files:**

- Create: `supabase/migrations/20260421000005_tenant_emails.sql`

- [ ] **Step 1: Write the migration**

```sql
create type tenant_email_kind as enum ('scheduled', 'delivered', 'reminder_48h');
create type tenant_email_status as enum ('pending', 'sent', 'failed', 'bounced');

create table tenant_emails (
  id uuid primary key default gen_random_uuid(),
  move_in_id uuid not null references move_ins(id) on delete cascade,
  kind tenant_email_kind not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  resend_message_id text,
  status tenant_email_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenant_emails_pending_idx
  on tenant_emails(scheduled_for) where status = 'pending';
create index tenant_emails_move_in_id_idx on tenant_emails(move_in_id);
```

- [ ] **Step 2: Apply and commit**

```bash
npm run db:reset
git add -A
git commit -m "feat(db): add tenant_emails queue"
```

---

### Task 1.7: Sixth migration — views

**Files:**

- Create: `supabase/migrations/20260421000006_views.sql`

- [ ] **Step 1: Write the migration**

```sql
create view building_inventory_summary as
select
  b.id as building_id,
  coalesce(sum(case when p.location = 'in_building' then p.count end), 0)
    + coalesce(sum(case when p.location = 'at_3pl' then p.count end), 0)
    + coalesce(sum(case when p.location = 'out_with_tenant' then p.count end), 0)
    + coalesce((select sum(count) from tote_losses tl where tl.building_id = b.id), 0)
    as total_owned,
  coalesce(sum(case when p.location = 'in_building' then p.count end), 0) as in_building,
  coalesce(sum(case when p.location = 'at_3pl' then p.count end), 0) as at_3pl,
  coalesce(sum(case when p.location = 'out_with_tenant' then p.count end), 0) as out_with_tenant,
  coalesce((select sum(count) from tote_losses tl where tl.building_id = b.id), 0) as lost,
  round(
    100.0 * coalesce(sum(case when p.location = 'in_building' then p.count end), 0) / 120.0,
    1
  ) as palletization_progress_pct
from buildings b
left join tote_pools p on p.building_id = b.id
group by b.id;

create view building_billing_summary as
select
  building_id,
  billing_period,
  sum(passthrough_cents) as passthrough_cents,
  sum(markup_cents) as markup_cents,
  sum(case when category = 'subscription' then total_cents else 0 end) as subscription_cents,
  sum(total_cents) as total_cents
from cost_line_items
group by building_id, billing_period;

create view overdue_move_ins as
select
  mi.id as move_in_id,
  mi.building_id,
  extract(day from now() - mi.delivered_at)::int as days_overdue
from move_ins mi
join buildings b on b.id = mi.building_id
join companies c on c.id = b.company_id
where mi.state = 'delivered'
  and mi.delivered_at is not null
  and extract(day from now() - mi.delivered_at)
      >= coalesce((c.settings->>'overdue_days')::int, 14);
```

- [ ] **Step 2: Apply and commit**

```bash
npm run db:reset
git add -A
git commit -m "feat(db): add dashboard views (inventory, billing, overdue)"
```

---

### Task 1.8: Seventh migration — RLS policies

**Files:**

- Create: `supabase/migrations/20260421000007_rls.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Helper functions reading JWT claims
create or replace function current_user_role() returns text
  language sql stable as $$
  select coalesce((auth.jwt() ->> 'user_role')::text, '')
$$;

create or replace function current_user_company_id() returns uuid
  language sql stable as $$
  select nullif(auth.jwt() ->> 'company_id', '')::uuid
$$;

create or replace function current_user_building_id() returns uuid
  language sql stable as $$
  select nullif(auth.jwt() ->> 'building_id', '')::uuid
$$;

-- Enable RLS
alter table companies enable row level security;
alter table buildings enable row level security;
alter table users enable row level security;
alter table tote_pools enable row level security;
alter table tote_losses enable row level security;
alter table tote_acquisitions enable row level security;
alter table move_ins enable row level security;
alter table move_in_events enable row level security;
alter table invoices enable row level security;
alter table cost_line_items enable row level security;
alter table tenant_emails enable row level security;

-- Totes admin bypass (service_role bypasses RLS automatically in Supabase,
-- so no explicit policies needed for them — server-side routes under /admin
-- use the service role key).

-- Companies: company_admin sees their own row
create policy companies_company_admin_select on companies for select
  using (
    current_user_role() = 'company_admin'
    and id = current_user_company_id()
  );

-- Buildings: company_admin sees buildings in their company; pm_billing_admin sees their own
create policy buildings_company_admin_select on buildings for select
  using (
    current_user_role() = 'company_admin'
    and company_id = current_user_company_id()
  );

create policy buildings_pm_select on buildings for select
  using (
    current_user_role() = 'pm_billing_admin'
    and id = current_user_building_id()
  );

-- Users: read your own profile; company_admin reads users in their company
create policy users_self_select on users for select using (id = auth.uid());
create policy users_company_admin_select on users for select using (
  current_user_role() = 'company_admin'
  and company_id = current_user_company_id()
);

-- Helper macro for building-scoped tables
do $$
declare t text;
begin
  foreach t in array array[
    'tote_pools','tote_losses','tote_acquisitions',
    'move_ins','move_in_events','invoices',
    'cost_line_items','tenant_emails'
  ]
  loop
    -- Skip tables that don't have building_id directly (move_in_events, tenant_emails join via move_ins)
    null;
  end loop;
end$$;

-- Direct building_id policies
create policy tp_company_admin on tote_pools for select using (
  current_user_role() = 'company_admin' and
  building_id in (select id from buildings where company_id = current_user_company_id())
);
create policy tp_pm on tote_pools for select using (
  current_user_role() = 'pm_billing_admin' and building_id = current_user_building_id()
);

create policy tl_company_admin on tote_losses for select using (
  current_user_role() = 'company_admin' and
  building_id in (select id from buildings where company_id = current_user_company_id())
);
create policy tl_pm on tote_losses for select using (
  current_user_role() = 'pm_billing_admin' and building_id = current_user_building_id()
);
create policy tl_pm_insert on tote_losses for insert with check (
  current_user_role() in ('pm_billing_admin', 'company_admin')
  and building_id in (
    select id from buildings where
      (current_user_role() = 'pm_billing_admin' and id = current_user_building_id())
      or (current_user_role() = 'company_admin' and company_id = current_user_company_id())
  )
);

create policy ta_company_admin on tote_acquisitions for select using (
  current_user_role() = 'company_admin' and
  building_id in (select id from buildings where company_id = current_user_company_id())
);
create policy ta_pm on tote_acquisitions for select using (
  current_user_role() = 'pm_billing_admin' and building_id = current_user_building_id()
);

create policy mi_company_admin on move_ins for select using (
  current_user_role() = 'company_admin' and
  building_id in (select id from buildings where company_id = current_user_company_id())
);
create policy mi_pm on move_ins for select using (
  current_user_role() = 'pm_billing_admin' and building_id = current_user_building_id()
);
create policy mi_insert on move_ins for insert with check (
  current_user_role() in ('pm_billing_admin', 'company_admin')
  and building_id in (
    select id from buildings where
      (current_user_role() = 'pm_billing_admin' and id = current_user_building_id())
      or (current_user_role() = 'company_admin' and company_id = current_user_company_id())
  )
);
create policy mi_update on move_ins for update using (
  current_user_role() in ('pm_billing_admin', 'company_admin')
  and building_id in (
    select id from buildings where
      (current_user_role() = 'pm_billing_admin' and id = current_user_building_id())
      or (current_user_role() = 'company_admin' and company_id = current_user_company_id())
  )
);

create policy mie_select on move_in_events for select using (
  move_in_id in (select id from move_ins) -- falls back to move_ins RLS
);

create policy inv_company_admin on invoices for select using (
  current_user_role() = 'company_admin' and
  building_id in (select id from buildings where company_id = current_user_company_id())
);
create policy inv_pm on invoices for select using (
  current_user_role() = 'pm_billing_admin' and building_id = current_user_building_id()
);

create policy cli_company_admin on cost_line_items for select using (
  current_user_role() = 'company_admin' and
  building_id in (select id from buildings where company_id = current_user_company_id())
);
create policy cli_pm on cost_line_items for select using (
  current_user_role() = 'pm_billing_admin' and building_id = current_user_building_id()
);

create policy te_select on tenant_emails for select using (
  move_in_id in (select id from move_ins) -- falls back to move_ins RLS
);
```

- [ ] **Step 2: Apply**

```bash
npm run db:reset
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): enable RLS with role/scope-based policies"
```

---

### Task 1.9: Seed script for local development

**Files:**

- Create: `supabase/seed.sql`

- [ ] **Step 1: Write the seed**

```sql
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
```

- [ ] **Step 2: Apply with reset**

```bash
npm run db:reset
```

Expected: seed applied after migrations.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(db): add local dev seed"
```

---

## Phase 2 — Auth, users, role/scope middleware

### Task 2.1: Install Supabase JS client and create typed DB types

**Files:**

- Create: `lib/db/types.generated.ts` (generated), `lib/db/client.ts`
- Modify: `package.json` (add `db:types` script)

- [ ] **Step 1: Install clients**

```bash
npm i @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Add type-gen script to `package.json`**

```json
"db:types": "supabase gen types typescript --local > lib/db/types.generated.ts"
```

- [ ] **Step 3: Generate types**

```bash
npm run db:start
npm run db:types
```

- [ ] **Step 4: Create `lib/db/client.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types.generated";

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

export function supabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(db): add supabase clients (server + admin) and generated types"
```

---

### Task 2.2: Env file + Next.js env validation

**Files:**

- Create: `.env.example`, `.env.local` (gitignored), `lib/env.ts`

- [ ] **Step 1: Create `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
RESEND_FROM_ADDRESS=
CRON_SECRET=
APP_BASE_URL=http://localhost:3000
```

- [ ] **Step 2: Populate `.env.local` from `npm run db:start` output**

The `db:start` command prints the local anon key and service role key. Paste them plus placeholder Stripe/Resend values.

- [ ] **Step 3: Create `lib/env.ts`**

```typescript
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_BASE_URL",
] as const;

export function env() {
  for (const k of required) {
    if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
  }
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    resendFromAddress: process.env.RESEND_FROM_ADDRESS ?? "",
    cronSecret: process.env.CRON_SECRET ?? "",
    appBaseUrl: process.env.APP_BASE_URL!,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add .env.example lib/env.ts
git commit -m "feat: add env loader and example env file"
```

---

### Task 2.3: Role/scope JWT hook via Postgres function

**Files:**

- Create: `supabase/migrations/20260421000008_jwt_hook.sql`

Auth hooks in Supabase let us inject custom claims into every JWT. We enrich each token with `user_role`, `company_id`, `building_id`.

- [ ] **Step 1: Write the migration**

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb := event->'claims';
  u record;
begin
  select role, company_id, building_id
  into u
  from public.users
  where id = (event->>'user_id')::uuid;

  if u.role is not null then
    claims := claims || jsonb_build_object(
      'user_role', u.role::text,
      'company_id', coalesce(u.company_id::text, ''),
      'building_id', coalesce(u.building_id::text, '')
    );
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
```

- [ ] **Step 2: Configure Supabase to use this hook**

Edit `supabase/config.toml`, set:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

- [ ] **Step 3: Apply and restart**

```bash
npm run db:stop && npm run db:start && npm run db:reset
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(auth): inject role/company/building claims via JWT hook"
```

---

### Task 2.4: Current-user helper + role guards

**Files:**

- Create: `lib/auth/current-user.ts`, `lib/auth/guards.ts`
- Test: `tests/domain/guards.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { requireRole, canActOnBuilding } from "@/lib/auth/guards";

describe("guards", () => {
  it("requireRole allows matching role", () => {
    expect(() =>
      requireRole({ role: "pm_billing_admin" } as any, ["pm_billing_admin"]),
    ).not.toThrow();
  });

  it("requireRole throws on mismatched role", () => {
    expect(() => requireRole({ role: "pm_billing_admin" } as any, ["company_admin"])).toThrow();
  });

  it("canActOnBuilding: totes_admin can always act", () => {
    expect(canActOnBuilding({ role: "totes_admin" } as any, "any-building-id")).toBe(true);
  });

  it("canActOnBuilding: pm scoped to building", () => {
    const u = { role: "pm_billing_admin", buildingId: "b1" } as any;
    expect(canActOnBuilding(u, "b1")).toBe(true);
    expect(canActOnBuilding(u, "b2")).toBe(false);
  });

  it("canActOnBuilding: company_admin scoped via building lookup", () => {
    const u = { role: "company_admin", companyId: "c1" } as any;
    // Needs a map of building->company
    expect(canActOnBuilding(u, "b1", { b1: "c1", b2: "c2" })).toBe(true);
    expect(canActOnBuilding(u, "b2", { b1: "c1", b2: "c2" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
npm test
```

Expected: fails (module doesn't exist).

- [ ] **Step 3: Create `lib/auth/current-user.ts`**

```typescript
import { supabaseServer } from "@/lib/db/client";

export type AuthUser = {
  id: string;
  email: string;
  role: "pm_billing_admin" | "company_admin" | "totes_admin";
  companyId: string | null;
  buildingId: string | null;
};

export async function currentUser(): Promise<AuthUser | null> {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const claims = user.app_metadata ?? {};
  const role = (user.user_metadata?.user_role ?? claims.user_role ?? null) as
    | AuthUser["role"]
    | null;
  if (!role) return null;

  return {
    id: user.id,
    email: user.email!,
    role,
    companyId: (claims.company_id as string) || null,
    buildingId: (claims.building_id as string) || null,
  };
}
```

- [ ] **Step 4: Create `lib/auth/guards.ts`**

```typescript
import type { AuthUser } from "./current-user";

export function requireRole(user: AuthUser, allowed: AuthUser["role"][]): void {
  if (!allowed.includes(user.role)) {
    throw new Error(`Forbidden: requires one of ${allowed.join(", ")}`);
  }
}

export function canActOnBuilding(
  user: AuthUser,
  buildingId: string,
  buildingToCompany?: Record<string, string>,
): boolean {
  if (user.role === "totes_admin") return true;
  if (user.role === "pm_billing_admin") return user.buildingId === buildingId;
  if (user.role === "company_admin") {
    if (!buildingToCompany) return false;
    return buildingToCompany[buildingId] === user.companyId;
  }
  return false;
}
```

- [ ] **Step 5: Run tests — verify pass**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(auth): current-user helper and role/scope guards"
```

---

### Task 2.5: Route groups and auth middleware

**Files:**

- Create: `middleware.ts`, `app/(portal)/layout.tsx`, `app/admin/layout.tsx`, `app/(auth)/login/page.tsx`
- Delete: `app/page.tsx` (default scaffold page); we'll redirect root

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isProtected = path.startsWith("/app") || path.startsWith("/admin");
  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
```

- [ ] **Step 2: Create `app/(portal)/layout.tsx`**

```typescript
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "totes_admin") redirect("/admin");
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
```

- [ ] **Step 3: Create `app/admin/layout.tsx`**

```typescript
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "totes_admin") redirect("/app");
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
```

- [ ] **Step 4: Create minimal login page `app/(auth)/login/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return setErr(error.message);
    router.push(search.get("next") ?? "/app");
  }

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50">
      <form onSubmit={submit} className="w-80 space-y-3 bg-white p-6 rounded shadow">
        <h1 className="text-lg font-semibold">Sign in</h1>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-black text-white rounded py-2">Sign in</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Update `app/page.tsx` to redirect to login**

Replace contents with:

```typescript
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/login");
}
```

- [ ] **Step 6: Boot dev server, verify redirects**

```bash
npm run dev
```

- Visit `/` → redirects to `/login`.
- Visit `/app` → redirects to `/login?next=/app`.
- Visit `/admin` → redirects to `/login?next=/admin`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(auth): middleware + route group layouts + login page"
```

---

## Phase 3 — Domain layer (pure logic)

### Task 3.1: Batch math

**Files:**

- Create: `lib/domain/batches.ts`
- Test: `tests/domain/batches.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { BATCH_SIZE, totesFromBatches, recommendedBatches } from "@/lib/domain/batches";

describe("batches", () => {
  it("BATCH_SIZE is 20", () => {
    expect(BATCH_SIZE).toBe(20);
  });
  it("totesFromBatches multiplies by 20", () => {
    expect(totesFromBatches(1)).toBe(20);
    expect(totesFromBatches(3)).toBe(60);
  });
  it("recommendedBatches looks up unit_type in settings map", () => {
    const map = { studio: 1, "1br": 2, "2br": 2, "3br_plus": 3, other: 1 };
    expect(recommendedBatches("studio", map)).toBe(1);
    expect(recommendedBatches("2br", map)).toBe(2);
    expect(recommendedBatches("unknown" as any, map)).toBe(1); // falls back to "other"
  });
});
```

- [ ] **Step 2: Run — fails**

```bash
npm test
```

- [ ] **Step 3: Implement `lib/domain/batches.ts`**

```typescript
export const BATCH_SIZE = 20;

export function totesFromBatches(n: number): number {
  return n * BATCH_SIZE;
}

export type UnitType = "studio" | "1br" | "2br" | "3br_plus" | "other";
export type RecommendationMap = Record<UnitType, number>;

export function recommendedBatches(unitType: UnitType, map: RecommendationMap): number {
  return map[unitType] ?? map.other ?? 1;
}
```

- [ ] **Step 4: Run — pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): batch size constants and recommendation lookup"
```

---

### Task 3.2: Move-in state machine

**Files:**

- Create: `lib/domain/move-in-state.ts`
- Test: `tests/domain/move-in-state.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { canTransition, nextState } from "@/lib/domain/move-in-state";

describe("move-in state machine", () => {
  it("pending_delivery → delivered is allowed", () => {
    expect(canTransition("pending_delivery", "delivered")).toBe(true);
  });
  it("delivered → returned is allowed", () => {
    expect(canTransition("delivered", "returned")).toBe(true);
  });
  it("pending_delivery → cancelled is allowed", () => {
    expect(canTransition("pending_delivery", "cancelled")).toBe(true);
  });
  it("returned → anything is disallowed", () => {
    expect(canTransition("returned", "delivered")).toBe(false);
    expect(canTransition("returned", "pending_delivery")).toBe(false);
  });
  it("nextState throws on illegal transition", () => {
    expect(() => nextState("returned", "delivered")).toThrow();
  });
  it("nextState returns target on legal transition", () => {
    expect(nextState("delivered", "returned")).toBe("returned");
  });
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement `lib/domain/move-in-state.ts`**

```typescript
export type MoveInState = "pending_delivery" | "delivered" | "returned" | "cancelled";

const ALLOWED: Record<MoveInState, MoveInState[]> = {
  pending_delivery: ["delivered", "cancelled"],
  delivered: ["returned"],
  returned: [],
  cancelled: [],
};

export function canTransition(from: MoveInState, to: MoveInState): boolean {
  return ALLOWED[from].includes(to);
}

export function nextState(from: MoveInState, to: MoveInState): MoveInState {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal transition: ${from} → ${to}`);
  }
  return to;
}
```

- [ ] **Step 4: Run — pass. Commit.**

```bash
npm test && git add -A && git commit -m "feat(domain): move-in state machine"
```

---

### Task 3.3: Palletization logic

**Files:**

- Create: `lib/domain/palletization.ts`
- Test: `tests/domain/palletization.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import {
  PALLET_SIZE,
  isReadyForPalletization,
  palletizationProgressPct,
} from "@/lib/domain/palletization";

describe("palletization", () => {
  it("threshold is 120", () => {
    expect(PALLET_SIZE).toBe(120);
  });
  it("flags when in-building >= 120", () => {
    expect(isReadyForPalletization(119)).toBe(false);
    expect(isReadyForPalletization(120)).toBe(true);
    expect(isReadyForPalletization(240)).toBe(true);
  });
  it("progress pct caps at 100", () => {
    expect(palletizationProgressPct(60)).toBe(50);
    expect(palletizationProgressPct(120)).toBe(100);
    expect(palletizationProgressPct(240)).toBe(100);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
export const PALLET_SIZE = 120;

export function isReadyForPalletization(inBuildingCount: number): boolean {
  return inBuildingCount >= PALLET_SIZE;
}

export function palletizationProgressPct(inBuildingCount: number): number {
  return Math.min(100, Math.round((inBuildingCount / PALLET_SIZE) * 100));
}
```

- [ ] **Step 3: Run, commit.**

```bash
npm test && git add -A && git commit -m "feat(domain): palletization threshold logic"
```

---

### Task 3.4: Cost aggregation

**Files:**

- Create: `lib/domain/costs.ts`
- Test: `tests/domain/costs.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { aggregatePeriod, type CostLine } from "@/lib/domain/costs";

const line = (category: CostLine["category"], passthrough: number, markup: number): CostLine => ({
  category,
  passthroughCents: passthrough,
  markupCents: markup,
});

describe("cost aggregation", () => {
  it("rolls up per category and grand total", () => {
    const lines: CostLine[] = [
      line("delivery", 5000, 500),
      line("delivery", 6000, 600),
      line("pickup", 8000, 800),
      line("warehousing", 12000, 0),
      line("management_fee", 0, 2000),
      line("subscription", 0, 29900),
    ];
    const r = aggregatePeriod(lines);
    expect(r.passthroughCents).toBe(5000 + 6000 + 8000 + 12000);
    expect(r.markupCents).toBe(500 + 600 + 800 + 2000);
    expect(r.subscriptionCents).toBe(29900);
    expect(r.totalCents).toBe(5000 + 500 + 6000 + 600 + 8000 + 800 + 12000 + 2000 + 29900);
  });

  it("handles empty input", () => {
    const r = aggregatePeriod([]);
    expect(r.totalCents).toBe(0);
  });
});
```

- [ ] **Step 2: Implement `lib/domain/costs.ts`**

```typescript
export type CostCategory =
  | "delivery"
  | "pickup"
  | "warehousing"
  | "management_fee"
  | "subscription";

export type CostLine = {
  category: CostCategory;
  passthroughCents: number;
  markupCents: number;
};

export type PeriodRollup = {
  passthroughCents: number;
  markupCents: number;
  subscriptionCents: number;
  totalCents: number;
};

export function aggregatePeriod(lines: CostLine[]): PeriodRollup {
  let passthroughCents = 0;
  let markupCents = 0;
  let subscriptionCents = 0;
  let totalCents = 0;
  for (const l of lines) {
    passthroughCents += l.passthroughCents;
    markupCents += l.markupCents;
    if (l.category === "subscription") {
      subscriptionCents += l.passthroughCents + l.markupCents;
    }
    totalCents += l.passthroughCents + l.markupCents;
  }
  return { passthroughCents, markupCents, subscriptionCents, totalCents };
}
```

- [ ] **Step 3: Commit**

```bash
npm test && git add -A && git commit -m "feat(domain): cost aggregation"
```

---

### Task 3.5: Overdue calculation

**Files:**

- Create: `lib/domain/overdue.ts`
- Test: `tests/domain/overdue.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from "vitest";
import { isOverdue, daysOverdue } from "@/lib/domain/overdue";

describe("overdue", () => {
  const now = new Date("2026-04-21T12:00:00Z");
  it("not overdue if within threshold", () => {
    expect(isOverdue(new Date("2026-04-15T00:00:00Z"), 14, now)).toBe(false);
  });
  it("overdue if past threshold", () => {
    expect(isOverdue(new Date("2026-03-01T00:00:00Z"), 14, now)).toBe(true);
  });
  it("daysOverdue returns 0 when within threshold", () => {
    expect(daysOverdue(new Date("2026-04-20T00:00:00Z"), 14, now)).toBe(0);
  });
  it("daysOverdue returns positive days past threshold", () => {
    // delivered 20 days ago, threshold 14 → 6 days overdue
    const delivered = new Date("2026-04-01T12:00:00Z");
    expect(daysOverdue(delivered, 14, now)).toBe(6);
  });
});
```

- [ ] **Step 2: Implement `lib/domain/overdue.ts`**

```typescript
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSince(deliveredAt: Date, now: Date): number {
  return Math.floor((now.getTime() - deliveredAt.getTime()) / MS_PER_DAY);
}

export function isOverdue(
  deliveredAt: Date,
  thresholdDays: number,
  now: Date = new Date(),
): boolean {
  return daysSince(deliveredAt, now) >= thresholdDays;
}

export function daysOverdue(
  deliveredAt: Date,
  thresholdDays: number,
  now: Date = new Date(),
): number {
  const d = daysSince(deliveredAt, now) - thresholdDays;
  return d > 0 ? d : 0;
}
```

- [ ] **Step 3: Commit**

```bash
npm test && git add -A && git commit -m "feat(domain): overdue calculation"
```

---

### Task 3.6: Inventory delta operations

Models the four state transitions that mutate `tote_pools`: delivery (at_3pl → out_with_tenant), return (out_with_tenant → in_building), pickup (in_building → at_3pl), and initial acquisition (external → in_building or at_3pl).

**Files:**

- Create: `lib/domain/inventory.ts`
- Test: `tests/domain/inventory.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from "vitest";
import { applyDelta, type Pools } from "@/lib/domain/inventory";

const pools = (inB: number, at3: number, out: number): Pools => ({
  in_building: inB,
  at_3pl: at3,
  out_with_tenant: out,
});

describe("inventory delta", () => {
  it("delivery moves totes from at_3pl to out_with_tenant", () => {
    const p = pools(0, 100, 0);
    const r = applyDelta(p, { kind: "delivery", totes: 40 });
    expect(r).toEqual(pools(0, 60, 40));
  });
  it("return moves totes from out_with_tenant to in_building", () => {
    const p = pools(200, 0, 40);
    const r = applyDelta(p, { kind: "return", totes: 40 });
    expect(r).toEqual(pools(240, 0, 0));
  });
  it("pickup moves totes from in_building to at_3pl", () => {
    const p = pools(120, 0, 0);
    const r = applyDelta(p, { kind: "pickup", totes: 120 });
    expect(r).toEqual(pools(0, 120, 0));
  });
  it("acquisition adds to a specified pool", () => {
    const p = pools(0, 0, 0);
    expect(applyDelta(p, { kind: "acquisition", into: "in_building", totes: 200 })).toEqual(
      pools(200, 0, 0),
    );
  });
  it("throws when source pool would go negative", () => {
    const p = pools(0, 10, 0);
    expect(() => applyDelta(p, { kind: "delivery", totes: 40 })).toThrow();
  });
});
```

- [ ] **Step 2: Implement `lib/domain/inventory.ts`**

```typescript
export type Pools = {
  in_building: number;
  at_3pl: number;
  out_with_tenant: number;
};

export type Delta =
  | { kind: "delivery"; totes: number }
  | { kind: "return"; totes: number }
  | { kind: "pickup"; totes: number }
  | { kind: "acquisition"; into: keyof Pools; totes: number };

export function applyDelta(p: Pools, d: Delta): Pools {
  switch (d.kind) {
    case "delivery":
      if (p.at_3pl < d.totes) throw new Error("Insufficient at_3pl stock");
      return { ...p, at_3pl: p.at_3pl - d.totes, out_with_tenant: p.out_with_tenant + d.totes };
    case "return":
      if (p.out_with_tenant < d.totes) throw new Error("Insufficient out_with_tenant");
      return {
        ...p,
        out_with_tenant: p.out_with_tenant - d.totes,
        in_building: p.in_building + d.totes,
      };
    case "pickup":
      if (p.in_building < d.totes) throw new Error("Insufficient in_building");
      return { ...p, in_building: p.in_building - d.totes, at_3pl: p.at_3pl + d.totes };
    case "acquisition":
      return { ...p, [d.into]: p[d.into] + d.totes };
  }
}
```

- [ ] **Step 3: Commit**

```bash
npm test && git add -A && git commit -m "feat(domain): inventory pool delta operations"
```

---

## Phase 4 — Repository layer

### Task 4.1: Companies repo

**Files:**

- Create: `lib/db/repos/companies.ts`
- Test: `tests/db/companies.test.ts`

Tests in Phase 4 use a local Supabase with the service-role key — they bypass RLS (RLS is tested separately in Phase 4.7).

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany, getCompanyBySlug } from "@/lib/db/repos/companies";

beforeEach(async () => {
  const db = supabaseAdmin();
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
});

describe("companies repo", () => {
  it("createCompany inserts and returns the row", async () => {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    expect(c.name).toBe("Acme");
    expect(c.slug).toBe("acme");
  });
  it("getCompanyBySlug returns the row", async () => {
    await createCompany({ name: "Acme", slug: "acme" });
    const c = await getCompanyBySlug("acme");
    expect(c?.name).toBe("Acme");
  });
  it("getCompanyBySlug returns null when missing", async () => {
    expect(await getCompanyBySlug("nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement `lib/db/repos/companies.ts`**

```typescript
import { supabaseAdmin } from "@/lib/db/client";

export type NewCompany = {
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
};

export async function createCompany(input: NewCompany) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("companies")
    .insert({ name: input.name, slug: input.slug, settings: input.settings ?? {} })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getCompanyBySlug(slug: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("companies").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCompanyById(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("companies").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: Run with local Supabase**

```bash
npm run db:start
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(db): companies repo + tests"
```

---

### Task 4.2: Buildings repo

**Files:**

- Create: `lib/db/repos/buildings.ts`
- Test: `tests/db/buildings.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import {
  createBuilding,
  listBuildingsForCompany,
  getBuildingById,
  updateBuilding,
} from "@/lib/db/repos/buildings";

async function reset() {
  const db = supabaseAdmin();
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

describe("buildings repo", () => {
  beforeEach(reset);

  it("create + fetch + update", async () => {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    const b = await createBuilding({
      company_id: c.id,
      name: "Sunrise",
      address: "123 Main",
    });
    expect(b.name).toBe("Sunrise");
    expect(b.billing_status).toBe("setup_pending");

    const list = await listBuildingsForCompany(c.id);
    expect(list).toHaveLength(1);

    const fetched = await getBuildingById(b.id);
    expect(fetched?.name).toBe("Sunrise");

    const updated = await updateBuilding(b.id, { address: "456 Elm" });
    expect(updated.address).toBe("456 Elm");
  });
});
```

- [ ] **Step 2: Implement `lib/db/repos/buildings.ts`**

```typescript
import { supabaseAdmin } from "@/lib/db/client";

export type NewBuilding = {
  company_id: string;
  name: string;
  address: string;
  recommended_batches_by_unit_type?: Record<string, number>;
  tenant_contact_info?: Record<string, unknown> | null;
};

export async function createBuilding(input: NewBuilding) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("buildings").insert(input).select("*").single();
  if (error) throw error;

  // Ensure pool rows exist
  await db.from("tote_pools").insert([
    { building_id: data.id, location: "in_building", count: 0 },
    { building_id: data.id, location: "at_3pl", count: 0 },
    { building_id: data.id, location: "out_with_tenant", count: 0 },
  ]);
  return data;
}

export async function listBuildingsForCompany(companyId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("buildings")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getBuildingById(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("buildings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateBuilding(
  id: string,
  patch: Partial<{
    name: string;
    address: string;
    logo_storage_path: string | null;
    stripe_customer_id: string | null;
    billing_status: "setup_pending" | "active" | "delinquent";
    recommended_batches_by_unit_type: Record<string, number>;
    tenant_contact_info: Record<string, unknown> | null;
  }>,
) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("buildings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
```

- [ ] **Step 3: Run and commit**

```bash
npm test && git add -A && git commit -m "feat(db): buildings repo + pool auto-init"
```

---

### Task 4.3: Users repo (invite-driven)

**Files:**

- Create: `lib/db/repos/users.ts`
- Test: `tests/db/users.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import { inviteUser, getUserById } from "@/lib/db/repos/users";

async function reset() {
  const db = supabaseAdmin();
  await db.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  // Also remove auth users created in previous tests
  const { data: list } = await db.auth.admin.listUsers();
  for (const u of list?.users ?? []) await db.auth.admin.deleteUser(u.id);
}

describe("users repo", () => {
  beforeEach(reset);

  it("invites a pm_billing_admin scoped to a building", async () => {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    const b = await createBuilding({ company_id: c.id, name: "Sunrise", address: "x" });
    const u = await inviteUser({
      email: "pm@example.com",
      role: "pm_billing_admin",
      company_id: c.id,
      building_id: b.id,
      display_name: "PM One",
    });
    expect(u.email).toBe("pm@example.com");
    expect(u.role).toBe("pm_billing_admin");
    expect(u.building_id).toBe(b.id);

    const fetched = await getUserById(u.id);
    expect(fetched?.email).toBe("pm@example.com");
  });
});
```

- [ ] **Step 2: Implement `lib/db/repos/users.ts`**

```typescript
import { supabaseAdmin } from "@/lib/db/client";
import { env } from "@/lib/env";

export type InviteInput = {
  email: string;
  role: "pm_billing_admin" | "company_admin" | "totes_admin";
  company_id: string | null;
  building_id: string | null;
  display_name?: string;
};

export async function inviteUser(input: InviteInput) {
  const db = supabaseAdmin();
  const { data: invited, error: inviteErr } = await db.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${env().appBaseUrl}/invite/accept`,
  });
  if (inviteErr) throw inviteErr;
  const authUserId = invited.user!.id;

  const { data, error } = await db
    .from("users")
    .insert({
      id: authUserId,
      role: input.role,
      company_id: input.company_id,
      building_id: input.building_id,
      display_name: input.display_name ?? null,
      email: input.email,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listUsersForCompany(companyId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("company_id", companyId)
    .order("email");
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 3: Run and commit**

```bash
npm test && git add -A && git commit -m "feat(db): users repo with invite flow"
```

---

### Task 4.4: Move-ins repo (with event log writes)

**Files:**

- Create: `lib/db/repos/move-ins.ts`
- Test: `tests/db/move-ins.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import {
  createMoveIn,
  markDelivered,
  markReturned,
  getMoveInById,
  listMoveInEvents,
} from "@/lib/db/repos/move-ins";

async function reset() {
  const db = supabaseAdmin();
  await db.from("move_in_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("move_ins").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

describe("move-ins repo", () => {
  beforeEach(reset);

  async function seed() {
    const c = await createCompany({ name: "Acme", slug: "acme" });
    const b = await createBuilding({ company_id: c.id, name: "Sunrise", address: "x" });
    // put 100 totes at_3pl
    await supabaseAdmin()
      .from("tote_pools")
      .update({ count: 100 })
      .eq("building_id", b.id)
      .eq("location", "at_3pl");
    return { c, b };
  }

  it("create → delivered → returned transitions pools and logs events", async () => {
    const { b } = await seed();

    const mi = await createMoveIn({
      building_id: b.id,
      tenant_name: "Jane",
      tenant_email: "jane@example.com",
      unit_label: "4B",
      unit_type: "2br",
      move_in_date: "2026-05-01",
      batch_count: 2,
    });
    expect(mi.state).toBe("pending_delivery");

    let events = await listMoveInEvents(mi.id);
    expect(events.map((e) => e.event_type)).toContain("created");

    await markDelivered(mi.id);
    const afterDelivery = await getMoveInById(mi.id);
    expect(afterDelivery?.state).toBe("delivered");

    const { data: pools } = await supabaseAdmin()
      .from("tote_pools")
      .select("location,count")
      .eq("building_id", b.id);
    const pmap = Object.fromEntries(pools!.map((p) => [p.location, p.count]));
    expect(pmap.at_3pl).toBe(100 - 40);
    expect(pmap.out_with_tenant).toBe(40);

    await markReturned(mi.id);
    const afterReturn = await getMoveInById(mi.id);
    expect(afterReturn?.state).toBe("returned");
    const { data: pools2 } = await supabaseAdmin()
      .from("tote_pools")
      .select("location,count")
      .eq("building_id", b.id);
    const p2 = Object.fromEntries(pools2!.map((p) => [p.location, p.count]));
    expect(p2.out_with_tenant).toBe(0);
    expect(p2.in_building).toBe(40);

    events = await listMoveInEvents(mi.id);
    const types = events.map((e) => e.event_type);
    expect(types).toEqual(expect.arrayContaining(["created", "delivered", "returned"]));
  });
});
```

- [ ] **Step 2: Implement `lib/db/repos/move-ins.ts`**

```typescript
import { supabaseAdmin } from "@/lib/db/client";
import { totesFromBatches } from "@/lib/domain/batches";
import { nextState } from "@/lib/domain/move-in-state";

export type NewMoveIn = {
  building_id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone?: string | null;
  unit_label: string;
  unit_type: "studio" | "1br" | "2br" | "3br_plus" | "other";
  move_in_date: string; // YYYY-MM-DD
  batch_count: number;
  created_by_user_id?: string | null;
};

export async function createMoveIn(input: NewMoveIn) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("move_ins").insert(input).select("*").single();
  if (error) throw error;
  await db.from("move_in_events").insert({
    move_in_id: data.id,
    event_type: "created",
    actor_user_id: input.created_by_user_id ?? null,
  });
  return data;
}

export async function getMoveInById(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("move_ins").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function markDelivered(id: string, opts: { actor_user_id?: string | null } = {}) {
  const db = supabaseAdmin();
  const mi = await getMoveInById(id);
  if (!mi) throw new Error("move_in not found");
  nextState(mi.state as any, "delivered"); // throws on illegal

  const totes = totesFromBatches(mi.batch_count);

  // Decrement at_3pl
  const { error: e1 } = await db.rpc("decrement_pool", {
    p_building_id: mi.building_id,
    p_location: "at_3pl",
    p_amount: totes,
  });
  if (e1) throw e1;
  const { error: e2 } = await db.rpc("increment_pool", {
    p_building_id: mi.building_id,
    p_location: "out_with_tenant",
    p_amount: totes,
  });
  if (e2) throw e2;

  const { error } = await db
    .from("move_ins")
    .update({ state: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await db.from("move_in_events").insert({
    move_in_id: id,
    event_type: "delivered",
    actor_user_id: opts.actor_user_id ?? null,
  });
}

export async function markReturned(id: string, opts: { actor_user_id?: string | null } = {}) {
  const db = supabaseAdmin();
  const mi = await getMoveInById(id);
  if (!mi) throw new Error("move_in not found");
  nextState(mi.state as any, "returned");

  const totes = totesFromBatches(mi.batch_count);
  await db.rpc("decrement_pool", {
    p_building_id: mi.building_id,
    p_location: "out_with_tenant",
    p_amount: totes,
  });
  await db.rpc("increment_pool", {
    p_building_id: mi.building_id,
    p_location: "in_building",
    p_amount: totes,
  });
  await db
    .from("move_ins")
    .update({ state: "returned", returned_at: new Date().toISOString() })
    .eq("id", id);
  await db.from("move_in_events").insert({
    move_in_id: id,
    event_type: "returned",
    actor_user_id: opts.actor_user_id ?? null,
  });
}

export async function listMoveInEvents(moveInId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("move_in_events")
    .select("*")
    .eq("move_in_id", moveInId)
    .order("occurred_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 3: Add pool increment/decrement SQL functions**

Create `supabase/migrations/20260421000009_pool_rpcs.sql`:

```sql
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
```

- [ ] **Step 4: Reset, run, commit**

```bash
npm run db:reset
npm test
git add -A
git commit -m "feat(db): move-ins repo with delivery/return transitions"
```

---

### Task 4.5: Pools + losses + acquisitions repo

**Files:**

- Create: `lib/db/repos/inventory.ts`
- Test: `tests/db/inventory.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import {
  getPoolsForBuilding,
  reportLoss,
  listLosses,
  recordAcquisition,
  listAcquisitions,
} from "@/lib/db/repos/inventory";

async function reset() {
  const db = supabaseAdmin();
  await db.from("tote_losses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_acquisitions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("tote_pools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

describe("inventory repo", () => {
  beforeEach(reset);
  it("report loss + list", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    await reportLoss({ building_id: b.id, count: 3, reason: "damaged" });
    const losses = await listLosses(b.id);
    expect(losses).toHaveLength(1);
    expect(losses[0].count).toBe(3);
  });
  it("acquisition increments in_building pool", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    await recordAcquisition({ building_id: b.id, count: 200, acquisition_type: "initial" });
    const pools = await getPoolsForBuilding(b.id);
    expect(pools.in_building).toBe(200);
    const acqs = await listAcquisitions(b.id);
    expect(acqs).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Implement `lib/db/repos/inventory.ts`**

```typescript
import { supabaseAdmin } from "@/lib/db/client";

export async function getPoolsForBuilding(buildingId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tote_pools")
    .select("location,count")
    .eq("building_id", buildingId);
  if (error) throw error;
  const out = { in_building: 0, at_3pl: 0, out_with_tenant: 0 };
  for (const row of data ?? []) (out as any)[row.location] = row.count;
  return out;
}

export async function reportLoss(input: {
  building_id: string;
  count: number;
  reason: "lost" | "damaged" | "decommissioned";
  reported_by_user_id?: string | null;
  notes?: string | null;
}) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("tote_losses").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function listLosses(buildingId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tote_losses")
    .select("*")
    .eq("building_id", buildingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function recordAcquisition(input: {
  building_id: string;
  count: number;
  acquisition_type: "initial" | "reorder";
  notes?: string | null;
}) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("tote_acquisitions").insert(input).select("*").single();
  if (error) throw error;
  await db.rpc("increment_pool", {
    p_building_id: input.building_id,
    p_location: "in_building",
    p_amount: input.count,
  });
  return data;
}

export async function listAcquisitions(buildingId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tote_acquisitions")
    .select("*")
    .eq("building_id", buildingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 3: Commit**

```bash
npm test && git add -A && git commit -m "feat(db): inventory repo (pools/losses/acquisitions)"
```

---

### Task 4.6: Cost lines + invoices repo

**Files:**

- Create: `lib/db/repos/billing.ts`
- Test: `tests/db/billing.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import {
  recordCostLineItem,
  listLineItemsForBuilding,
  billingPeriodFromDate,
} from "@/lib/db/repos/billing";

async function reset() {
  const db = supabaseAdmin();
  await db.from("cost_line_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

describe("billing repo", () => {
  beforeEach(reset);

  it("billingPeriodFromDate returns first-of-month", () => {
    expect(billingPeriodFromDate("2026-04-15")).toBe("2026-04-01");
  });

  it("record + list cost line items", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    await recordCostLineItem({
      building_id: b.id,
      category: "delivery",
      passthrough_cents: 5000,
      markup_cents: 500,
      incurred_on: "2026-04-15",
    });
    const lines = await listLineItemsForBuilding(b.id, "2026-04-01");
    expect(lines).toHaveLength(1);
    expect(lines[0].total_cents).toBe(5500);
  });
});
```

- [ ] **Step 2: Implement `lib/db/repos/billing.ts`**

```typescript
import { supabaseAdmin } from "@/lib/db/client";

export function billingPeriodFromDate(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export async function recordCostLineItem(input: {
  building_id: string;
  move_in_id?: string | null;
  category: "delivery" | "pickup" | "warehousing" | "management_fee" | "subscription";
  passthrough_cents: number;
  markup_cents: number;
  incurred_on: string; // YYYY-MM-DD
  entered_by_user_id?: string | null;
}) {
  const db = supabaseAdmin();
  const billing_period = billingPeriodFromDate(input.incurred_on);
  const { data, error } = await db
    .from("cost_line_items")
    .insert({ ...input, billing_period })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listLineItemsForBuilding(buildingId: string, billingPeriod: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("cost_line_items")
    .select("*")
    .eq("building_id", buildingId)
    .eq("billing_period", billingPeriod)
    .order("incurred_on", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listInvoicesForBuilding(buildingId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("invoices")
    .select("*")
    .eq("building_id", buildingId)
    .order("billing_period", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 3: Commit**

```bash
npm test && git add -A && git commit -m "feat(db): billing repo (line items, invoices)"
```

---

### Task 4.7: RLS integration test

Verifies that a `pm_billing_admin` JWT cannot read another building's data, and a `company_admin` can read all of their company's buildings but not another company's.

**Files:**

- Create: `tests/db/rls.test.ts`, `tests/helpers/jwt.ts`

- [ ] **Step 1: Create JWT helper**

```typescript
// tests/helpers/jwt.ts
import { createClient } from "@supabase/supabase-js";

export function anonClientWithJwt(jwt: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
}

export async function signInAs(email: string, password: string): Promise<string> {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session!.access_token;
}
```

- [ ] **Step 2: Write the RLS test**

```typescript
// tests/db/rls.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";
import { anonClientWithJwt, signInAs } from "@/tests/helpers/jwt";

async function reset() {
  const db = supabaseAdmin();
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { data } = await db.auth.admin.listUsers();
  for (const u of data?.users ?? []) await db.auth.admin.deleteUser(u.id);
}

async function createUserWithPassword(
  email: string,
  password: string,
  row: { role: string; company_id: string | null; building_id: string | null },
) {
  const db = supabaseAdmin();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  await db.from("users").insert({
    id: data.user!.id,
    email,
    display_name: email,
    role: row.role as any,
    company_id: row.company_id,
    building_id: row.building_id,
  });
  return data.user!.id;
}

describe("RLS policies", () => {
  beforeAll(reset);

  it("pm_billing_admin only sees their own building", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b1 = await createBuilding({ company_id: c.id, name: "One", address: "x" });
    const b2 = await createBuilding({ company_id: c.id, name: "Two", address: "y" });

    await createUserWithPassword("pm@example.com", "password123!", {
      role: "pm_billing_admin",
      company_id: c.id,
      building_id: b1.id,
    });

    const jwt = await signInAs("pm@example.com", "password123!");
    const client = anonClientWithJwt(jwt);

    const { data } = await client.from("buildings").select("id");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(b1.id);
    expect(ids).not.toContain(b2.id);
  });

  it("company_admin sees all buildings in company but not another company's", async () => {
    const c1 = await createCompany({ name: "C1", slug: "c1" });
    const c2 = await createCompany({ name: "C2", slug: "c2" });
    const b1 = await createBuilding({ company_id: c1.id, name: "C1B1", address: "x" });
    const b2 = await createBuilding({ company_id: c2.id, name: "C2B1", address: "x" });

    await createUserWithPassword("co@example.com", "password123!", {
      role: "company_admin",
      company_id: c1.id,
      building_id: null,
    });

    const jwt = await signInAs("co@example.com", "password123!");
    const client = anonClientWithJwt(jwt);

    const { data } = await client.from("buildings").select("id");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(b1.id);
    expect(ids).not.toContain(b2.id);
  });
});
```

- [ ] **Step 3: Run, iterate if policies need fixing, commit**

```bash
npm test
git add -A
git commit -m "test(db): RLS isolation tests for PM and Company Admin"
```

---

## Phase 5 — Totes Admin portal: onboarding

### Task 5.1: Admin shell + nav

**Files:**

- Create: `app/admin/page.tsx`, `app/admin/_components/AdminNav.tsx`

- [ ] **Step 1: Create `app/admin/_components/AdminNav.tsx`**

```typescript
import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="bg-white border-b px-4 py-3 flex gap-6 text-sm">
      <Link href="/admin" className="font-semibold">Colorado Totes Admin</Link>
      <Link href="/admin/pending-deliveries">Deliveries</Link>
      <Link href="/admin/palletization">Palletization</Link>
      <Link href="/admin/companies">Companies</Link>
      <Link href="/admin/invoices">Invoices</Link>
      <Link href="/admin/warehousing">Warehousing</Link>
    </nav>
  );
}
```

- [ ] **Step 2: Update `app/admin/layout.tsx` to include nav**

Replace existing layout body to return:

```typescript
return (
  <div className="min-h-screen bg-neutral-50">
    <AdminNav />
    <div className="p-6 max-w-7xl mx-auto">{children}</div>
  </div>
);
```

Add the import at top: `import { AdminNav } from "./_components/AdminNav";`

- [ ] **Step 3: Create `app/admin/page.tsx`**

```typescript
export default function AdminDashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-neutral-600">
        Global view across all companies. Cards to come.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(admin): shell + nav"
```

---

### Task 5.2: Companies list + create

**Files:**

- Create: `app/admin/companies/page.tsx`, `app/admin/companies/new/page.tsx`, `app/admin/companies/_actions.ts`

- [ ] **Step 1: Create server action `app/admin/companies/_actions.ts`**

```typescript
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/guards";
import { createCompany } from "@/lib/db/repos/companies";

export async function createCompanyAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const overdueDays = Number(formData.get("overdue_days") ?? 14);
  if (!name || !slug) throw new Error("Name and slug required");

  const c = await createCompany({
    name,
    slug,
    settings: { overdue_days: overdueDays },
  });
  revalidatePath("/admin/companies");
  redirect(`/admin/companies/${c.id}`);
}
```

- [ ] **Step 2: Create list page `app/admin/companies/page.tsx`**

```typescript
import Link from "next/link";
import { supabaseAdmin } from "@/lib/db/client";

export default async function CompaniesPage() {
  const db = supabaseAdmin();
  const { data: companies } = await db
    .from("companies")
    .select("id,name,slug,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <Link
          href="/admin/companies/new"
          className="bg-black text-white rounded px-3 py-1.5 text-sm"
        >
          + New company
        </Link>
      </div>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Name</th>
            <th className="p-3">Slug</th>
          </tr>
        </thead>
        <tbody>
          {(companies ?? []).map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="p-3">
                <Link className="underline" href={`/admin/companies/${c.id}`}>
                  {c.name}
                </Link>
              </td>
              <td className="p-3 text-neutral-600">{c.slug}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Create new-company page `app/admin/companies/new/page.tsx`**

```typescript
import { createCompanyAction } from "../_actions";

export default function NewCompanyPage() {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">New company</h1>
      <form action={createCompanyAction} className="space-y-3">
        <label className="block">
          <span className="text-sm">Name</span>
          <input name="name" className="w-full border rounded px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm">Slug</span>
          <input name="slug" className="w-full border rounded px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm">Overdue threshold (days)</span>
          <input
            name="overdue_days"
            type="number"
            defaultValue={14}
            className="w-full border rounded px-3 py-2"
          />
        </label>
        <button className="bg-black text-white rounded px-3 py-2">Create</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Manual test + commit**

Run `npm run dev`. Sign up a user via `supabaseAdmin().auth.admin.createUser` (or directly in Supabase Studio) with `users.role = 'totes_admin'`, log in, navigate to `/admin/companies`, create a company. Confirm redirect to its detail page (next task covers the detail page).

```bash
git add -A
git commit -m "feat(admin): companies list + create"
```

---

### Task 5.3: Company detail + building create

**Files:**

- Create: `app/admin/companies/[id]/page.tsx`, `app/admin/companies/[id]/buildings/new/page.tsx`, extend `app/admin/companies/_actions.ts`

- [ ] **Step 1: Add createBuilding action to `_actions.ts`**

```typescript
export async function createBuildingAction(companyId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name || !address) throw new Error("Name and address required");

  const { createBuilding } = await import("@/lib/db/repos/buildings");
  const b = await createBuilding({ company_id: companyId, name, address });
  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`/admin/companies/${companyId}/buildings/${b.id}`);
}
```

- [ ] **Step 2: Create company detail page**

```typescript
// app/admin/companies/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/db/client";
import { getCompanyById } from "@/lib/db/repos/companies";
import { listBuildingsForCompany } from "@/lib/db/repos/buildings";

export default async function CompanyDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();
  const buildings = await listBuildingsForCompany(id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{company.name}</h1>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Buildings</h2>
          <Link
            href={`/admin/companies/${id}/buildings/new`}
            className="bg-black text-white rounded px-3 py-1.5 text-sm"
          >
            + Add building
          </Link>
        </div>
        <table className="w-full bg-white rounded shadow text-sm mt-2">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Address</th>
              <th className="p-3">Billing</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-3">
                  <Link className="underline" href={`/admin/companies/${id}/buildings/${b.id}`}>
                    {b.name}
                  </Link>
                </td>
                <td className="p-3 text-neutral-600">{b.address}</td>
                <td className="p-3">{b.billing_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Create new-building page**

```typescript
// app/admin/companies/[id]/buildings/new/page.tsx
import { createBuildingAction } from "../../../_actions";

export default async function NewBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">New building</h1>
      <form
        action={createBuildingAction.bind(null, id)}
        className="space-y-3"
      >
        <label className="block">
          <span className="text-sm">Name</span>
          <input name="name" className="w-full border rounded px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm">Address</span>
          <input name="address" className="w-full border rounded px-3 py-2" required />
        </label>
        <button className="bg-black text-white rounded px-3 py-2">Create</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(admin): company detail + create building"
```

---

### Task 5.4: Record initial acquisition from building detail

**Files:**

- Create: `app/admin/companies/[id]/buildings/[bid]/page.tsx`, extend `_actions.ts`

- [ ] **Step 1: Add acquisition action**

```typescript
// append to app/admin/companies/_actions.ts
export async function recordAcquisitionAction(
  companyId: string,
  buildingId: string,
  formData: FormData,
) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);
  const count = Number(formData.get("count"));
  const type = String(formData.get("type")) as "initial" | "reorder";
  if (!count || count <= 0) throw new Error("Count required");
  const { recordAcquisition } = await import("@/lib/db/repos/inventory");
  await recordAcquisition({
    building_id: buildingId,
    count,
    acquisition_type: type,
  });
  revalidatePath(`/admin/companies/${companyId}/buildings/${buildingId}`);
}
```

- [ ] **Step 2: Create building detail page**

```typescript
// app/admin/companies/[id]/buildings/[bid]/page.tsx
import { notFound } from "next/navigation";
import { getBuildingById } from "@/lib/db/repos/buildings";
import {
  getPoolsForBuilding,
  listAcquisitions,
  listLosses,
} from "@/lib/db/repos/inventory";
import { recordAcquisitionAction } from "../../../../_actions";

export default async function BuildingDetail({
  params,
}: {
  params: Promise<{ id: string; bid: string }>;
}) {
  const { id, bid } = await params;
  const building = await getBuildingById(bid);
  if (!building) notFound();
  const pools = await getPoolsForBuilding(bid);
  const acqs = await listAcquisitions(bid);
  const losses = await listLosses(bid);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{building.name}</h1>
      <p className="text-neutral-600">{building.address}</p>

      <section className="grid grid-cols-4 gap-4">
        <Stat label="In building" value={pools.in_building} />
        <Stat label="At 3PL" value={pools.at_3pl} />
        <Stat label="Out with tenants" value={pools.out_with_tenant} />
        <Stat label="Lost / damaged" value={losses.reduce((s, l) => s + l.count, 0)} />
      </section>

      <section className="bg-white rounded shadow p-4 max-w-md">
        <h2 className="font-semibold mb-2">Record acquisition</h2>
        <form
          action={recordAcquisitionAction.bind(null, id, bid)}
          className="space-y-3"
        >
          <label className="block">
            <span className="text-sm">Count</span>
            <input
              name="count"
              type="number"
              className="w-full border rounded px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm">Type</span>
            <select name="type" className="w-full border rounded px-3 py-2">
              <option value="initial">Initial</option>
              <option value="reorder">Reorder</option>
            </select>
          </label>
          <button className="bg-black text-white rounded px-3 py-2">Record</button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold">Acquisition history</h2>
        <ul className="mt-2 text-sm bg-white rounded shadow divide-y">
          {acqs.map((a) => (
            <li key={a.id} className="p-3 flex justify-between">
              <span>
                {a.acquisition_type}: {a.count}
              </span>
              <span className="text-neutral-500">
                {new Date(a.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(admin): building detail with acquisition logging"
```

---

### Task 5.5: Invite first user to a company

**Files:**

- Create: `app/admin/companies/[id]/users/page.tsx`, extend `_actions.ts`

- [ ] **Step 1: Add invite action**

```typescript
export async function inviteUserAction(companyId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);

  const email = String(formData.get("email")).trim().toLowerCase();
  const role = String(formData.get("role")) as "pm_billing_admin" | "company_admin";
  const buildingId = String(formData.get("building_id") ?? "") || null;
  const { inviteUser } = await import("@/lib/db/repos/users");
  await inviteUser({
    email,
    role,
    company_id: companyId,
    building_id: role === "pm_billing_admin" ? buildingId : null,
    display_name: email,
  });
  revalidatePath(`/admin/companies/${companyId}/users`);
}
```

- [ ] **Step 2: Create users page**

```typescript
// app/admin/companies/[id]/users/page.tsx
import { listBuildingsForCompany } from "@/lib/db/repos/buildings";
import { listUsersForCompany } from "@/lib/db/repos/users";
import { inviteUserAction } from "../../_actions";

export default async function CompanyUsers({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const users = await listUsersForCompany(id);
  const buildings = await listBuildingsForCompany(id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <section className="bg-white rounded shadow p-4 max-w-md">
        <h2 className="font-semibold">Invite user</h2>
        <form
          action={inviteUserAction.bind(null, id)}
          className="space-y-3 mt-2"
        >
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              name="email"
              type="email"
              className="w-full border rounded px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm">Role</span>
            <select name="role" className="w-full border rounded px-3 py-2">
              <option value="company_admin">Company Admin</option>
              <option value="pm_billing_admin">PM / Billing Admin</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm">Building (PMs only)</span>
            <select name="building_id" className="w-full border rounded px-3 py-2">
              <option value="">—</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <button className="bg-black text-white rounded px-3 py-2">Send invite</button>
        </form>
      </section>

      <section>
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Building</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.building_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(admin): invite users to company/building"
```

---

## Phase 6 — PM portal shell + Stripe card setup

### Task 6.1: PM portal shell

**Files:**

- Create: `app/(portal)/app/page.tsx`, `app/(portal)/_components/PortalNav.tsx`

- [ ] **Step 1: Create nav**

```typescript
// app/(portal)/_components/PortalNav.tsx
import Link from "next/link";

export function PortalNav({ buildingName }: { buildingName: string }) {
  return (
    <nav className="bg-white border-b px-4 py-3 flex gap-6 text-sm">
      <Link href="/app" className="font-semibold">{buildingName}</Link>
      <Link href="/app/move-ins">Move-ins</Link>
      <Link href="/app/inventory">Inventory</Link>
      <Link href="/app/costs">Costs</Link>
      <Link href="/app/invoices">Invoices</Link>
      <Link href="/app/billing">Billing</Link>
    </nav>
  );
}
```

- [ ] **Step 2: Create dashboard**

```typescript
// app/(portal)/app/page.tsx
import { currentUser } from "@/lib/auth/current-user";
import { supabaseAdmin } from "@/lib/db/client";
import { getPoolsForBuilding } from "@/lib/db/repos/inventory";
import { PortalNav } from "../_components/PortalNav";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.buildingId) {
    // Company admin without scope — send to company rollup (stubbed)
    return <div>Company rollup pending</div>;
  }
  const db = supabaseAdmin();
  const { data: building } = await db
    .from("buildings")
    .select("*")
    .eq("id", user.buildingId)
    .single();
  const pools = await getPoolsForBuilding(user.buildingId);

  return (
    <>
      <PortalNav buildingName={building?.name ?? "Building"} />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {building?.billing_status === "setup_pending" && (
          <div className="bg-yellow-100 border border-yellow-400 p-3 rounded text-sm">
            Add a payment method to activate billing.
            <a href="/app/billing" className="underline ml-2">Set it up →</a>
          </div>
        )}
        {building?.billing_status === "delinquent" && (
          <div className="bg-red-100 border border-red-400 p-3 rounded text-sm">
            Your most recent invoice failed to charge. Please update your payment method.
            <a href="/app/billing" className="underline ml-2">Fix it →</a>
          </div>
        )}
        <div className="grid grid-cols-4 gap-4">
          <Stat label="In building" value={pools.in_building} />
          <Stat label="At 3PL" value={pools.at_3pl} />
          <Stat label="Out" value={pools.out_with_tenant} />
          <Stat label="Total owned"
            value={pools.in_building + pools.at_3pl + pools.out_with_tenant}
          />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(portal): PM dashboard shell with inventory stats + banners"
```

---

### Task 6.2: Stripe integration stub + Customer creation

**Files:**

- Create: `lib/billing/stripe.ts`, `lib/billing/customers.ts`
- Test: `tests/billing/customers.test.ts`

- [ ] **Step 1: Install Stripe**

```bash
npm i stripe @stripe/stripe-js @stripe/react-stripe-js
```

- [ ] **Step 2: Create `lib/billing/stripe.ts`**

```typescript
import Stripe from "stripe";
import { env } from "@/lib/env";

let _client: Stripe | null = null;
export function stripe(): Stripe {
  if (!_client) {
    _client = new Stripe(env().stripeSecretKey, { apiVersion: "2024-12-18.acacia" });
  }
  return _client;
}
```

- [ ] **Step 3: Create `lib/billing/customers.ts`**

```typescript
import { stripe } from "./stripe";
import { supabaseAdmin } from "@/lib/db/client";

export async function ensureStripeCustomerForBuilding(buildingId: string): Promise<string> {
  const db = supabaseAdmin();
  const { data: b, error } = await db
    .from("buildings")
    .select("id,name,stripe_customer_id")
    .eq("id", buildingId)
    .single();
  if (error) throw error;
  if (b.stripe_customer_id) return b.stripe_customer_id;

  const customer = await stripe().customers.create({
    name: b.name,
    metadata: { building_id: b.id },
  });
  await db.from("buildings").update({ stripe_customer_id: customer.id }).eq("id", buildingId);
  return customer.id;
}

export async function createSetupIntent(buildingId: string) {
  const customerId = await ensureStripeCustomerForBuilding(buildingId);
  return stripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });
}
```

- [ ] **Step 4: Write test (mocked Stripe)**

```typescript
// tests/billing/customers.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/billing/stripe", () => ({
  stripe: () => ({
    customers: {
      create: vi.fn().mockResolvedValue({ id: "cus_test_123" }),
    },
    setupIntents: {
      create: vi.fn().mockResolvedValue({ id: "seti_test_123", client_secret: "cs_x" }),
    },
  }),
}));

import { ensureStripeCustomerForBuilding, createSetupIntent } from "@/lib/billing/customers";
import { supabaseAdmin } from "@/lib/db/client";
import { createCompany } from "@/lib/db/repos/companies";
import { createBuilding } from "@/lib/db/repos/buildings";

beforeEach(async () => {
  const db = supabaseAdmin();
  await db.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
});

describe("stripe customer provisioning", () => {
  it("creates and caches a Stripe Customer", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    const id = await ensureStripeCustomerForBuilding(b.id);
    expect(id).toBe("cus_test_123");
    const again = await ensureStripeCustomerForBuilding(b.id);
    expect(again).toBe("cus_test_123");
  });
  it("creates a SetupIntent", async () => {
    const c = await createCompany({ name: "A", slug: "a" });
    const b = await createBuilding({ company_id: c.id, name: "S", address: "x" });
    const si = await createSetupIntent(b.id);
    expect(si.client_secret).toBeDefined();
  });
});
```

- [ ] **Step 5: Run and commit**

```bash
npm test && git add -A && git commit -m "feat(billing): Stripe client + customer provisioning"
```

---

### Task 6.3: Billing page with Stripe Elements

**Files:**

- Create: `app/(portal)/app/billing/page.tsx`, `app/(portal)/app/billing/_CardSetupForm.tsx`, `app/api/billing/setup-intent/route.ts`

- [ ] **Step 1: Create the setup-intent route**

```typescript
// app/api/billing/setup-intent/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/current-user";
import { createSetupIntent } from "@/lib/billing/customers";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "pm_billing_admin" && user.role !== "company_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!user.buildingId) {
    return NextResponse.json({ error: "no building context" }, { status: 400 });
  }
  const si = await createSetupIntent(user.buildingId);
  return NextResponse.json({ clientSecret: si.client_secret });
}
```

- [ ] **Step 2: Create the form component**

```typescript
// app/(portal)/app/billing/_CardSetupForm.tsx
"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export function CardSetupForm() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/setup-intent", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setClientSecret(d.clientSecret));
  }, []);

  if (!clientSecret) return <p>Loading…</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <InnerForm />
    </Elements>
  );
}

function InnerForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErr(null);
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/app/billing?setup=complete`,
      },
    });
    if (error) setErr(error.message ?? "Setup failed");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <PaymentElement />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button
        className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        disabled={!stripe || loading}
      >
        {loading ? "Saving…" : "Save payment method"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create the page**

```typescript
// app/(portal)/app/billing/page.tsx
import { CardSetupForm } from "./_CardSetupForm";

export default function BillingPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Payment method</h1>
      <p className="text-neutral-600">
        Your monthly invoices (subscription + logistics pass-through + management fee)
        will be charged to this card.
      </p>
      <CardSetupForm />
    </div>
  );
}
```

- [ ] **Step 4: Manual test**

Run `npm run dev`. Log in as a pm_billing_admin assigned to a building. Visit `/app/billing`. Confirm the Stripe Elements PaymentElement mounts. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP. Confirm redirect to `?setup=complete`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(portal): Stripe Elements card setup flow"
```

---

### Task 6.4: Stripe webhook handler — SetupIntent succeeded flips billing_status

**Files:**

- Create: `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Write the handler**

```typescript
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/db/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no sig" }, { status: 400 });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, env().stripeWebhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `webhook verify: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const db = supabaseAdmin();

  switch (event.type) {
    case "setup_intent.succeeded": {
      const si = event.data.object as Stripe.SetupIntent;
      const customerId = typeof si.customer === "string" ? si.customer : si.customer?.id;
      if (!customerId) break;
      const { data: building } = await db
        .from("buildings")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (building) {
        // Attach the PM as the default payment method on the customer
        const pm =
          typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
        if (pm) {
          await stripe().customers.update(customerId, {
            invoice_settings: { default_payment_method: pm },
          });
        }
        await db.from("buildings").update({ billing_status: "active" }).eq("id", building.id);
      }
      break;
    }
    case "invoice.paid": {
      const inv = event.data.object as Stripe.Invoice;
      await db
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("stripe_invoice_id", inv.id);
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (customerId) {
        await db
          .from("buildings")
          .update({ billing_status: "active" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      await db
        .from("invoices")
        .update({ status: "failed", failed_at: new Date().toISOString() })
        .eq("stripe_invoice_id", inv.id);
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (customerId) {
        await db
          .from("buildings")
          .update({ billing_status: "delinquent" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Manual test with Stripe CLI**

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copy the signing secret into .env.local as STRIPE_WEBHOOK_SECRET
stripe trigger setup_intent.succeeded
```

Verify the building's `billing_status` flips to `active` in the DB.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(billing): Stripe webhook handler (setup/paid/failed)"
```

---

## Phase 7 — Move-in flow (create → deliver → return)

### Task 7.1: Create-move-in form

**Files:**

- Create: `app/(portal)/app/move-ins/new/page.tsx`, `app/(portal)/app/move-ins/_actions.ts`

- [ ] **Step 1: Create action**

```typescript
// app/(portal)/app/move-ins/_actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth/current-user";
import { createMoveIn, markReturned } from "@/lib/db/repos/move-ins";

export async function createMoveInAction(formData: FormData) {
  const user = await currentUser();
  if (!user || !user.buildingId) redirect("/login");

  const mi = await createMoveIn({
    building_id: user.buildingId,
    tenant_name: String(formData.get("tenant_name")),
    tenant_email: String(formData.get("tenant_email")),
    tenant_phone: String(formData.get("tenant_phone") ?? "") || null,
    unit_label: String(formData.get("unit_label")),
    unit_type: String(formData.get("unit_type")) as any,
    move_in_date: String(formData.get("move_in_date")),
    batch_count: Number(formData.get("batch_count")),
    created_by_user_id: user.id,
  });
  revalidatePath("/app/move-ins");
  redirect(`/app/move-ins/${mi.id}`);
}

export async function markReturnedAction(moveInId: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  await markReturned(moveInId, { actor_user_id: user.id });
  revalidatePath(`/app/move-ins/${moveInId}`);
}
```

- [ ] **Step 2: Create the page with client-side batch recommendation**

```typescript
// app/(portal)/app/move-ins/new/page.tsx
"use client";

import { useState } from "react";
import { createMoveInAction } from "../_actions";

const DEFAULTS: Record<string, number> = {
  studio: 1, "1br": 2, "2br": 2, "3br_plus": 3, other: 1,
};

export default function NewMoveIn() {
  const [unitType, setUnitType] = useState("2br");
  const [batchCount, setBatchCount] = useState(DEFAULTS["2br"]);

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">New move-in</h1>
      <form action={createMoveInAction} className="space-y-3">
        <Input name="tenant_name" label="Tenant name" required />
        <Input name="tenant_email" label="Tenant email" type="email" required />
        <Input name="tenant_phone" label="Tenant phone (optional)" />
        <Input name="unit_label" label="Unit label" required />
        <label className="block">
          <span className="text-sm">Unit type</span>
          <select
            name="unit_type"
            value={unitType}
            onChange={(e) => {
              setUnitType(e.target.value);
              setBatchCount(DEFAULTS[e.target.value]);
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="studio">Studio</option>
            <option value="1br">1 bedroom</option>
            <option value="2br">2 bedroom</option>
            <option value="3br_plus">3+ bedroom</option>
            <option value="other">Other</option>
          </select>
        </label>
        <Input
          name="move_in_date"
          label="Move-in date"
          type="date"
          required
        />
        <label className="block">
          <span className="text-sm">Batches (20 totes each)</span>
          <input
            name="batch_count"
            type="number"
            min={1}
            value={batchCount}
            onChange={(e) => setBatchCount(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Recommended: {DEFAULTS[unitType]} batch(es) for this unit type.
          </p>
        </label>
        <button className="bg-black text-white rounded px-3 py-2">Create</button>
      </form>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input className="w-full border rounded px-3 py-2" {...rest} />
    </label>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(portal): create move-in form"
```

---

### Task 7.2: Move-ins list + detail

**Files:**

- Create: `app/(portal)/app/move-ins/page.tsx`, `app/(portal)/app/move-ins/[id]/page.tsx`

- [ ] **Step 1: Create list**

```typescript
// app/(portal)/app/move-ins/page.tsx
import Link from "next/link";
import { currentUser } from "@/lib/auth/current-user";
import { supabaseAdmin } from "@/lib/db/client";
import { redirect } from "next/navigation";

export default async function MoveInsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const user = await currentUser();
  if (!user || !user.buildingId) redirect("/login");
  const { state } = await searchParams;

  let q = supabaseAdmin()
    .from("move_ins")
    .select("id,tenant_name,unit_label,move_in_date,batch_count,state")
    .eq("building_id", user.buildingId)
    .order("move_in_date", { ascending: false });
  if (state) q = q.eq("state", state as any);
  const { data } = await q;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Move-ins</h1>
        <Link className="bg-black text-white rounded px-3 py-1.5 text-sm" href="/app/move-ins/new">
          + New
        </Link>
      </div>
      <div className="flex gap-3 text-sm">
        {["all", "pending_delivery", "delivered", "returned", "cancelled"].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/app/move-ins" : `/app/move-ins?state=${s}`}
            className="underline"
          >
            {s}
          </Link>
        ))}
      </div>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Tenant</th>
            <th className="p-3">Unit</th>
            <th className="p-3">Move-in</th>
            <th className="p-3">Batches</th>
            <th className="p-3">State</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((m) => (
            <tr key={m.id} className="border-b last:border-0">
              <td className="p-3">
                <Link className="underline" href={`/app/move-ins/${m.id}`}>{m.tenant_name}</Link>
              </td>
              <td className="p-3">{m.unit_label}</td>
              <td className="p-3">{m.move_in_date}</td>
              <td className="p-3">{m.batch_count}</td>
              <td className="p-3">{m.state}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create detail**

```typescript
// app/(portal)/app/move-ins/[id]/page.tsx
import { notFound } from "next/navigation";
import { getMoveInById, listMoveInEvents } from "@/lib/db/repos/move-ins";
import { markReturnedAction } from "../_actions";

export default async function MoveInDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mi = await getMoveInById(id);
  if (!mi) notFound();
  const events = await listMoveInEvents(id);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">{mi.tenant_name}</h1>
      <dl className="bg-white rounded shadow p-4 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-neutral-500">Unit</dt>
        <dd>{mi.unit_label} ({mi.unit_type})</dd>
        <dt className="text-neutral-500">Email</dt>
        <dd>{mi.tenant_email}</dd>
        <dt className="text-neutral-500">Move-in date</dt>
        <dd>{mi.move_in_date}</dd>
        <dt className="text-neutral-500">Batches</dt>
        <dd>{mi.batch_count} ({mi.batch_count * 20} totes)</dd>
        <dt className="text-neutral-500">State</dt>
        <dd>{mi.state}</dd>
      </dl>

      {mi.state === "delivered" && (
        <form action={markReturnedAction.bind(null, id)}>
          <button className="bg-black text-white rounded px-3 py-2">
            Mark returned
          </button>
        </form>
      )}

      <section>
        <h2 className="font-semibold">Activity</h2>
        <ul className="mt-2 bg-white rounded shadow divide-y text-sm">
          {events.map((e) => (
            <li key={e.id} className="p-3 flex justify-between">
              <span>{e.event_type}</span>
              <span className="text-neutral-500">
                {new Date(e.occurred_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(portal): move-ins list + detail with mark-returned"
```

---

### Task 7.3: Admin pending-deliveries queue with mark-delivered + cost entry

**Files:**

- Create: `app/admin/pending-deliveries/page.tsx`, `app/admin/pending-deliveries/_actions.ts`

- [ ] **Step 1: Create action**

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/guards";
import { markDelivered, getMoveInById } from "@/lib/db/repos/move-ins";
import { recordCostLineItem } from "@/lib/db/repos/billing";

export async function markDeliveredAction(moveInId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  requireRole(user, ["totes_admin"]);

  const passthrough = Math.round(Number(formData.get("passthrough")) * 100);
  const markup = Math.round(Number(formData.get("markup")) * 100);
  if (!passthrough && !markup) throw new Error("Enter passthrough or markup");

  const mi = await getMoveInById(moveInId);
  if (!mi) throw new Error("not found");

  await markDelivered(moveInId, { actor_user_id: user.id });
  await recordCostLineItem({
    building_id: mi.building_id,
    move_in_id: moveInId,
    category: "delivery",
    passthrough_cents: passthrough,
    markup_cents: markup,
    incurred_on: new Date().toISOString().slice(0, 10),
    entered_by_user_id: user.id,
  });
  revalidatePath("/admin/pending-deliveries");
}
```

- [ ] **Step 2: Create the queue page**

```typescript
// app/admin/pending-deliveries/page.tsx
import { supabaseAdmin } from "@/lib/db/client";
import { markDeliveredAction } from "./_actions";

export default async function PendingDeliveries() {
  const db = supabaseAdmin();
  const { data } = await db
    .from("move_ins")
    .select("id,tenant_name,unit_label,move_in_date,batch_count,buildings(name)")
    .eq("state", "pending_delivery")
    .order("move_in_date", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Pending deliveries</h1>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Building</th>
            <th className="p-3">Tenant</th>
            <th className="p-3">Unit</th>
            <th className="p-3">Date</th>
            <th className="p-3">Batches</th>
            <th className="p-3">Mark delivered + cost</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((m: any) => (
            <tr key={m.id} className="border-b last:border-0">
              <td className="p-3">{m.buildings?.name}</td>
              <td className="p-3">{m.tenant_name}</td>
              <td className="p-3">{m.unit_label}</td>
              <td className="p-3">{m.move_in_date}</td>
              <td className="p-3">{m.batch_count}</td>
              <td className="p-3">
                <form
                  action={markDeliveredAction.bind(null, m.id)}
                  className="flex items-center gap-2"
                >
                  <input
                    name="passthrough"
                    type="number"
                    step="0.01"
                    placeholder="Passthrough $"
                    className="border rounded px-2 py-1 w-28"
                    required
                  />
                  <input
                    name="markup"
                    type="number"
                    step="0.01"
                    placeholder="Markup $"
                    className="border rounded px-2 py-1 w-24"
                    defaultValue="0"
                  />
                  <button className="bg-black text-white rounded px-3 py-1">
                    Mark delivered
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(admin): pending-deliveries queue with mark-delivered + cost entry"
```

---

## Phase 8 — Tenant email sequence + cron

### Task 8.1: Queue rows when move-in is created and when delivered

**Files:**

- Modify: `lib/db/repos/move-ins.ts` (queue emails inside createMoveIn and markDelivered)

- [ ] **Step 1: Add email-queue writes to `createMoveIn`**

Inside `createMoveIn`, after the event insert, add:

```typescript
await db.from("tenant_emails").insert({
  move_in_id: data.id,
  kind: "scheduled",
  scheduled_for: new Date().toISOString(),
});
```

- [ ] **Step 2: Add email-queue writes to `markDelivered`**

After the `delivered` event insert, add:

```typescript
const deliveredAt = new Date();
const miDate = new Date(mi.move_in_date + "T00:00:00Z");
const reminderAt = new Date(
  Math.max(deliveredAt.getTime(), miDate.getTime()) + 48 * 60 * 60 * 1000,
);
await db.from("tenant_emails").insert([
  {
    move_in_id: id,
    kind: "delivered",
    scheduled_for: deliveredAt.toISOString(),
  },
  {
    move_in_id: id,
    kind: "reminder_48h",
    scheduled_for: reminderAt.toISOString(),
  },
]);
```

- [ ] **Step 3: Update existing move-ins test to assert email rows exist**

Add to the existing test:

```typescript
const { data: emails } = await supabaseAdmin()
  .from("tenant_emails")
  .select("kind")
  .eq("move_in_id", mi.id);
expect(emails?.map((e) => e.kind)).toEqual(
  expect.arrayContaining(["scheduled", "delivered", "reminder_48h"]),
);
```

- [ ] **Step 4: Run, commit**

```bash
npm test && git add -A && git commit -m "feat(email): queue tenant emails on move-in create/deliver"
```

---

### Task 8.2: React Email templates

**Files:**

- Create: `lib/email/templates/Scheduled.tsx`, `lib/email/templates/Delivered.tsx`, `lib/email/templates/Reminder.tsx`

- [ ] **Step 1: Install React Email**

```bash
npm i react-email @react-email/components resend
```

- [ ] **Step 2: Create the Scheduled template**

```typescript
// lib/email/templates/Scheduled.tsx
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";

export type ScheduledProps = {
  tenantName: string;
  buildingName: string;
  moveInDate: string;
  batchCount: number;
  logoUrl?: string;
};

export function Scheduled(p: ScheduledProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {p.buildingName} move-in totes are scheduled</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", color: "#111" }}>
        <Container style={{ padding: 24, maxWidth: 560 }}>
          {p.logoUrl && <img src={p.logoUrl} alt={p.buildingName} height={48} />}
          <Heading>Welcome, {p.tenantName}.</Heading>
          <Section>
            <Text>
              On behalf of {p.buildingName}, we are pleased to confirm that
              {" "}{p.batchCount * 20} reusable moving totes have been scheduled
              for delivery in the days leading up to your move-in on{" "}
              <strong>{p.moveInDate}</strong>.
            </Text>
            <Text>
              The totes are provided as a complimentary courtesy to help make
              your move easier. You will receive a second email once the
              totes are delivered, with instructions for use and return.
            </Text>
            <Text>Sincerely,<br />The {p.buildingName} team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 3: Create Delivered and Reminder templates**

Follow the same pattern. `Delivered` includes return location + contact from `tenant_contact_info`. `Reminder` is the 48-hour welcome + drop-off location message.

```typescript
// lib/email/templates/Delivered.tsx
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";

export type DeliveredProps = {
  tenantName: string;
  buildingName: string;
  dropOffLocation: string;
  contactEmail: string;
  logoUrl?: string;
};

export function Delivered(p: DeliveredProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {p.buildingName} totes have been delivered</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", color: "#111" }}>
        <Container style={{ padding: 24, maxWidth: 560 }}>
          {p.logoUrl && <img src={p.logoUrl} alt={p.buildingName} height={48} />}
          <Heading>Your totes have arrived.</Heading>
          <Section>
            <Text>Dear {p.tenantName},</Text>
            <Text>
              Your reusable moving totes from {p.buildingName} have been
              delivered. Please use them to pack your belongings as you
              prepare for your move.
            </Text>
            <Text>
              After you are settled, return the empty totes to:{" "}
              <strong>{p.dropOffLocation}</strong>. You may reach us at{" "}
              <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a> with
              any questions.
            </Text>
            <Text>
              You will receive one additional reminder approximately 48 hours
              after your move-in date with the return details.
            </Text>
            <Text>Sincerely,<br />The {p.buildingName} team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

```typescript
// lib/email/templates/Reminder.tsx
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";

export type ReminderProps = {
  tenantName: string;
  buildingName: string;
  dropOffLocation: string;
  contactEmail: string;
  logoUrl?: string;
};

export function Reminder(p: ReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {p.buildingName} — returning your totes</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", color: "#111" }}>
        <Container style={{ padding: 24, maxWidth: 560 }}>
          {p.logoUrl && <img src={p.logoUrl} alt={p.buildingName} height={48} />}
          <Heading>Welcome home.</Heading>
          <Section>
            <Text>Dear {p.tenantName},</Text>
            <Text>
              We hope your move to {p.buildingName} has gone smoothly. When
              you are finished unpacking, please return your moving totes to:{" "}
              <strong>{p.dropOffLocation}</strong>.
            </Text>
            <Text>
              If you have any questions, please contact{" "}
              <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>.
            </Text>
            <Text>Sincerely,<br />The {p.buildingName} team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(email): React Email templates for tenant sequence"
```

---

### Task 8.3: Resend sender + cron endpoint

**Files:**

- Create: `lib/email/send.ts`, `app/api/cron/send-tenant-emails/route.ts`

- [ ] **Step 1: Create sender**

```typescript
// lib/email/send.ts
import { Resend } from "resend";
import { render } from "@react-email/components";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/db/client";
import { Scheduled } from "./templates/Scheduled";
import { Delivered } from "./templates/Delivered";
import { Reminder } from "./templates/Reminder";

let _resend: Resend | null = null;
function resend() {
  if (!_resend) _resend = new Resend(env().resendApiKey);
  return _resend;
}

async function publicLogoUrl(storagePath: string | null): Promise<string | undefined> {
  if (!storagePath) return undefined;
  const db = supabaseAdmin();
  const { data } = db.storage.from("logos").getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function sendTenantEmail(rowId: string) {
  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from("tenant_emails")
    .select("id,kind,move_in_id")
    .eq("id", rowId)
    .single();
  if (error) throw error;

  const { data: mi } = await db
    .from("move_ins")
    .select(
      "tenant_name,tenant_email,move_in_date,batch_count,buildings(name,logo_storage_path,tenant_contact_info)",
    )
    .eq("id", row.move_in_id)
    .single();
  if (!mi) throw new Error("move_in not found");

  const b = (mi.buildings as any) ?? {};
  const logoUrl = await publicLogoUrl(b.logo_storage_path);
  const dropOff = b.tenant_contact_info?.drop_off_location ?? "the building lobby";
  const contact = b.tenant_contact_info?.contact_email ?? "concierge@building.com";

  let subject: string;
  let html: string;
  let eventType: "email_scheduled_sent" | "email_delivered_sent" | "email_reminder_sent";

  switch (row.kind) {
    case "scheduled":
      subject = `Your ${b.name} move-in totes are scheduled`;
      html = await render(
        Scheduled({
          tenantName: mi.tenant_name,
          buildingName: b.name,
          moveInDate: mi.move_in_date,
          batchCount: mi.batch_count,
          logoUrl,
        }),
      );
      eventType = "email_scheduled_sent";
      break;
    case "delivered":
      subject = `Your ${b.name} totes have been delivered`;
      html = await render(
        Delivered({
          tenantName: mi.tenant_name,
          buildingName: b.name,
          dropOffLocation: dropOff,
          contactEmail: contact,
          logoUrl,
        }),
      );
      eventType = "email_delivered_sent";
      break;
    case "reminder_48h":
      subject = `Welcome to ${b.name} — returning your totes`;
      html = await render(
        Reminder({
          tenantName: mi.tenant_name,
          buildingName: b.name,
          dropOffLocation: dropOff,
          contactEmail: contact,
          logoUrl,
        }),
      );
      eventType = "email_reminder_sent";
      break;
  }

  const sent = await resend().emails.send({
    from: env().resendFromAddress,
    to: mi.tenant_email,
    subject,
    html,
  });

  if (sent.error) {
    await db.from("tenant_emails").update({ status: "failed" }).eq("id", row.id);
    throw sent.error;
  }

  await db
    .from("tenant_emails")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      resend_message_id: sent.data?.id ?? null,
    })
    .eq("id", row.id);

  await db.from("move_in_events").insert({
    move_in_id: row.move_in_id,
    event_type: eventType,
    payload: { resend_message_id: sent.data?.id ?? null },
  });
}
```

- [ ] **Step 2: Create cron route**

```typescript
// app/api/cron/send-tenant-emails/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";
import { env } from "@/lib/env";
import { sendTenantEmail } from "@/lib/email/send";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${env().cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = supabaseAdmin();
  const { data } = await db
    .from("tenant_emails")
    .select("id")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(100);

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const row of data ?? []) {
    try {
      await sendTenantEmail(row.id);
      results.push({ id: row.id, ok: true });
    } catch (e) {
      results.push({ id: row.id, ok: false, error: (e as Error).message });
    }
  }
  return NextResponse.json({ processed: results.length, results });
}
```

- [ ] **Step 3: Register cron in `vercel.json`**

Create `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/send-tenant-emails", "schedule": "*/5 * * * *" }]
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(email): Resend sender + cron endpoint for tenant email queue"
```

---

## Phase 9+ roadmap (to be planned after Phase 8 ships)

After Phase 8 we have a fully functional vertical slice: an admin can onboard a company + building, invite a PM, the PM can add a card, create a move-in, admin can mark delivered with cost, PM can mark returned, and all three tenant emails fire. That's a demoable MVP.

The remaining phases are logically straightforward follow-ons and should be planned as a second implementation plan document once Phase 8 lands, so scope can be adjusted based on what we learn.

- **Phase 9 — Inventory/loss UI + reporting:** PM-side inventory screen, loss reporting form, acquisition history.
- **Phase 10 — Palletization queue + pickup flow:** admin queue fed by `isReadyForPalletization`, pickup cost entry modal, pool transfer.
- **Phase 11 — Monthly invoice cron + costs/invoices screens:** cron that creates Stripe Invoices from line items, PM `/app/costs` and `/app/invoices` screens, admin `/admin/warehousing` batch entry + `/admin/invoices` rollup.
- **Phase 12 — Company Admin portal:** scope picker component, rollup dashboard, company users management, company settings page.
- **Phase 13 — Dashboards + flags:** upcoming move-ins widget, overdue flags, low-stock warnings, dashboard metric cards across all three portals.
- **Phase 14 — Public surfaces:** landing page, invite-accept flow, password reset.
- **Phase 15 — E2E + deploy:** Playwright golden flows, staging + prod Supabase projects, Vercel production deploy, Stripe live mode.

---

## Self-Review Notes (completed)

- Spec coverage through Phase 8: scaffold ✓, schema ✓ (tables, views, RLS), auth ✓, domain ✓ (batches/state/palletization/costs/overdue/inventory), repos ✓ (companies/buildings/users/move-ins/inventory/billing), admin onboarding ✓, PM shell + Stripe card setup ✓, move-in lifecycle ✓, email sequence + cron ✓.
- Spec items deferred to Phase 9+: inventory/loss PM UI, palletization pickup, monthly invoice cron, company admin scope picker, dashboard flags, public surfaces, E2E tests, prod deploy.
- No placeholders, TBDs, or unresolved references in Phase 0–8 tasks.
- Type consistency verified: `MoveInState`, `UnitType`, `CostCategory`, `Pools` shape, and repo function signatures all match across tasks.
- Known dependency between tasks 7.3 (admin mark-delivered) and 8.1 (email queue writes inside `markDelivered`): 7.3 happens first; 8.1 modifies `markDelivered` to queue emails, which 7.3's server action benefits from once 8.1 lands.
