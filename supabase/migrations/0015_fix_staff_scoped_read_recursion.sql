-- staff_scoped_read (0013) reads org_id via a raw subquery against staff
-- from inside a policy on staff itself — that subquery re-triggers RLS on
-- staff, which re-evaluates staff_scoped_read, forever ("infinite
-- recursion detected in policy for relation staff", 42P17). Every other
-- staff-scoped policy avoids this by going through a security definer
-- function (staff_location_ids, is_manager_or_owner), which bypasses RLS
-- instead of re-entering it. This gives the org_id lookup the same
-- treatment.
create or replace function staff_own_org_id(uid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from staff where staff.id = uid;
$$;

drop policy if exists staff_scoped_read on staff;
create policy staff_scoped_read on staff
  for select using (
    is_manager_or_owner(auth.uid())
    and (
      location_id in (select staff_location_ids(auth.uid()))
      or org_id = staff_own_org_id(auth.uid())
    )
  );
