# Colorado Totes — V1 Design Spec

**Date:** 2026-04-21
**Status:** Draft for review
**Repo:** `semiagenticRob/colorado-totes`

## 1. Overview

Colorado Totes V1 is a B2B SaaS portal for multifamily property management companies in the Denver metro area. The product lets property managers offer branded reusable moving totes to incoming tenants as a move-in benefit, while Colorado Totes handles all physical logistics (tote production, 3PL coordination, delivery, pickup) as a bundled service.

The SaaS is the operational source of truth for tote inventory, move-in scheduling, tenant communications, cost accrual, and monthly billing. The physical services (tote manufacture, branding, initial delivery, ongoing 3PL coordination) are sold separately: a one-time per-building setup fee plus a recurring monthly SaaS subscription, with 3PL passthrough costs and a Colorado Totes management fee billed monthly via Stripe auto-charge.

## 2. Goals & Non-goals

### Goals
- Give property managers a single portal to schedule tenant move-in tote deliveries, track inventory, log returns, and view costs.
- Let Colorado Totes staff operate the 3PL relationship through one dashboard that aggregates across all customer buildings.
- Automate the tenant email sequence (scheduled, delivered, post-move-in reminder).
- Automate monthly billing: aggregate line items + subscription, create and auto-charge a Stripe invoice per building.
- Multi-tenant isolation enforced at the database layer (Postgres RLS) so application bugs cannot leak cross-company data.
- Architect for, but do not build: PMS integration, 3PL login/API, CSV bulk move-in upload, tenant-facing tracking page.

### Non-goals (V1)
- Per-tote serial tracking (QR / barcode). Totes move in bulk counts of 20.
- Tenant authentication or tenant-facing UI. Tenants are email recipients only.
- Payment integration beyond Stripe card-on-file + monthly auto-charge. No payment-plan management, no ACH.
- 3PL-facing portal or API integration.
- Multi-region expansion beyond Denver metro.
- Internationalization. English only, USD only.

## 3. Users & Roles

Four roles total, all using a single login mechanism (Supabase Auth, email + password).

| Role | Scope | Purpose |
|---|---|---|
| `pm_billing_admin` | One building | Daily operations for one building + full cost visibility + card-on-file management for that building. |
| `company_admin` | Entire company (all buildings) | Rollup view across buildings. Can do everything a `pm_billing_admin` does on any of their buildings, plus user management and company settings. Cannot create new buildings. |
| `totes_admin` | Backend — all companies | Colorado Totes staff. Creates companies and buildings, coordinates 3PL offline, enters completion + cost data into the platform, oversees billing. |
| Tenant | N/A | Email recipient only. Receives three emails per move-in. No login. |

## 4. Business Rules & Core Mechanics

- **Tote batch unit:** Totes always move in batches of 20. The platform tracks counts, not individual totes.
- **Tote ownership:** Totes are owned by the property management company but branded per-building. Each building's inventory is tracked independently; totes do not migrate between buildings.
- **Tote locations (lifecycle):** Three active locations — `in_building`, `at_3pl`, `out_with_tenant` — plus a separate `lost_or_damaged` ledger.
- **Move-in allocation:** When a PM creates a move-in, the system recommends a batch count based on the unit type (studio / 1BR / 2BR / 3BR+), drawn from a per-building `recommended_batches_by_unit_type` map set at onboarding. The PM can override.
- **Palletization threshold:** Constant at 120 totes in-building (one full pallet). When a building's `in_building` count reaches this, the building appears on the Totes Admin palletization queue for 3PL pickup coordination. Not configurable in V1.
- **Returns:** All-or-nothing per move-in. When a PM marks a move-in returned, the full batch count × 20 totes return to `in_building` stock. Partial returns are not supported; exceptions are modeled via `tote_losses`.
- **Loss and damage:** PMs log loss/damage events (`lost`, `damaged`, `decommissioned`) with a count and optional note. These reduce the total-owned count and surface on the inventory dashboard so the PM can judge whether to request a reorder.
- **Reorders:** Offline in V1. PM contacts Colorado Totes by phone/email; admin produces new totes and logs a `tote_acquisitions` row (type `reorder`, count 60 or 120).
- **Overdue returns:** A move-in is flagged overdue if `state = 'delivered'` and `delivered_at + company.settings.overdue_days <= now()`. Default 14 days. Company Admin can adjust in settings. Dashboard-only flag in V1 — no automated escalation.

## 5. Architecture

