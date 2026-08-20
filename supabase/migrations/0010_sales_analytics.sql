-- Phase: real Sales dashboard data instead of fixture numbers.
--
-- Two correctness gaps had to be fixed first, or "real" analytics would
-- just be wrong in a different way:
--
-- 1. order_lines never snapshotted price/cost. A menu item's
--    price_cents is exactly the kind of thing a manager edits (that's
--    what the menu-editing form does) — join against the *current*
--    menu_items row for a week-old order's revenue and every past order
--    silently re-prices itself the moment someone changes today's price.
-- 2. orders never recorded when a ticket actually became ready, so
--    "avg prep time" had no real data to compute from at all.

alter table order_lines add column price_cents int;
alter table order_lines add column cost_cents int;

update order_lines ol
set price_cents = mi.price_cents, cost_cents = mi.cost_cents
from menu_items mi
where mi.id = ol.menu_item_id and ol.price_cents is null;

alter table order_lines alter column price_cents set not null;
alter table order_lines alter column cost_cents set not null;

alter table orders add column ready_at timestamptz;
alter table orders add column picked_at timestamptz;

create or replace function set_order_stage_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.stage = 'ready' and old.stage is distinct from 'ready' and new.ready_at is null then
    new.ready_at := now();
  end if;
  if new.stage = 'picked' and old.stage is distinct from 'picked' and new.picked_at is null then
    new.picked_at := now();
  end if;
  return new;
end;
$$;

create trigger orders_set_stage_timestamps
  before update on orders
  for each row
  execute function set_order_stage_timestamps();

-- ---------------------------------------------------------------------
-- Aggregation views. security_invoker means each view runs with the
-- *caller's* permissions, not the view owner's — so staff_scoped_orders
-- and staff_scoped_order_lines still apply per-row through the view
-- exactly as if the query hit the tables directly. Without this, any
-- authenticated user could read every location's numbers regardless of
-- their own staff scope.
--
-- "day" buckets in UTC, not each location's own timezone — a real
-- multi-region product would want that, but HSR and Indiranagar are both
-- IST, and getting per-location-timezone day boundaries right is more
-- machinery than this needs right now.
-- ---------------------------------------------------------------------

create view daily_sales_by_location
with (security_invoker = true)
as
select
  o.location_id,
  date_trunc('day', o.placed_at) as day,
  count(distinct o.id) filter (where o.stage = 'picked') as completed_orders,
  coalesce(sum(ol.qty * ol.price_cents) filter (where o.stage = 'picked'), 0) as revenue_cents,
  coalesce(sum(ol.qty * ol.cost_cents) filter (where o.stage = 'picked'), 0) as cost_cents,
  avg(extract(epoch from (o.ready_at - o.placed_at))) filter (where o.ready_at is not null) as avg_prep_seconds
from orders o
join order_lines ol on ol.order_id = o.id
group by o.location_id, date_trunc('day', o.placed_at);

create view daily_sales_by_brand
with (security_invoker = true)
as
select
  o.location_id,
  o.brand_id,
  b.name as brand_name,
  date_trunc('day', o.placed_at) as day,
  count(distinct o.id) filter (where o.stage = 'picked') as completed_orders,
  coalesce(sum(ol.qty * ol.price_cents) filter (where o.stage = 'picked'), 0) as revenue_cents,
  coalesce(sum(ol.qty * ol.cost_cents) filter (where o.stage = 'picked'), 0) as cost_cents
from orders o
join brands b on b.id = o.brand_id
join order_lines ol on ol.order_id = o.id
group by o.location_id, o.brand_id, b.name, date_trunc('day', o.placed_at);

create view hourly_orders_by_location
with (security_invoker = true)
as
select
  o.location_id,
  date_trunc('day', o.placed_at) as day,
  extract(hour from o.placed_at)::int as hour,
  count(*) as order_count
from orders o
group by o.location_id, date_trunc('day', o.placed_at), extract(hour from o.placed_at);
