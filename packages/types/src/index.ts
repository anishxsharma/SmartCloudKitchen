export type OrderStage = 'new' | 'cooking' | 'ready' | 'picked';
export type Channel = 'direct' | 'zipp' | 'munchly';
export type StaffRole = 'line_cook' | 'kitchen_manager' | 'owner';
export type Station = 'WOK' | 'GRILL' | 'FRY' | 'OVEN';

export interface Organization {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  org_id: string;
  name: string;
  timezone: string;
}

export interface Brand {
  id: string;
  location_id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  brand_id: string;
  name: string;
  price_cents: number;
  cost_cents: number;
  station: Station;
  prep_minutes: number;
  available: boolean;
  description?: string | null;
  image_url?: string | null;
}

export interface StockItem {
  id: string;
  location_id: string;
  linked_item_id: string | null;
  name: string;
  qty: number;
  par: number;
  unit: string;
}

export interface Customer {
  id: string;
  phone: string;
  display_name: string | null;
}

export interface Address {
  id: string;
  customer_id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * A staff row is scoped one of two ways: line cooks and kitchen managers
 * carry a single location_id; an owner instead carries org_id (and a null
 * location_id), giving them every location under that org. Never both —
 * enforced by a check constraint in the schema, mirrored here as a union.
 */
export type Staff =
  | { id: string; display_name: string; role: 'line_cook' | 'kitchen_manager'; location_id: string; org_id: null }
  | { id: string; display_name: string; role: 'owner'; location_id: null; org_id: string };

export interface Order {
  id: string;
  location_id: string;
  brand_id: string;
  customer_id: string | null;
  channel: Channel;
  external_ref: string | null;
  code: string;
  stage: OrderStage;
  promise_minutes: number;
  placed_at: string;
  /** Set by a DB trigger the instant stage first becomes 'ready' — drives the real avg-prep-time metric. */
  ready_at?: string | null;
  picked_at?: string | null;
  delivery_address_id: string | null;
  note?: string | null;
}

export interface OrderLine {
  id: string;
  order_id: string;
  menu_item_id: string;
  qty: number;
  note: string | null;
  done: boolean;
  /** Snapshotted from menu_items at order time — a later price/cost edit must never reprice a past order. */
  price_cents: number;
  cost_cents: number;
}

/** Order with its lines eager-loaded — the shape both apps actually render. */
export interface OrderWithLines extends Order {
  lines: OrderLine[];
}

export interface OrderFeedback {
  id: string;
  order_id: string;
  customer_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

/** Rows from the daily_sales_by_location view — real numbers, not fixtures. */
export interface DailyLocationSales {
  location_id: string;
  day: string;
  completed_orders: number;
  revenue_cents: number;
  cost_cents: number;
  avg_prep_seconds: number | null;
}

export interface DailyBrandSales {
  location_id: string;
  brand_id: string;
  brand_name: string;
  day: string;
  completed_orders: number;
  revenue_cents: number;
  cost_cents: number;
}

export interface HourlyOrders {
  location_id: string;
  day: string;
  hour: number;
  order_count: number;
}
