import { create } from 'zustand';
import { MENU_ITEMS, STOCK_ITEMS, seedOrders } from '@smartcloudkitchen/mock-data';
import type { MenuItem, Order, OrderLine, OrderStage, StockItem } from '@smartcloudkitchen/types';
import { nextStage } from '@smartcloudkitchen/domain';

const seed = seedOrders();

interface KitchenState {
  now: number;
  items: MenuItem[];
  stock: StockItem[];
  orders: Order[];
  lines: OrderLine[];
  filter: 'all' | OrderStage;
  menuBrandId: string;
  selectedOrderId: string | null;
  stockOrdered: Record<string, boolean>;

  tick: () => void;
  setFilter: (f: 'all' | OrderStage) => void;
  setMenuBrand: (brandId: string) => void;
  selectOrder: (id: string | null) => void;
  advanceOrder: (orderId: string) => void;
  toggleLineDone: (lineId: string) => void;
  toggleItemAvailable: (itemId: string) => void;
  requestReorder: (stockId: string) => void;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  now: Date.now(),
  items: MENU_ITEMS,
  stock: STOCK_ITEMS,
  orders: seed.orders,
  lines: seed.lines,
  filter: 'all',
  menuBrandId: 'b-curry',
  selectedOrderId: null,
  stockOrdered: {},

  tick: () => set({ now: Date.now() }),
  setFilter: (filter) => set({ filter }),
  setMenuBrand: (menuBrandId) => set({ menuBrandId }),
  selectOrder: (selectedOrderId) => set({ selectedOrderId }),

  advanceOrder: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    const stage = nextStage(order.stage);
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, stage } : o)),
      lines: stage === 'ready' ? s.lines.map((l) => (l.order_id === orderId ? { ...l, done: true } : l)) : s.lines,
    }));
  },

  toggleLineDone: (lineId) =>
    set((s) => ({ lines: s.lines.map((l) => (l.id === lineId ? { ...l, done: !l.done } : l)) })),

  toggleItemAvailable: (itemId) =>
    set((s) => ({ items: s.items.map((i) => (i.id === itemId ? { ...i, available: !i.available } : i)) })),

  requestReorder: (stockId) => set((s) => ({ stockOrdered: { ...s.stockOrdered, [stockId]: true } })),
}));