### Stack
- **Frontend + backend:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui. Server Components by default; Server Actions for all mutations.
- **Database + auth + storage:** Supabase Postgres, Supabase Auth (email + password), Supabase Storage (building logos).
- **Email:** Resend + React Email templates.
- **Payments:** Stripe — one Customer per building, monthly auto-finalized invoices, Stripe Elements for self-serve card setup.
- **Hosting:** Vercel (Next.js app), Supabase managed (DB + Auth + Storage).
- **Monitoring:** Vercel Analytics + Supabase logs for V1. PostHog optional later.

### Module boundaries
- `lib/domain/` — pure TypeScript business logic (state machines, batch math, cost rollups, palletization, overdue calc). No DB, no HTTP. Unit-tested.
- `lib/db/` — the only module that imports the Supabase client. Typed repository functions; every other module goes through it.
- `lib/email/` — React Email templates + Resend send helpers.
- `lib/billing/` — Stripe SDK wrapper, invoice assembly from line items, webhook handling.
- `app/` — Next.js routes (App Router). Server Components for reads, Server Actions for writes.

### Multi-tenancy
- Postgres RLS enforces scope at the row level. Every tenant-scoped table has policies keyed off JWT claims (`role`, `company_id`, `building_id`).
- `totes_admin` bypasses tenant scoping (uses service-role key for elevated queries — only the admin portal routes use it).
- `company_admin` sees rows where `company_id = jwt.company_id`.
- `pm_billing_admin` sees rows where `building_id = jwt.building_id` (or for indirect tables, via a join to a row whose building matches).

### Repo layout
```
colorado-totes/
  app/
    (portal)/          # /app/* — PM + Company Admin
    admin/             # /admin/* — Totes Admin
    (auth)/            # /login, /invite/[token]
    api/
      cron/            # tenant email processor, invoice generator
      webhooks/        # stripe, resend
  components/          # Shared UI (shadcn + custom)
  lib/
    domain/
    db/
    email/
    billing/
  supabase/
    migrations/
    seed.sql
    policies/          # RLS policies as SQL files
  tests/
    domain/            # unit
    db/                # RLS + repo integration
    e2e/               # Playwright, 3 golden flows
  docs/
    superpowers/specs/
```

## 6. Data Model

All tables include `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` unless noted. Money as integer cents. Dates as `timestamptz` except where a calendar date suffices.

### Tenancy & identity

**`companies`**
- `name text not null`
- `slug text unique not null`
- `settings jsonb not null default '{"overdue_days": 14}'::jsonb`

**`buildings`**
- `company_id uuid references companies on delete cascade`
- `name text not null`
- `address text not null`
- `logo_storage_path text nullable`
- `stripe_customer_id text nullable`
- `billing_status enum('setup_pending','active','delinquent') not null default 'setup_pending'`
- `recommended_batches_by_unit_type jsonb not null default '{"studio":1,"1br":2,"2br":2,"3br_plus":3,"other":1}'::jsonb`
- `tenant_contact_info jsonb nullable` — drop-off location, contact name/email for tenant emails

**`users`**
- `id uuid primary key` — matches `auth.users.id`
- `company_id uuid references companies`
- `building_id uuid references buildings nullable` — null ⇒ company-scoped or totes_admin
- `role enum('pm_billing_admin','company_admin','totes_admin') not null`
- `display_name text`
- `email text not null`

### Inventory

**`tote_pools`** — one row per `(building_id, location)`
- `building_id uuid references buildings on delete cascade`
- `location enum('in_building','at_3pl','out_with_tenant') not null`
- `count int not null default 0 check (count >= 0)`
- `unique (building_id, location)`

**`tote_losses`**
- `building_id uuid references buildings on delete cascade`
- `count int not null check (count > 0)`
- `reason enum('lost','damaged','decommissioned') not null`
- `reported_by_user_id uuid references users`
- `notes text`

**`tote_acquisitions`**
- `building_id uuid references buildings on delete cascade`
- `count int not null check (count > 0)`
- `acquisition_type enum('initial','reorder') not null`
- `notes text`

### Move-ins

**`move_ins`**
- `building_id uuid references buildings on delete cascade`
- `tenant_name text not null`
- `tenant_email text not null`
- `tenant_phone text nullable`
- `unit_label text not null`
- `unit_type enum('studio','1br','2br','3br_plus','other') not null`
- `move_in_date date not null`
- `batch_count int not null check (batch_count > 0)`
- `state enum('pending_delivery','delivered','returned','cancelled') not null default 'pending_delivery'`
- `delivered_at timestamptz nullable`
- `returned_at timestamptz nullable`
- `external_id text nullable` — reserved for future PMS integration
- `created_by_user_id uuid references users`

