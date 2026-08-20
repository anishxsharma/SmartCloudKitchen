-- Phase: menu item editing, item photos, customer feedback.

-- Menu items could only be toggled available/unavailable (0002's
-- manager_update_menu_items) — nothing let a manager create a new dish or
-- edit an existing one's name/price/description, and there was no photo
-- column at all.
alter table menu_items add column image_url text;

create policy manager_insert_menu_items on menu_items
  for insert with check (
    is_manager_or_owner(auth.uid()) and
    brand_id in (select id from brands where location_id in (select staff_location_ids(auth.uid())))
  );

-- ---------------------------------------------------------------------
-- Item photos — public Storage bucket. "Public" makes reads work via a
-- plain URL with no auth (what the customer app needs), independent of
-- the RLS below; the policies here only govern who can write.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('menu-item-photos', 'menu-item-photos', true)
on conflict (id) do nothing;

create policy staff_upload_menu_item_photos on storage.objects
  for insert with check (bucket_id = 'menu-item-photos' and is_manager_or_owner(auth.uid()));

create policy staff_update_menu_item_photos on storage.objects
  for update using (bucket_id = 'menu-item-photos' and is_manager_or_owner(auth.uid()));

create policy staff_delete_menu_item_photos on storage.objects
  for delete using (bucket_id = 'menu-item-photos' and is_manager_or_owner(auth.uid()));

create policy public_read_menu_item_photos on storage.objects
  for select using (bucket_id = 'menu-item-photos');

-- ---------------------------------------------------------------------
-- Customer feedback — one rating+comment per order. Insert follows the
-- same guest-checkout trust model as orders/order_lines (0004/0005):
-- there's no phone-OTP auth yet, so "is this my order" can only be
-- checked against a null customer_id, not a real identity.
-- ---------------------------------------------------------------------

create table order_feedback (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade unique,
  customer_id uuid references customers(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table order_feedback enable row level security;

create policy public_insert_order_feedback on order_feedback
  for insert with check (
    order_id in (
      select id from orders where channel = 'direct' and (customer_id is null or customer_id = auth.uid())
    )
  );

create policy public_read_guest_order_feedback on order_feedback
  for select using (
    order_id in (select id from orders where channel = 'direct' and customer_id is null)
  );

create policy staff_read_order_feedback on order_feedback
  for select using (
    order_id in (select id from orders where location_id in (select staff_location_ids(auth.uid())))
  );
