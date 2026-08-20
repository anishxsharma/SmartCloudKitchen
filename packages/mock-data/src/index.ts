import type { Brand, Location, MenuItem, Order, OrderLine, Organization, Staff, StockItem } from '@smartcloudkitchen/types';

/**
 * Fixture data ported from the SmartCloudKitchen .dc.html prototype — same
 * four brands, nine dishes, five stock lines, five seed orders, now spread
 * across two locations for Phase 2's multi-location/role work. Used to
 * drive both apps' screens before a real Supabase project is wired in;
 * every call site that touches this goes through the same shapes the real
 * api-client queries return, so swapping the source later is mechanical.
 */

export const ORG: Organization = { id: 'org1', name: 'SmartCloudKitchen' };

export const LOCATIONS: Location[] = [
  { id: 'loc1', org_id: 'org1', name: 'HSR Kitchen 04', timezone: 'Asia/Kolkata' },
  { id: 'loc2', org_id: 'org1', name: 'Indiranagar Kitchen 02', timezone: 'Asia/Kolkata' },
];
/** @deprecated single-location holdover from Phase 0/1 — use LOCATIONS. */
export const LOCATION: Location = LOCATIONS[0];

/**
 * Which kitchen serves a given customer app session — resolved from their
 * delivery address in the real app (see the build plan's address model);
 * fixed here since there's no real address flow yet.
 */
export const CUSTOMER_LOCATION_ID = 'loc1';

export const STAFF: Staff[] = [
  { id: 'staff-cook-1', display_name: 'Ravi K.', role: 'line_cook', location_id: 'loc1', org_id: null },
  { id: 'staff-mgr-1', display_name: 'Ayesha N.', role: 'kitchen_manager', location_id: 'loc1', org_id: null },
  { id: 'staff-cook-2', display_name: 'Deepak S.', role: 'line_cook', location_id: 'loc2', org_id: null },
  { id: 'staff-owner-1', display_name: 'Meera R.', role: 'owner', location_id: null, org_id: 'org1' },
];

export const BRANDS: Brand[] = [
  { id: 'b-curry', location_id: 'loc1', name: 'Curry Line' },
  { id: 'b-wok', location_id: 'loc1', name: 'Wok Theory' },
  { id: 'b-bowl', location_id: 'loc1', name: 'Bowl & Bird' },
  { id: 'b-slice', location_id: 'loc1', name: 'Slice Lab' },
  { id: 'b2-curry', location_id: 'loc2', name: 'Curry Line' },
  { id: 'b2-wok', location_id: 'loc2', name: 'Wok Theory' },
];

export const MENU_ITEMS: MenuItem[] = [
  { id: 'i1', brand_id: 'b-curry', name: 'Butter Chicken Bowl', price_cents: 34000, cost_cents: 12800, station: 'WOK', prep_minutes: 14, available: true, description: 'Slow-simmered tomato gravy, charred thigh, cultured butter.' },
  { id: 'i2', brand_id: 'b-curry', name: 'Dal Makhani + Rice', price_cents: 26000, cost_cents: 7400, station: 'WOK', prep_minutes: 10, available: true, description: 'Black lentils held overnight, finished with cream.' },
  { id: 'i3', brand_id: 'b-curry', name: 'Paneer Tikka Roll', price_cents: 22000, cost_cents: 8800, station: 'GRILL', prep_minutes: 9, available: true, description: 'Coal-smoked paneer, pickled onion, mint.' },
  { id: 'i4', brand_id: 'b-wok', name: 'Chilli Garlic Noodles', price_cents: 28000, cost_cents: 9200, station: 'WOK', prep_minutes: 8, available: true, description: "Hand-pulled noodles, black vinegar, fried garlic." },
  { id: 'i5', brand_id: 'b-wok', name: 'Kung Pao Cauliflower', price_cents: 30000, cost_cents: 10500, station: 'FRY', prep_minutes: 11, available: true, description: 'Twice-fried florets, Sichuan pepper, cashew.' },
  { id: 'i6', brand_id: 'b-bowl', name: 'Peri Chicken Bowl', price_cents: 36000, cost_cents: 14000, station: 'GRILL', prep_minutes: 13, available: true, description: 'Flame-grilled thigh, charred corn, herbed rice.' },
  { id: 'i7', brand_id: 'b-bowl', name: 'Crispy Chicken Wrap', price_cents: 29000, cost_cents: 10800, station: 'FRY', prep_minutes: 10, available: true, description: 'Buttermilk-brined, slaw, house hot honey.' },
  { id: 'i8', brand_id: 'b-slice', name: 'Margherita 10"', price_cents: 32000, cost_cents: 9600, station: 'OVEN', prep_minutes: 12, available: true, description: '48-hour cold ferment, fior di latte, basil.' },
  { id: 'i9', brand_id: 'b-slice', name: 'Truffle Mushroom 10"', price_cents: 42000, cost_cents: 16500, station: 'OVEN', prep_minutes: 13, available: true, description: 'Cremini, taleggio, black truffle oil.' },
  { id: 'i10', brand_id: 'b2-curry', name: 'Butter Chicken Bowl', price_cents: 34000, cost_cents: 12800, station: 'WOK', prep_minutes: 14, available: true, description: 'Slow-simmered tomato gravy, charred thigh, cultured butter.' },
  { id: 'i11', brand_id: 'b2-curry', name: 'Dal Makhani + Rice', price_cents: 26000, cost_cents: 7400, station: 'WOK', prep_minutes: 10, available: true, description: 'Black lentils held overnight, finished with cream.' },
  { id: 'i12', brand_id: 'b2-wok', name: 'Chilli Garlic Noodles', price_cents: 28000, cost_cents: 9200, station: 'WOK', prep_minutes: 8, available: true, description: "Hand-pulled noodles, black vinegar, fried garlic." },
  { id: 'i13', brand_id: 'b2-wok', name: 'Kung Pao Cauliflower', price_cents: 30000, cost_cents: 10500, station: 'FRY', prep_minutes: 11, available: true, description: 'Twice-fried florets, Sichuan pepper, cashew.' },
];