**`move_in_events`** — append-only audit log
- `move_in_id uuid references move_ins on delete cascade`
- `event_type enum('created','delivered','returned','cancelled','email_scheduled_sent','email_delivered_sent','email_reminder_sent','email_bounced') not null`
- `actor_user_id uuid references users nullable` — null for system
- `payload jsonb not null default '{}'::jsonb`
- `occurred_at timestamptz not null default now()`

### Costs & billing

**`cost_line_items`**
- `building_id uuid references buildings on delete cascade`
- `move_in_id uuid references move_ins nullable`
- `category enum('delivery','pickup','warehousing','management_fee','subscription') not null`
- `passthrough_cents int not null default 0`
- `markup_cents int not null default 0`
- `total_cents int generated always as (passthrough_cents + markup_cents) stored`
- `incurred_on date not null`
- `billing_period date not null` — first-of-month; indexed with `building_id`
- `invoice_id uuid references invoices nullable`
- `entered_by_user_id uuid references users`

**`invoices`**
- `building_id uuid references buildings on delete cascade`
- `billing_period date not null` — first-of-month
- `stripe_invoice_id text nullable`
- `status enum('draft','finalized','paid','failed','void') not null default 'draft'`
- `subtotal_cents int not null default 0`
- `total_cents int not null default 0`
- `finalized_at timestamptz nullable`
- `paid_at timestamptz nullable`
- `failed_at timestamptz nullable`
- `unique (building_id, billing_period)`

### Email

**`tenant_emails`**
- `move_in_id uuid references move_ins on delete cascade`
- `kind enum('scheduled','delivered','reminder_48h') not null`
- `scheduled_for timestamptz not null`
- `sent_at timestamptz nullable`
- `resend_message_id text nullable`
- `status enum('pending','sent','failed','bounced') not null default 'pending'`

### Views

- **`building_inventory_summary`** — per building: `total_owned`, `in_building`, `at_3pl`, `out_with_tenant`, `lost`, `palletization_progress`.
- **`building_billing_summary`** — per `(building_id, period)`: `passthrough_cents`, `markup_cents`, `subscription_cents`, `total_cents`.
- **`overdue_move_ins`** — move-ins where `state='delivered'` and days-since-delivered ≥ `company.settings.overdue_days`; includes `days_overdue`.

## 7. Core Flows

### 7.1 Move-in → delivery → return

1. PM creates move-in (tenant, unit, date, unit_type; batch_count recommended and overridable).
2. Server action inserts `move_ins` row (`state=pending_delivery`), `move_in_events` row (`created`), and `tenant_emails` row (`kind=scheduled`, `scheduled_for=now()`).
3. Cron (every 5 min) picks up pending `tenant_emails` ≤ `now()`, sends via Resend, updates `sent_at`/`status`, and writes `move_in_events` (`email_scheduled_sent`).
4. Colorado Totes Admin sees the move-in on their `pending_deliveries` queue. Contacts 3PL offline to schedule delivery.
5. After delivery completes, admin marks it delivered in the portal. Server action:
   - Updates `move_ins.state='delivered'`, `delivered_at=now()`.
   - Decrements `tote_pools(at_3pl)` by `batch_count * 20`; increments `tote_pools(out_with_tenant)` by same.
   - Inserts `cost_line_items` row (`category='delivery'`, passthrough + markup).
   - Inserts `tenant_emails` rows: `delivered` (`scheduled_for=now()`) and `reminder_48h` (`scheduled_for = greatest(move_in_date, delivered_at::date) + 2 days`).
   - Writes `move_in_events` (`delivered`).
6. Cron sends the `delivered` email. Two days later, sends the `reminder_48h` email.
7. When tenant drops totes at the building, PM marks the move-in returned. Server action:
   - Updates `move_ins.state='returned'`, `returned_at=now()`.
   - Decrements `tote_pools(out_with_tenant)` by `batch_count * 20`; increments `tote_pools(in_building)` by same.
   - If `tote_pools(in_building) >= palletization_threshold`, the building surfaces on the Totes Admin palletization queue (derived; no materialized flag needed).
   - Writes `move_in_events` (`returned`).

### 7.2 Palletization → 3PL pickup

