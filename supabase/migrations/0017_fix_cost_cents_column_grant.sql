-- 0012 and 0016 both tried to hide menu_items.cost_cents via
-- `revoke select (cost_cents) on menu_items from ...` — but Postgres
-- computes effective column access as the UNION of table-level and
-- column-level grants, and Supabase's default schema exposure already
-- grants table-wide SELECT on menu_items to anon/authenticated. A
-- column-level REVOKE can't remove a table-level GRANT; it has to be
-- revoked at the same level it was granted, then re-granted narrowly.
-- Verified live against the actual project: anon could still read
-- cost_cents after both prior attempts.

revoke select on menu_items from anon, authenticated;

grant select (id, brand_id, name, description, price_cents, station, prep_minutes, available, image_url)
  on menu_items to anon, authenticated;
