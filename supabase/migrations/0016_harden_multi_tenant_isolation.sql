-- Security hardening pass, done before onboarding any additional
-- (unrelated) organizations onto this project. Three real gaps, all
-- pre-existing and independent of the platform_admin work that follows:
--
-- 1. Guest-checkout policies (0004/0005/0010) were explicitly commented
--    as "drop once phone-OTP auth lands" — it landed (0014) but these
--    were never revisited. They let ANY caller, including unauthenticated
--    ones, insert or read a 'direct' order/its lines/its feedback across
--    ANY org's location, relying solely on "UUIDs are unguessable" rather
--    than RLS. CartScreen already requires a signed-in customer before
--    calling placeOrder(), so nothing legitimate depends on the guest
--    path anymore.
-- 2. menu_items.cost_cents (internal food-cost margin) was only revoked
--    from `anon` (0012) — any `authenticated` user, i.e. staff at ANY
--    org or any signed-in customer, could read every org's margins.
-- 3. menu-item-photos storage writes were gated only by role
--    (is_manager_or_owner), with no location/org check — a manager at
--    any org could overwrite or delete any other org's photos.
-- Plus: organizations had no RLS enabled at all.

-- ---------------------------------------------------------------------
-- 1. Retire the guest-checkout policies; require real customer identity.
-- ---------------------------------------------------------------------

drop policy public_insert_direct_orders on orders;
drop policy public_read_guest_orders on orders;
drop policy public_insert_direct_order_lines on order_lines;
drop policy public_read_guest_order_lines on order_lines;
drop policy public_insert_order_feedback on order_feedback;
drop policy public_read_guest_order_feedback on order_feedback;
drop function if exists direct_order_line_slot_open(uuid);

create policy customer_insert_own_direct_orders on orders
  for insert with check (channel = 'direct' and customer_id = auth.uid());

-- order_lines has no SELECT policy usable from an insert-time subquery
-- for a customer's *first* line (nothing to see yet either way), so this
-- stays a security definer function, same shape as the one it replaces —
-- now checking ownership of the order instead of only its channel/age.
create or replace function direct_order_line_slot_open(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from orders
    where id = target_order_id and channel = 'direct' and customer_id = auth.uid()
  )
  and not exists (
    select 1 from order_lines where order_id = target_order_id
  );
$$;

create policy customer_insert_own_direct_order_lines on order_lines
  for insert with check (direct_order_line_slot_open(order_id));

create policy customer_insert_own_order_feedback on order_feedback
  for insert with check (order_id in (select id from orders where customer_id = auth.uid()));

-- Dropping public_read_guest_order_feedback removed the only way a
-- customer could read back their own feedback (to avoid re-prompting —
-- see TrackScreen/checkFeedback) — add the real one.
create policy customer_read_own_order_feedback on order_feedback
  for select using (order_id in (select id from orders where customer_id = auth.uid()));

-- ---------------------------------------------------------------------
-- 2. Scope menu_items.cost_cents to the item's own org/location, not
--    "any authenticated user platform-wide". Column REVOKE is all-or-
--    nothing per role, so fetchMenuItems() (shared by both apps, and the
--    customer app never needed this column anyway) drops it from its
--    select list, and a separate view — not RLS, since a security
--    invoker view can't see a column its caller has no grant on — does
--    the actual per-row scoping for the one place that legitimately
--    needs it (menu editing).
-- ---------------------------------------------------------------------

revoke select (cost_cents) on menu_items from authenticated;

create view menu_item_costs as
select mi.id as menu_item_id, mi.brand_id, mi.cost_cents
from menu_items mi
join brands b on b.id = mi.brand_id
where is_manager_or_owner(auth.uid())
  and b.location_id in (select staff_location_ids(auth.uid()));

grant select on menu_item_costs to authenticated;

-- ---------------------------------------------------------------------
-- 3. Scope menu-item-photos writes to the photo's own menu item's
--    location — reuses the existing "{menu_item_id}/..." object-name
--    convention (uploadMenuItemPhoto) rather than introducing a new one,
--    so already-uploaded photos keep working.
-- ---------------------------------------------------------------------

drop policy staff_upload_menu_item_photos on storage.objects;
drop policy staff_update_menu_item_photos on storage.objects;
drop policy staff_delete_menu_item_photos on storage.objects;

create or replace function owns_menu_item_photo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_manager_or_owner(auth.uid())
    and object_name ~ '^[0-9a-fA-F-]{36}/'
    and exists (
      select 1 from menu_items mi
      join brands b on b.id = mi.brand_id
      where mi.id = (split_part(object_name, '/', 1))::uuid
        and b.location_id in (select staff_location_ids(auth.uid()))
    );
$$;

create policy staff_upload_menu_item_photos on storage.objects
  for insert with check (bucket_id = 'menu-item-photos' and owns_menu_item_photo(name));

create policy staff_update_menu_item_photos on storage.objects
  for update using (bucket_id = 'menu-item-photos' and owns_menu_item_photo(name));

create policy staff_delete_menu_item_photos on storage.objects
  for delete using (bucket_id = 'menu-item-photos' and owns_menu_item_photo(name));

-- ---------------------------------------------------------------------
-- 4. organizations had no RLS enabled at all.
-- ---------------------------------------------------------------------

alter table organizations enable row level security;

create policy staff_read_own_organization on organizations
  for select using (id = staff_own_org_id(auth.uid()));
