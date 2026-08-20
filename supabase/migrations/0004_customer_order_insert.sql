-- Phase 0's RLS covered staff writing to orders and customers reading
-- their own — nothing let a customer actually place one. There's no
-- phone-OTP auth yet, so this is guest-checkout-shaped: a direct order
-- with a null customer_id, or one tagged to the caller's own session if
-- they happen to be signed in. Aggregator channels stay closed to public
-- inserts — those only ever come from the ingestion service's service
-- role, which bypasses RLS entirely.
--
-- Revisit once phone-OTP auth lands: order_lines here can't verify "this
-- is my order" without a customer_id to check, since a guest has none.

create policy public_insert_direct_orders on orders
  for insert with check (
    channel = 'direct' and (customer_id is null or customer_id = auth.uid())
  );

create policy public_insert_direct_order_lines on order_lines
  for insert with check (
    order_id in (select id from orders where channel = 'direct')
  );
