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

-- Direct building_id policies for building-scoped tables
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
  move_in_id in (select id from move_ins)
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
  move_in_id in (select id from move_ins)
);
