-- 0006 read both values from Postgres settings (app.edge_function_*),
-- set via `alter database ... set`. That works locally but hosted
-- Supabase doesn't grant the postgres role permission to set custom GUCs
-- at the database level at all — not even for the non-secret base URL.
-- Vault is the mechanism that's actually available, so both values live
-- there now. Neither is ever in a migration file; each is stored once
-- via `select vault.create_secret(value, name)` run directly against the
-- project (see the deploy notes) — 'edge_function_base_url' and
-- 'edge_function_service_key'.

create or replace function notify_order_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_url text;
  v_service_key text;
begin
  if new.stage is distinct from old.stage then
    select decrypted_secret into v_base_url from vault.decrypted_secrets where name = 'edge_function_base_url' limit 1;
    select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'edge_function_service_key' limit 1;

    if v_base_url is null or v_service_key is null then
      raise warning 'notify_order_stage_change: edge function config missing from Vault, skipping notify for order %', new.id;
      return new;
    end if;

    begin
      perform net.http_post(
        url := v_base_url || '/notify-order-stage-change',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
        body := jsonb_build_object('order_id', new.id, 'stage', new.stage)
      );
    exception when others then
      raise warning 'notify_order_stage_change: push notify failed for order %: %', new.id, sqlerrm;
    end;
  end if;
  return new;
end;
$$;
