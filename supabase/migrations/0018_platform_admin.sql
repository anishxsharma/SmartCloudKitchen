-- Introduces platform_admin: a role above owner that belongs to no
-- specific org/location, able to onboard new (independent) kitchen
-- businesses onto the platform. Everything below follows the same
-- pattern as the existing owner/manager machinery (staff_location_ids,
-- is_manager_or_owner) rather than inventing a new one.

alter table staff drop constraint staff_role_check;
alter table staff add constraint staff_role_check
  check (role in ('line_cook', 'kitchen_manager', 'owner', 'platform_admin'));

alter table staff drop constraint staff_scope_matches_role;
alter table staff add constraint staff_scope_matches_role check (
  (role = 'owner' and org_id is not null and location_id is null) or
  (role in ('line_cook', 'kitchen_manager') and location_id is not null and org_id is null) or
  (role = 'platform_admin' and org_id is null and location_id is null)
);

create or replace function is_platform_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff where staff.id = uid and role = 'platform_admin');
$$;

-- organizations already has staff_read_own_organization (0016); this
-- adds full (select/insert/update/delete) access for platform_admin.
create policy platform_admin_all_organizations on organizations
  for all using (is_platform_admin(auth.uid()));

-- locations currently has no INSERT policy at all. platform_admin can
-- create a location in any org (used when onboarding a brand-new org's
-- first location); an owner can create one in their own org only (Phase
-- 4 — owners adding their own new city locations — needs this same
-- policy, so it's added here rather than in a later migration).
create policy platform_admin_insert_locations on locations
  for insert with check (is_platform_admin(auth.uid()));

create policy owner_insert_locations on locations
  for insert with check (org_id = staff_own_org_id(auth.uid()));
