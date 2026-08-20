import { create } from 'zustand';
import { BRANDS, MENU_ITEMS } from '@smartcloudkitchen/mock-data';
import { nextStage } from '@smartcloudkitchen/domain';
import type { Order, OrderLine } from '@smartcloudkitchen/types';

export interface CartLine {
  menuItemId: string;
  name: string;
  brandName: string;
  priceCents: number;
  station: string;
  qty: number;
}

interface CustomerState {
  now: number;
  shopBrandId: string;
  itemId: string | null;
  qty: number;
  cart: CartLine[];
  orders: Order[];
  lines: OrderLine[];
  trackOrderId: string | null;
  seq: number;

  tick: () => void;
  setShopBrand: (brandId: string) => void;
  openItem: (itemId: string) => void;
  backToBrowse: () => void;
  incQty: () => void;
  decQty: () => void;
  addToCart: () => void;
  cartInc: (menuItemId: string) => void;
  cartDec: (menuItemId: string) => void;
  placeOrder: () => void;
  /** Demo-only: simulates the kitchen bumping the ticket, since there's no
   * live Supabase link yet to receive the real update from the kitchen app. */
  advanceTrackedOrder: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  now: Date.now(),
  shopBrandId: 'b-curry',
  itemId: null,
  qty: 1,
  cart: [],
  orders: [],
  lines: [],
  trackOrderId: null,
  seq: 1047,

  tick: () => set({ now: Date.now() }),
  setShopBrand: (shopBrandId) => set({ shopBrandId }),
  openItem: (itemId) => set({ itemId, qty: 1 }),
  backToBrowse: () => set({ itemId: null }),
  incQty: () => set((s) => ({ qty: s.qty + 1 })),
  decQty: () => set((s) => ({ qty: Math.max(1, s.qty - 1) })),

  addToCart: () => {
    const { itemId, qty, cart } = get();
    const item = MENU_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const brand = BRANDS.find((b) => b.id === item.brand_id);
    const existing = cart.find((c) => c.menuItemId === item.id);
    const nextCart = existing
      ? cart.map((c) => (c.menuItemId === item.id ? { ...c, qty: c.qty + qty } : c))
      : [
          ...cart,
          { menuItemId: item.id, name: item.name, brandName: brand?.name ?? '', priceCents: item.price_cents, station: item.station, qty },
        ];
    set({ cart: nextCart, itemId: null });
  },

  cartInc: (menuItemId) =>
    set((s) => ({ cart: s.cart.map((c) => (c.menuItemId === menuItemId ? { ...c, qty: c.qty + 1 } : c)) })),

  cartDec: (menuItemId) =>
    set((s) => ({
      cart: s.cart.flatMap((c) => {
        if (c.menuItemId !== menuItemId) return [c];
        return c.qty > 1 ? [{ ...c, qty: c.qty - 1 }] : [];
      }),
    })),

  placeOrder: () => {
    const { cart, seq } = get();
    if (!cart.length) return;
    const orderId = `local-${seq}`;
    const firstBrandId = MENU_ITEMS.find((i) => i.id === cart[0].menuItemId)?.brand_id ?? 'b-curry';
    const order: Order = {
      id: orderId,
      location_id: 'loc1',
      brand_id: firstBrandId,
      customer_id: null,
      channel: 'direct',
      external_ref: null,
      code: '#' + seq,
      stage: 'new',
      promise_minutes: 16,
      placed_at: new Date().toISOString(),
      delivery_address_id: null,
      note: 'Direct app order · contactless drop.',
    };
    const lines: OrderLine[] = cart.map((c, idx) => ({
      id: `${orderId}-l${idx}`,
      order_id: orderId,
      menu_item_id: c.menuItemId,
      qty: c.qty,
      note: null,
      done: false,
    }));
    set((s) => ({
      orders: [order, ...s.orders],
      lines: [...lines, ...s.lines],
      cart: [],
      seq: s.seq + 1,
      trackOrderId: orderId,
    }));
  },

  advanceTrackedOrder: () => {
    const { trackOrderId, orders } = get();
    const order = orders.find((o) => o.id === trackOrderId);
    if (!order || order.stage === 'picked') return;
    set((s) => ({
      orders: s.orders.map((o) => (o.id === trackOrderId ? { ...o, stage: nextStage(o.stage) } : o)),
    }));
  },
}));