1. Building appears on palletization queue when `in_building >= 120`.
2. Admin contacts 3PL offline for pickup.
3. Admin marks pickup complete. The mark-picked-up modal requires the admin to enter the actual count the 3PL took (may differ from 120 if more accumulated between trigger and pickup). Server action:
   - Decrements `tote_pools(in_building)` by the entered count; increments `tote_pools(at_3pl)` by same.
   - Inserts `cost_line_items` row (`category='pickup'`).

### 7.3 Monthly billing

1. Month-end cron (first of each month at 02:00 America/Denver) runs per building:
   - Creates an `invoices` row (`status='draft'`, `billing_period=previous month`).
   - Claims all `cost_line_items` with matching `building_id` + `billing_period`, sets their `invoice_id`.
   - Adds a `subscription` line item for the building's monthly SaaS fee.
   - Creates and finalizes a Stripe Invoice for the building's Customer with individual lines (passthrough breakdown, markup, subscription). Stripe auto-charges the card on file.
2. Stripe webhook updates `invoices.status` to `paid` or `failed` based on the charge result.
3. On failure, `buildings.billing_status = 'delinquent'`; banner appears in PM portal; delinquency surfaces on Totes Admin dashboard.

### 7.4 Onboarding

1. Totes Admin creates company in `/admin`, sets name, slug, overdue_days.
2. Creates first building, sets name, address, palletization threshold (default 120), recommended batches per unit type, and `tenant_contact_info`. Uploads logo if available.
3. Logs initial `tote_acquisitions` with the count of physical totes produced for that building (split into `tote_pools` — typically all `in_building` or `at_3pl` depending on where they physically start).
4. Invites first user (Company Admin or PM Billing Admin) via email. Supabase Auth sends invite; user clicks link, sets password, lands on building dashboard.
5. On first login, if `billing_status = 'setup_pending'`, the user is prompted to add a payment method via Stripe Elements. Setup Intent succeeds → webhook flips `billing_status = 'active'`.

## 8. Screens (Sitemap)

### PM / Billing Admin portal (`/app`)
- `/app` — Building dashboard: inventory, upcoming move-ins, overdue flags, billing banner, month cost summary.
- `/app/move-ins` — list with filters.
- `/app/move-ins/new` — create form.
- `/app/move-ins/[id]` — detail: timeline, email log, mark-returned action.
- `/app/inventory` — pool counts, loss log, report-loss action, acquisition history.
- `/app/costs` — current month line items + 12-month aggregate.
- `/app/invoices` — past invoices with Stripe PDF links.
- `/app/billing` — card management (Stripe Elements).
- `/app/account` — profile, password change.

### Company Admin portal (same tree, extended)
- Persistent scope picker in header: "All buildings ▾" or specific building. When a building is selected, screens behave identically to the PM portal for that building.
- `/app` — company rollup dashboard with per-building breakdown table.
- `/app/company/buildings` — list (read + edit, no create).
- `/app/company/users` — invite, list, deactivate PM users.
- `/app/company/settings` — overdue_days, reorder contact info.

### Totes Admin portal (`/admin`)
- `/admin` — global dashboard: companies, queues, delinquencies.
- `/admin/pending-deliveries` — queue with mark-delivered action.
- `/admin/palletization` — queue with mark-picked-up action.
- `/admin/companies` — list, create.
- `/admin/companies/[id]` — detail; edit settings, list buildings, add-building action, list users, invite-user action.
- `/admin/companies/[id]/buildings/[id]` — detail; edit, log acquisition, manual invoice, full cost ledger.
- `/admin/invoices` — cross-company invoice list.
- `/admin/warehousing` — monthly batch entry of warehousing fees per building.

### Public
- `/` — landing page (minimal V1).
- `/login` — Supabase Auth.
- `/invite/[token]` — accept invite, set password.

## 9. Email

Three transactional emails, rendered via React Email, sent via Resend. All are formal in tone, branded per building (logo + building name).

### #1 — Scheduled (trigger: move-in created)
- Subject: "Your [Building Name] move-in totes are scheduled"
- Confirms N totes will be delivered in the days leading up to move-in. Explains the service as a building-provided benefit.

### #2 — Delivered (trigger: admin marks delivered)
- Subject: "Your [Building Name] totes have been delivered"
- Confirms delivery. Provides use guidance and return instructions (from `tenant_contact_info`). References a follow-up reminder.

### #3 — Reminder (trigger: `delivered` or `move_in_date` + 48h, whichever is later)
- Subject: "Welcome to [Building Name] — returning your totes"
- Formal welcome. Specifies drop-off location and contact. No deadline in email.

