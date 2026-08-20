-- Two gaps found in a pre-launch security pass:
--
-- 1. public_insert_direct_order_lines only checked that the target order
--    was a direct-channel order — not that it was the caller's own, or
--    that it didn't already have lines. Since guest orders carry no
--    customer_id to check against (no phone-OTP auth yet — see 0004's
--    note), anyone with the anon key could append order_lines to *any*
--    direct order, including ones already placed by someone else.
--
--    Tightened to: the order must not yet have any lines (blocks
--    after-the-fact tampering — the legitimate checkout flow inserts all
--    of an order's lines in one batch, and every row in that batch sees
--    the same pre-batch snapshot, so this doesn't affect it) and must
--    have been placed in the last 5 minutes (keeps the window for a
--    guessed/leaked order id short). The "already has lines" check has
--    to run as a security definer function rather than inline in the
--    policy — a guest has no SELECT policy on order_lines at all, so an
--    inline subquery would see zero rows regardless of what's really
--    there and the check would be vacuously true for exactly the anon
--    role it's meant to restrict.
--
-- 2. menu_items.cost_cents (internal food cost) was readable by anyone
--    via public_read_menu_items's `using (true)` — that policy is
--    row-level and was never meant to expose every column, just to let
--    guests browse the menu. Column-level REVOKE closes it for anon
--    while leaving it in place for authenticated (staff) callers, who
--    need it for menu editing and margin reporting.

create or replace function direct_order_line_slot_open(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from orders
    where id = target_order_id
      and channel = 'direct'
      and placed_at > now() - interval '5 minutes'
  )
  and not exists (
    select 1 from order_lines where order_id = target_order_id
  );
$$;

drop policy public_insert_direct_order_lines on order_lines;

create policy public_insert_direct_order_lines on order_lines
  for insert with check (direct_order_line_slot_open(order_id));

revoke select (cost_cents) on menu_items from anon;
