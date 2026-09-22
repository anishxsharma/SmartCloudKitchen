import { create } from 'zustand';
import {
  advanceOrder as apiAdvanceOrder,
  errorMessage,
  fetchBrands,
  fetchMenuItems,
  fetchOpenOrders,
  fetchOrder,
  fetchStockItems,
  setMenuItemAvailable,
  subscribeToLocationOrders,
  subscribeToOrderLineChanges,
  toggleOrderLine as apiToggleOrderLine,
} from '@smartcloudkitchen/api-client';
import type { Brand, MenuItem, Order, OrderLine, OrderStage, StockItem } from '@smartcloudkitchen/types';

interface KitchenState {
  now: number;
  loading: boolean;
  error: string | null;
  brands: Brand[];
  items: MenuItem[];
  stock: StockItem[];
  orders: Order[];
  lines: OrderLine[];
  filter: 'all' | OrderStage;
  menuBrandId: string;
  selectedOrderId: string | null;
  stockOrdered: Record<string, boolean>;
  unsubscribe: (() => void) | null;

  tick: () => void;
  setFilter: (f: 'all' | OrderStage) => void;
  setMenuBrand: (brandId: string) => void;
  selectOrder: (id: string | null) => void;
  loadForLocations: (locationIds: string[]) => Promise<void>;
  advanceOrder: (orderId: string) => void;
  toggleLineDone: (lineId: string) => void;
  toggleItemAvailable: (itemId: string) => void;
  requestReorder: (stockId: string) => void;
  /** Re-fetches items for the currently loaded brands — called after creating/editing one from the item form. */
  refreshItems: () => Promise<void>;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  now: Date.now(),
  loading: true,
  error: null,
  brands: [],
  items: [],
  stock: [],
  orders: [],
  lines: [],
  filter: 'all',
  menuBrandId: '',
  selectedOrderId: null,
  stockOrdered: {},
  unsubscribe: null,

  tick: () => set({ now: Date.now() }),
  setFilter: (filter) => set({ filter }),
  setMenuBrand: (menuBrandId) => set({ menuBrandId }),
  selectOrder: (selectedOrderId) => set({ selectedOrderId }),

  loadForLocations: async (locationIds) => {
    get().unsubscribe?.();
    if (!locationIds.length) {
      set({ brands: [], items: [], stock: [], orders: [], lines: [], loading: false, unsubscribe: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const brands = await fetchBrands(locationIds);
      const brandIds = brands.map((b) => b.id);
      const [items, stock, orders] = await Promise.all([
        fetchMenuItems(brandIds),
        fetchStockItems(locationIds),
        fetchOpenOrders(locationIds),
      ]);
      const lines = orders.flatMap((o) => o.lines);

      set((s) => ({
        brands,
        items,
        stock,
        orders,
        lines,
        loading: false,
        menuBrandId: brands.some((b) => b.id === s.menuBrandId) ? s.menuBrandId : (brands[0]?.id ?? ''),
      }));

      const unsubOrders = subscribeToLocationOrders(locationIds, (order, eventType) => {
        if (eventType === 'DELETE') {
          set((s) => ({ orders: s.orders.filter((o) => o.id !== order.id) }));
          return;
        }
        set((s) => {
          const exists = s.orders.some((o) => o.id === order.id);
          return { orders: exists ? s.orders.map((o) => (o.id === order.id ? order : o)) : [...s.orders, order] };
        });
        if (eventType === 'INSERT') {
          // A brand-new order's line items didn't come with this event
          // (order_lines is a separate table/insert) — fetch them so the
          // ticket doesn't render with an empty item list.
          fetchOrder(order.id).then((full) => {
            if (full) set((s) => ({ lines: [...s.lines.filter((l) => l.order_id !== order.id), ...full.lines] }));
          });
        }
      });

      const unsubLines = subscribeToOrderLineChanges((line, eventType) => {
        set((s) => {
          if (!s.orders.some((o) => o.id === line.order_id)) return s; // not an order we're showing
          if (eventType === 'DELETE') return { lines: s.lines.filter((l) => l.id !== line.id) };
          const exists = s.lines.some((l) => l.id === line.id);
          return { lines: exists ? s.lines.map((l) => (l.id === line.id ? line : l)) : [...s.lines, line] };
        });
      });

      set({ unsubscribe: () => { unsubOrders(); unsubLines(); } });
    } catch (err) {
      set({ loading: false, error: errorMessage(err) });
    }
  },

  advanceOrder: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    apiAdvanceOrder(orderId, order.stage).catch((err) => set({ error: errorMessage(err) }));
  },

  toggleLineDone: (lineId) => {
    const line = get().lines.find((l) => l.id === lineId);
    if (!line) return;
    const done = !line.done;
    set((s) => ({ lines: s.lines.map((l) => (l.id === lineId ? { ...l, done } : l)) }));
    apiToggleOrderLine(lineId, done).catch((err) => set({ error: errorMessage(err) }));
  },

  toggleItemAvailable: (itemId) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return;
    const available = !item.available;
    set((s) => ({ items: s.items.map((i) => (i.id === itemId ? { ...i, available } : i)) }));
    setMenuItemAvailable(itemId, available).catch((err) => set({ error: errorMessage(err) }));
  },

  // No purchase-order table yet — this stays a local "I've requested it"
  // flag until reordering is a real backend flow.
  requestReorder: (stockId) => set((s) => ({ stockOrdered: { ...s.stockOrdered, [stockId]: true } })),

  refreshItems: async () => {
    const brandIds = get().brands.map((b) => b.id);
    if (!brandIds.length) return;
    try {
      const items = await fetchMenuItems(brandIds);
      set({ items });
    } catch (err) {
      set({ error: errorMessage(err) });
    }
  },
}));