### Mechanics
- `tenant_emails` rows created at trigger time.
- Vercel cron `/api/cron/send-tenant-emails` runs every 5 minutes, secured by a cron secret header. Processes up to 100 pending rows per run where `scheduled_for <= now()` and `status='pending'`. Sends via Resend, updates the row, and writes the corresponding `move_in_events` row.
- Resend webhook (`/api/webhooks/resend`) updates `tenant_emails.status = 'bounced'` on bounce events and writes `move_in_events` (`email_bounced`).
- The move-in detail screen displays the email log.

## 10. Billing

- **Stripe model:** one Stripe Customer per **building**. Card setup via Stripe Elements in `/app/billing`. Stripe Setup Intent completes → webhook → `buildings.billing_status = 'active'`.
- **Invoice generation:** month-end cron at 02:00 America/Denver on the 1st of each month. For each building in `billing_status` of `active` or `delinquent` (delinquent buildings still get invoiced so the charge can be retried):
  - Create `invoices` row and claim line items.
  - Create a Stripe Invoice with one line item per `cost_line_items` row plus the subscription line. Each line is human-readable (e.g., "Delivery — Jane Smith, Unit 4B, 2026-03-14").
  - Finalize the invoice. Stripe auto-charges the payment method on file.
- **Webhooks (`/api/webhooks/stripe`):**
  - `invoice.paid` → `invoices.status='paid'`, `paid_at=now()`. Reset `billing_status` to `active` if it was `delinquent`.
  - `invoice.payment_failed` → `invoices.status='failed'`, `failed_at=now()`, `buildings.billing_status='delinquent'`. Banner in PM portal; flag on admin dashboard.
  - `setup_intent.succeeded` → `billing_status='active'`, store PM id on the Stripe Customer.
- **Manual invoice:** Totes Admin has a "Generate invoice now" action on the building detail screen to close a period early (e.g., on churn).
- **No auto-suspension:** delinquency is a signal, not an enforcement action. Admin decides offline whether to pause service.

## 11. Notifications & Dashboard Flags

Dashboard-only in V1; no admin email alerts. The following signals are surfaced:

- **PM dashboard:** upcoming move-ins (7-day window); overdue flags; billing-delinquent banner; low-stock warning (when `in_building + at_3pl < batches_for_next_N_moves * 20`, N = 3).
- **Company Admin dashboard:** all of the above aggregated.
- **Totes Admin dashboard:** pending-delivery count, palletization-ready buildings, delinquency count, failed-invoice list, overdue-move-ins count.

## 12. Out of scope for V1 (architected for)

- PMS integration — `move_ins.external_id` field reserved; integration tables deferred.
- 3PL login — `users.role` enum can be extended; `three_pl_partners` table deferred.
- CSV bulk move-in upload — no schema changes; UI + parser deferred.
- Tenant tracking page — no schema changes; public route + design deferred.
- Reorder button in portal — offline in V1; endpoint + UI deferred.

## 13. Testing Strategy

- **Unit (Vitest):** `lib/domain/` — state machine transitions, batch math, palletization, cost aggregation, overdue calc, recommended-batches lookup, loss aggregation.
- **Integration (Vitest + local Supabase):** `lib/db/` — RLS isolation by role, FK constraints, enum rejection, view correctness.
- **E2E (Playwright):** three golden flows:
  - PM: create move-in → mark returned → view costs.
  - Company Admin: scope picker → act on a building → invite PM user.
  - Totes Admin: create company + building + user → mark delivered with cost → mark returned → verify email queue.
- Stripe test mode with test cards; Resend sandbox.
- CI: GitHub Actions — lint + typecheck + unit + DB tests on every PR; Playwright on main and nightly.
- Preview deploys on Vercel per PR against disposable Supabase branches.

## 14. Environments

- **Local:** Supabase CLI + Docker for Postgres/Auth/Storage; Stripe test mode; Resend sandbox.
- **Staging:** dedicated Supabase project + Vercel preview branch; Stripe test mode.
- **Production:** separate Supabase project; Stripe live mode; Resend production domain.

## 15. Open items tracked for V2+

- 3PL portal / API integration.
- PMS integration (Yardi, RealPage, AppFolio, Entrata).
- CSV bulk move-in upload.
- In-portal reorder button.
- Tenant tracking page.
- Branded email colors beyond logo + building name.
- Payment methods beyond card (ACH).
- Analytics (PostHog).
- Expansion outside Denver metro.
