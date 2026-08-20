-- Every screen that subscribes to postgres_changes (the kitchen queue,
-- ticket line toggles, the customer's order tracker) has been calling
-- subscribeToLocationOrders / subscribeToOrderLineChanges / subscribeToOrder
-- since Phase 4, but nothing ever added orders or order_lines to the
-- supabase_realtime publication — Realtime only streams changes for
-- tables explicitly published, regardless of RLS being correct. Confirmed
-- via `select * from pg_publication_tables where pubname =
-- 'supabase_realtime'` returning zero rows: a kitchen staff bumping a
-- ticket to "cooking" was persisting fine, the customer just never heard
-- about it.
--
-- Wrapped in existence checks so this migration is a safe no-op if the
-- tables were already added by hand (as they were on the dev project,
-- via the Management API, while the direct DB port was unreachable).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'order_lines'
  ) then
    alter publication supabase_realtime add table order_lines;
  end if;
end $$;
