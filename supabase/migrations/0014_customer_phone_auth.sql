-- customers.id already mirrors auth.users.id (see 0001's comment on the
-- table) — the schema was built for phone-OTP identity from the start,
-- but nothing ever let a newly-verified phone number create its own row:
-- customer_own_row (0001) is SELECT-only. Phone OTP checkout needs a
-- customer to upsert their own row right after verifying.
create policy customer_insert_own_row on customers
  for insert with check (id = auth.uid());

create policy customer_update_own_row on customers
  for update using (id = auth.uid());
