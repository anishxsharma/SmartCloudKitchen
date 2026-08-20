-- The 0004 insert policy let a guest create a direct order, but nothing
-- let them read it back — and PostgREST's insert...returning, plus any
-- realtime subscription, both go through the ordinary SELECT policy.
-- Without this, a guest's own "place order" call fails outright (Postgres
-- can't return the row), and even a successful insert would leave
-- tracking/realtime silently seeing nothing.
--
-- This is intentionally broad — any caller can read any guest ('direct',
-- customer_id null) order and its lines, not just their own, since
-- there's no session to scope by yet. Acceptable for now (order contents
-- aren't sensitive PII, ids are unguessable UUIDs, and this only applies
-- to walk-up guest orders that exist purely because auth doesn't yet).
-- Once phone-OTP auth lands and every direct order carries a real
-- customer_id, this policy stops matching anything and should be
-- dropped in favor of customer_own_orders alone.

create policy public_read_guest_orders on orders
  for select using (channel = 'direct' and customer_id is null);

create policy public_read_guest_order_lines on order_lines
  for select using (
    order_id in (select id from orders where channel = 'direct' and customer_id is null)
  );
