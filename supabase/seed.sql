-- Catalog fixtures — mirrors packages/mock-data/src/index.ts exactly, so
-- the real backend shows the same brands/dishes/stock the apps already
-- render against mock data. Staff (and their auth.users rows) are seeded
-- separately via scripts/seed-staff.ts, since Auth users can't be created
-- from plain SQL.

insert into organizations (id, name) values
  ('11111111-0000-0000-0000-000000000001', 'SmartCloudKitchen');

insert into locations (id, org_id, name, timezone) values
  ('11111111-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', 'HSR Kitchen 04', 'Asia/Kolkata'),
  ('11111111-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000001', 'Indiranagar Kitchen 02', 'Asia/Kolkata');

insert into brands (id, location_id, name) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000010', 'Curry Line'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000010', 'Wok Theory'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000010', 'Bowl & Bird'),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000010', 'Slice Lab'),
  ('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000020', 'Curry Line'),
  ('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000020', 'Wok Theory');

insert into menu_items (id, brand_id, name, description, price_cents, cost_cents, station, prep_minutes, available) values
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Butter Chicken Bowl', 'Slow-simmered tomato gravy, charred thigh, cultured butter.', 34000, 12800, 'WOK', 14, true),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Dal Makhani + Rice', 'Black lentils held overnight, finished with cream.', 26000, 7400, 'WOK', 10, true),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Paneer Tikka Roll', 'Coal-smoked paneer, pickled onion, mint.', 22000, 8800, 'GRILL', 9, true),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'Chilli Garlic Noodles', 'Hand-pulled noodles, black vinegar, fried garlic.', 28000, 9200, 'WOK', 8, true),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002', 'Kung Pao Cauliflower', 'Twice-fried florets, Sichuan pepper, cashew.', 30000, 10500, 'FRY', 11, true),
  ('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000003', 'Peri Chicken Bowl', 'Flame-grilled thigh, charred corn, herbed rice.', 36000, 14000, 'GRILL', 13, true),
  ('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000003', 'Crispy Chicken Wrap', 'Buttermilk-brined, slaw, house hot honey.', 29000, 10800, 'FRY', 10, true),
  ('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000004', 'Margherita 10"', '48-hour cold ferment, fior di latte, basil.', 32000, 9600, 'OVEN', 12, true),
  ('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000004', 'Truffle Mushroom 10"', 'Cremini, taleggio, black truffle oil.', 42000, 16500, 'OVEN', 13, true),
  ('33333333-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000011', 'Butter Chicken Bowl', 'Slow-simmered tomato gravy, charred thigh, cultured butter.', 34000, 12800, 'WOK', 14, true),
  ('33333333-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000011', 'Dal Makhani + Rice', 'Black lentils held overnight, finished with cream.', 26000, 7400, 'WOK', 10, true),
  ('33333333-0000-0000-0000-000000000012', '22222222-0000-0000-0000-000000000012', 'Chilli Garlic Noodles', 'Hand-pulled noodles, black vinegar, fried garlic.', 28000, 9200, 'WOK', 8, true),
  ('33333333-0000-0000-0000-000000000013', '22222222-0000-0000-0000-000000000012', 'Kung Pao Cauliflower', 'Twice-fried florets, Sichuan pepper, cashew.', 30000, 10500, 'FRY', 11, true);

insert into stock_items (id, location_id, linked_item_id, name, qty, par, unit) values
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000001', 'Chicken thigh, boneless', 4.2, 24, 'kg'),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000001', 'Cultured butter', 1.1, 5, 'kg'),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000003', 'Paneer', 6.4, 10, 'kg'),
  ('44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000008', 'Fior di latte', 8.0, 10, 'kg'),
  ('44444444-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000004', 'Hand-pulled noodles', 11, 20, 'packs'),
  ('44444444-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000020', '33333333-0000-0000-0000-000000000010', 'Chicken thigh, boneless', 9.5, 18, 'kg'),
  ('44444444-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000020', '33333333-0000-0000-0000-000000000012', 'Hand-pulled noodles', 3, 15, 'packs');

-- One mapping per HSR item, using a plausible aggregator SKU/itemCode — lets
-- the order-ingestion service resolve a real webhook end to end.
insert into aggregator_menu_mappings (channel, external_item_id, menu_item_id) values
  ('zipp', 'ZP-BCB-01', '33333333-0000-0000-0000-000000000001'),
  ('zipp', 'ZP-DAL-02', '33333333-0000-0000-0000-000000000002'),
  ('munchly', 'MU-TRUF-9', '33333333-0000-0000-0000-000000000009');
