-- Phase 2: multi-location owners + role-gated writes.
--
-- A staff row is scoped one of two ways: line cooks and kitchen managers
-- carry location_id (one kitchen); an owner instead carries org_id and a
-- null location_id, giving them every location under that org. Never both.

alter table staff add column display_name text not null default '';
alter table staff add column org_id uuid references organizations(id) on delete cascade;
alter table staff alter column location_id drop not null;

alter table staff add constraint staff_scope_matches_role check (
  (role = 'owner' and org_id is not null and location_id is null) or
  (role in ('line_cook', 'kitchen_manager') and location_id is not null and org_id is null)
);

-- Every location a given staff member can see — a single location for
-- cooks/managers, every location in the org for an owner. Centralizing
-- this here means the RLS policies below don't each re-derive it.
create or replace function staff_location_ids(uid uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from locations where org_id = (select org_id from staff where staff.id = uid and role = 'owner')
  union
  select location_id from staff where staff.id = uid and location_id is not null;
$$;

create or replace function is_manager_or_owner(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff where staff.id = uid and role in ('kitchen_manager', 'owner'));
$$;

-- Replace the Phase 0 policies with the org-aware version.
drop policy if exists staff_scoped_locations on locations;
create policy staff_scoped_locations on locations
  for select using (id in (select staff_location_ids(auth.uid())));

drop policy if exists staff_scoped_stock on stock_items;
create policy staff_read_stock on stock_items
  for select using (location_id in (select staff_location_ids(auth.uid())));
create policy manager_write_stock on stock_items
  for insert with check (location_id in (select staff_location_ids(auth.uid())) and is_manager_or_owner(auth.uid()));
create policy manager_update_stock on stock_items
  for update using (location_id in (select staff_location_ids(auth.uid())) and is_manager_or_owner(auth.uid()));

drop policy if exists staff_scoped_orders on orders;
create policy staff_scoped_orders on orders
  for all using (location_id in (select staff_location_ids(auth.uid())));

drop policy if exists staff_scoped_order_lines on order_lines;
create policy staff_scoped_order_lines on order_lines
  for all using (
    order_id in (select id from orders where location_id in (select staff_location_ids(auth.uid())))
  );

-- Menu changes (86'ing an item, editing price/description) are a
-- manager/owner call, not a line cook's. Reads are untouched — menu_items
-- keeps the Phase 0 public-read policy, since the storefront browses it
-- without any staff session at all.
create policy manager_update_menu_items on menu_items
  for update using (
    is_manager_or_owner(auth.uid()) and
    brand_id in (select id from brands where location_id in (select staff_location_ids(auth.uid())))
  );
