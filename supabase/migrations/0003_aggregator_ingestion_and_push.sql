-- Phase 3: aggregator ingestion + push notifications.

-- Aggregators reference items by their own catalog id, never ours — this
-- table is what the ingestion service resolves an incoming line item
-- against instead of fuzzy-matching on name (which breaks the moment a
-- dish is renamed on either side).
create table aggregator_menu_mappings (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('zipp', 'munchly')),
  external_item_id text not null,
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  unique (channel, external_item_id)
);

alter table aggregator_menu_mappings enable row level security;
create policy staff_read_aggregator_mappings on aggregator_menu_mappings
  for select using (
    menu_item_id in (
      select mi.id from menu_items mi
      join brands b on b.id = mi.brand_id
      where b.location_id in (select staff_location_ids(auth.uid()))
    )
  );

-- One row per device a customer has push-enabled on. The ingestion
-- service and the stage-change trigger both write/read this with the
-- service role, bypassing RLS by design; the policy below is what lets a
-- signed-in customer register their own token from the app.
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz not null default now(),
  unique (customer_id, expo_push_token)
);

alter table push_tokens enable row level security;
create policy customer_manage_own_push_token on push_tokens
  for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- Fires the notify-order-stage-change Edge Function whenever a ticket
-- actually changes stage (not on every unrelated column update). The
-- function URL and service-role bearer are read from Postgres settings
-- rather than hardcoded, since they differ per project — set both with
-- `alter database postgres set app.edge_function_base_url = '...'` and
-- `app.edge_function_service_key = '...'` after `supabase functions deploy`
-- (or via Vault, if you'd rather not have them in plain settings).
create extension if not exists pg_net;

create or replace function notify_order_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage then
    perform net.http_post(
      url := current_setting('app.edge_function_base_url', true) || '/notify-order-stage-change',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.edge_function_service_key', true)
      ),
      body := jsonb_build_object('order_id', new.id, 'stage', new.stage)
    );
  end if;
  return new;
end;
$$;

create trigger orders_notify_stage_change
  after update on orders
  for each row
  execute function notify_order_stage_change();

-- Human-readable ticket codes ("#1042") shared across every channel,
-- generated server-side so two aggregator webhooks landing at the same
-- instant can't collide. The ingestion service calls this via .rpc()
-- since supabase-js has no raw-SQL escape hatch.
create sequence if not exists order_code_seq start 1042;

create or replace function next_order_code()
returns text
language sql
as $$
  select '#' || nextval('order_code_seq')::text;
$$;
