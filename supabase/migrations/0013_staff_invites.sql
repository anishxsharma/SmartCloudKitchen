-- Staff onboarding: until now, staff rows only ever got created by hand
-- (scripts/seed-staff.ts) — there was no in-app way for an owner or
-- kitchen_manager to add a new hire. That's now done via the
-- invite-staff Edge Function (service_role, so it bypasses RLS for the
-- actual insert) — but the app also needs owners/managers to be able to
-- *read* their team to show a staff list, which staff_own_row (id =
-- auth.uid() only) never allowed.
--
-- Scope mirrors staff_location_ids(): an owner sees every staff row in
-- their org (every location's staff, plus any co-owners); a
-- kitchen_manager sees only staff at their own location. Line cooks get
-- nothing beyond staff_own_row — they can't manage a team.
create policy staff_scoped_read on staff
  for select using (
    is_manager_or_owner(auth.uid())
    and (
      location_id in (select staff_location_ids(auth.uid()))
      or org_id = (select org_id from staff where staff.id = auth.uid())
    )
  );
