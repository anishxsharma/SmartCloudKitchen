import { create } from 'zustand';
import {
  fetchBrands,
  fetchFeedbackForOrder,
  fetchMenuItems,
  fetchOrder,
  insertDirectOrder,
  submitFeedback,
} from '@smartcloudkitchen/api-client';
import { CUSTOMER_LOCATION_ID } from '@smartcloudkitchen/mock-data';
import type { Brand, MenuItem, Order, OrderFeedback, OrderLine } from '@smartcloudkitchen/types';

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
  loading: boolean;
  error: string | null;
  brands: Brand[];
  items: MenuItem[];
  shopBrandId: string;
  itemId: string | null;
  qty: number;
  cart: CartLine[];
  orders: Order[];
  lines: OrderLine[];
  trackOrderId: string | null;
  placingOrder: boolean;
  feedback: OrderFeedback | null;
  feedbackLoading: boolean;
  feedbackSubmitting: boolean;
  /** Set once usePushRegistration resolves — see App.tsx. */
  pushToken: string | null;

  tick: () => void;
  setPushToken: (token: string) => void;
  loadCatalog: () => Promise<void>;
  setShopBrand: (brandId: string) => void;
  openItem: (itemId: string) => void;
  backToBrowse: () => void;
  incQty: () => void;
  decQty: () => void;
  addToCart: () => void;
  cartInc: (menuItemId: string) => void;
  cartDec: (menuItemId: string) => void;
  placeOrder: () => Promise<void>;
  onTrackedOrderChange: (order: Order) => void;
  checkFeedback: (orderId: string) => Promise<void>;
  submitOrderFeedback: (rating: number, comment: string | null) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  now: Date.now(),
  loading: true,
  error: null,
  brands: [],
  items: [],
  shopBrandId: '',
  itemId: null,
  qty: 1,
  cart: [],
  orders: [],
  lines: [],
  trackOrderId: null,
  placingOrder: false,
  feedback: null,
  feedbackLoading: false,
  feedbackSubmitting: false,
  pushToken: null,

  tick: () => set({ now: Date.now() }),
  setPushToken: (pushToken) => set({ pushToken }),

  loadCatalog: async () => {
    set({ loading: true, error: null });
    try {
      const brands = await fetchBrands([CUSTOMER_LOCATION_ID]);
      const items = await fetchMenuItems(brands.map((b) => b.id));
      set((s) => ({ brands, items, loading: false, shopBrandId: s.shopBrandId || (brands[0]?.id ?? '') }));
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  setShopBrand: (shopBrandId) => set({ shopBrandId }),
  openItem: (itemId) => set({ itemId, qty: 1 }),
  backToBrowse: () => set({ itemId: null }),
  incQty: () => set((s) => ({ qty: s.qty + 1 })),
  decQty: () => set((s) => ({ qty: Math.max(1, s.qty - 1) })),

  addToCart: () => {
    const { itemId, qty, cart, items, brands } = get();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const brand = brands.find((b) => b.id === item.brand_id);
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

  placeOrder: async () => {
    const { cart, items } = get();
    if (!cart.length) return;
    const brandId = items.find((i) => i.id === cart[0].menuItemId)?.brand_id;
    if (!brandId) return;

    set({ placingOrder: true, error: null });
    try {
      const { id } = await insertDirectOrder({
        locationId: CUSTOMER_LOCATION_ID,
        brandId,
        customerId: null, // no phone-OTP auth yet — see the build plan's Auth section
        promiseMinutes: 16,
        note: 'Direct app order · contactless drop.',
        lines: cart.map((c) => ({ menuItemId: c.menuItemId, qty: c.qty })),
      });
      const full = await fetchOrder(id);
      set((s) => ({
        orders: full ? [full, ...s.orders] : s.orders,
        lines: full ? [...full.lines, ...s.lines] : s.lines,
        cart: [],
        trackOrderId: id,
        placingOrder: false,
        feedback: null,
      }));
    } catch (err) {
      set({ placingOrder: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  /** Fed by subscribeToOrder in TrackScreen — a real update from the kitchen app. */
  onTrackedOrderChange: (order) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === order.id ? { ...o, ...order } : o)) })),

  /** Called once an order reaches "picked" — avoids re-prompting if this device already rated it. */
  checkFeedback: async (orderId) => {
    set({ feedbackLoading: true });
    try {
      const feedback = await fetchFeedbackForOrder(orderId);
      set({ feedback, feedbackLoading: false });
    } catch {
      set({ feedbackLoading: false });
    }
  },

  submitOrderFeedback: async (rating, comment) => {
    const { trackOrderId } = get();
    if (!trackOrderId) return;
    set({ feedbackSubmitting: true, error: null });
    try {
      await submitFeedback(trackOrderId, rating, comment);
      set({
        feedbackSubmitting: false,
        feedback: { id: '', order_id: trackOrderId, customer_id: null, rating, comment, created_at: new Date().toISOString() },
      });
    } catch (err) {
      set({ feedbackSubmitting: false, error: err instanceof Error ? err.message : String(err) });
    }
  },
}));
