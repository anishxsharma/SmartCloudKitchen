-- Rather than trusting the customer app or the ingestion service to
-- supply order_lines.price_cents/cost_cents themselves (which would mean
-- either trusting client-submitted pricing, or updating both insert
-- paths), a BEFORE INSERT trigger fills them from the current menu_items
-- row whenever the caller doesn't provide one. Both existing insert paths
-- already omit these columns, so this makes the snapshot happen for free
-- — no application code needs to change.

create or replace function set_order_line_price_snapshot()
returns trigger
language plpgsql
as $$
begin
  if new.price_cents is null or new.cost_cents is null then
    select coalesce(new.price_cents, mi.price_cents), coalesce(new.cost_cents, mi.cost_cents)
    into new.price_cents, new.cost_cents
    from menu_items mi
    where mi.id = new.menu_item_id;
  end if;
  return new;
end;
$$;

create trigger order_lines_set_price_snapshot
  before insert on order_lines
  for each row
  execute function set_order_line_price_snapshot();
