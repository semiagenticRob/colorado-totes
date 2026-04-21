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
