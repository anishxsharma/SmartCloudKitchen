-- The stage-change trigger from 0003 called net.http_post unconditionally
-- — with app.edge_function_base_url unset (true before the Edge Function
-- is deployed and configured), that's a NULL url, which violates
-- http_request_queue's NOT NULL constraint and throws. Since the trigger
-- runs inside the same transaction as the stage UPDATE, that failure
-- rolled back the ticket bump itself — a non-critical push notification
-- was blocking the core "kitchen taps Start cooking" action.
--
-- A best-effort side effect should never be able to break the primary
-- write: skip cleanly when unconfigured, and never let the notify call
-- itself fail the transaction once it is.

create or replace function notify_order_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_url text := current_setting('app.edge_function_base_url', true);
begin
  if new.stage is distinct from old.stage and v_base_url is not null and v_base_url <> '' then
    begin
      perform net.http_post(
        url := v_base_url || '/notify-order-stage-change',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.edge_function_service_key', true)
        ),
        body := jsonb_build_object('order_id', new.id, 'stage', new.stage)
      );
    exception when others then
      raise warning 'notify_order_stage_change: push notify failed for order %: %', new.id, sqlerrm;
    end;
  end if;
  return new;
end;
$$;
