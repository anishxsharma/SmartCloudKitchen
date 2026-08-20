-- SmartCloudKitchen — initial schema
-- Every operational table carries location_id so RLS can scope staff to
-- the kitchens they actually belong to (see policies at the bottom).

create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  timezone text not null default 'Asia/Kolkata'
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  name text not null
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  cost_cents int not null check (cost_cents >= 0),
  station text not null check (station in ('WOK', 'GRILL', 'FRY', 'OVEN')),
  prep_minutes int not null check (prep_minutes > 0),
  available boolean not null default true
);

create table stock_items (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  linked_item_id uuid references menu_items(id) on delete set null,
  name text not null,
  qty numeric not null default 0,
  par numeric not null,
  unit text not null
);

-- customers.id mirrors auth.users.id — Supabase phone-OTP identity.
create table customers (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  display_name text
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  lat numeric,
  lng numeric
);

create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  role text not null check (role in ('line_cook', 'kitchen_manager', 'owner'))
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete restrict,
  customer_id uuid references customers(id) on delete set null,
  channel text not null check (channel in ('direct', 'zipp', 'munchly')),
  external_ref text,
  code text not null,
  stage text not null default 'new' check (stage in ('new', 'cooking', 'ready', 'picked')),
  promise_minutes int not null,
  placed_at timestamptz not null default now(),
  delivery_address_id uuid references addresses(id) on delete set null,
  note text
);

create table order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete restrict,
  qty int not null check (qty > 0),
  note text,
  done boolean not null default false
);

create index orders_location_stage_idx on orders (location_id, stage);
create index orders_customer_idx on orders (customer_id);
create index order_lines_order_idx on order_lines (order_id);
create index stock_items_location_idx on stock_items (location_id);

-- ---------------------------------------------------------------------
-- Row-level security: staff see only the locations they belong to.
-- Customers see only their own orders/addresses. Menu browsing is public.
-- ---------------------------------------------------------------------

alter table locations enable row level security;
alter table brands enable row level security;
alter table menu_items enable row level security;
alter table stock_items enable row level security;
alter table orders enable row level security;
alter table order_lines enable row level security;
alter table addresses enable row level security;
alter table customers enable row level security;
alter table staff enable row level security;

create policy staff_scoped_locations on locations
  for select using (
    id in (select location_id from staff where staff.id = auth.uid())
  );

create policy staff_scoped_stock on stock_items
  for all using (
    location_id in (select location_id from staff where staff.id = auth.uid())
  );

create policy staff_scoped_orders on orders
  for all using (
    location_id in (select location_id from staff where staff.id = auth.uid())
  );

create policy customer_own_orders on orders
  for select using (customer_id = auth.uid());

create policy staff_scoped_order_lines on order_lines
  for all using (
    order_id in (
      select id from orders where location_id in (
        select location_id from staff where staff.id = auth.uid()
      )
    )
  );

create policy customer_own_order_lines on order_lines
  for select using (
    order_id in (select id from orders where customer_id = auth.uid())
  );

create policy customer_own_addresses on addresses
  for all using (customer_id = auth.uid());

create policy customer_own_row on customers
  for select using (id = auth.uid());

create policy staff_own_row on staff
  for select using (id = auth.uid());

-- Menu is public read (storefront browsing needs no auth); writes are
-- staff-only via the kitchen app's service-scoped calls.
create policy public_read_brands on brands for select using (true);
create policy public_read_menu_items on menu_items for select using (true);