export const STOCK_ITEMS: StockItem[] = [
  { id: 's1', location_id: 'loc1', linked_item_id: 'i1', name: 'Chicken thigh, boneless', qty: 4.2, par: 24, unit: 'kg' },
  { id: 's2', location_id: 'loc1', linked_item_id: 'i1', name: 'Cultured butter', qty: 1.1, par: 5, unit: 'kg' },
  { id: 's3', location_id: 'loc1', linked_item_id: 'i3', name: 'Paneer', qty: 6.4, par: 10, unit: 'kg' },
  { id: 's4', location_id: 'loc1', linked_item_id: 'i8', name: 'Fior di latte', qty: 8.0, par: 10, unit: 'kg' },
  { id: 's5', location_id: 'loc1', linked_item_id: 'i4', name: 'Hand-pulled noodles', qty: 11, par: 20, unit: 'packs' },
  { id: 's6', location_id: 'loc2', linked_item_id: 'i10', name: 'Chicken thigh, boneless', qty: 9.5, par: 18, unit: 'kg' },
  { id: 's7', location_id: 'loc2', linked_item_id: 'i12', name: 'Hand-pulled noodles', qty: 3, par: 15, unit: 'packs' },
];

interface SeedLine {
  menu_item_id: string;
  qty: number;
  note: string | null;
  done: boolean;
}

interface SeedOrder {
  code: string;
  brand_id: string;
  channel: Order['channel'];
  minutesAgo: number;
  promise_minutes: number;
  stage: Order['stage'];
  note: string | null;
  lines: SeedLine[];
}

const SEED_ORDERS: SeedOrder[] = [
  {
    code: '#1042', brand_id: 'b-curry', channel: 'zipp', minutesAgo: 9, promise_minutes: 18, stage: 'cooking',
    note: 'No onions. Extra napkins.',
    lines: [
      { menu_item_id: 'i1', qty: 2, note: 'mild', done: true },
      { menu_item_id: 'i2', qty: 1, note: 'no cream', done: false },
    ],
  },
  {
    code: '#1043', brand_id: 'b-slice', channel: 'munchly', minutesAgo: 15, promise_minutes: 16, stage: 'cooking',
    note: 'Cut into 8. Ring on arrival.',
    lines: [{ menu_item_id: 'i9', qty: 1, note: 'well done', done: false }],
  },
  {
    code: '#1044', brand_id: 'b-wok', channel: 'direct', minutesAgo: 2, promise_minutes: 15, stage: 'new',
    note: 'Add chopsticks.',
    lines: [
      { menu_item_id: 'i4', qty: 2, note: 'extra hot', done: false },
      { menu_item_id: 'i5', qty: 1, note: null, done: false },
    ],
  },
  {
    code: '#1045', brand_id: 'b-bowl', channel: 'zipp', minutesAgo: 12, promise_minutes: 17, stage: 'ready',
    note: 'Leave at gate.',
    lines: [{ menu_item_id: 'i6', qty: 1, note: 'hot sauce', done: true }],
  },
  {
    code: '#1046', brand_id: 'b-curry', channel: 'munchly', minutesAgo: 4, promise_minutes: 18, stage: 'new',
    note: null,
    lines: [{ menu_item_id: 'i3', qty: 3, note: null, done: false }],
  },
  {
    code: '#2031', brand_id: 'b2-curry', channel: 'zipp', minutesAgo: 6, promise_minutes: 18, stage: 'new',
    note: 'Ring twice.',
    lines: [{ menu_item_id: 'i10', qty: 1, note: null, done: false }],
  },
  {
    code: '#2032', brand_id: 'b2-wok', channel: 'direct', minutesAgo: 11, promise_minutes: 15, stage: 'cooking',
    note: null,
    lines: [{ menu_item_id: 'i12', qty: 2, note: 'extra spicy', done: false }],
  },
];

/** Fresh seed orders relative to "now" — call once when a mock store boots. */
export function seedOrders(now: number = Date.now()): { orders: Order[]; lines: OrderLine[] } {
  const orders: Order[] = [];
  const lines: OrderLine[] = [];

  SEED_ORDERS.forEach((seed, orderIdx) => {
    const orderId = `seed-${orderIdx}`;
    const locationId = BRANDS.find((b) => b.id === seed.brand_id)?.location_id ?? 'loc1';
    orders.push({
      id: orderId,
      location_id: locationId,
      brand_id: seed.brand_id,
      customer_id: null,
      channel: seed.channel,
      external_ref: null,
      code: seed.code,
      stage: seed.stage,
      promise_minutes: seed.promise_minutes,
      placed_at: new Date(now - seed.minutesAgo * 60_000).toISOString(),
      delivery_address_id: null,
      note: seed.note,
    });
    seed.lines.forEach((line, lineIdx) => {
      lines.push({
        id: `${orderId}-l${lineIdx}`,
        order_id: orderId,
        menu_item_id: line.menu_item_id,
        qty: line.qty,
        note: line.note,
        done: line.done,
      });
    });
  });

  return { orders, lines };
}
