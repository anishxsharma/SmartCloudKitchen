-- The customer app is a shared marketplace (Phase 5): a diner picks
-- which kitchen business/location to order from before browsing its
-- menu, same as public_read_brands/public_read_menu_items already let
-- them browse a chosen location's catalog without being staff. locations
-- had no public read policy at all until now — only staff could see any
-- location, which is fine for an internal single-tenant app but breaks
-- a marketplace picker that has to list businesses before anyone signs
-- in as anything.
create policy public_read_locations on locations
  for select using (true);
