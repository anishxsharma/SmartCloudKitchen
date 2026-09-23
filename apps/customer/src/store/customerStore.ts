import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { create } from 'zustand';
import {
  consumeOAuthSession,
  errorMessage,
  fetchAllLocations,
  fetchBrands,
  fetchFeedbackForOrder,
  fetchMenuItems,
  fetchMyCustomer,
  fetchOrder,
  getGoogleOAuthUrl,
  insertDirectOrder,
  resolveOAuthSession,
  sendCustomerOtp,
  signOutCustomer as signOutCustomerAuth,
  submitFeedback,
  upsertCustomerProfile,
  verifyCustomerOtp,
} from '@smartcloudkitchen/api-client';
import type { Brand, Customer, Location, MenuItem, Order, OrderFeedback, OrderLine } from '@smartcloudkitchen/types';
import { OAUTH_MESSAGE_TYPE } from '../hooks/useOAuthPopupSelfClose';

const SELECTED_LOCATION_STORAGE_KEY = 'sck-customer-selected-location-id';

function parseHashParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};
  const params: Record<string, string> = {};
  for (const pair of url.slice(hashIndex + 1).split('&')) {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
  }
  return params;
}

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
  /** Which business/location this session is ordering from — shared marketplace app, so this is picked, not baked in. Persisted in AsyncStorage across app opens. */
  selectedLocationId: string | null;
  /** True once the AsyncStorage check for a previously-picked location has resolved — before this, don't show the picker (would flash it even for a returning customer). */
  locationBootstrapped: boolean;
  locations: Location[];
  locationsLoading: boolean;
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

  /** Checkout identity (phone-OTP or Google) — null until signed in. Session persists across app opens (see api-client's client.ts). */
  customer: Customer | null;
  customerBootstrapped: boolean;
  otpPhone: string | null;
  sendingOtp: boolean;
  verifyingOtp: boolean;
  authError: string | null;
  googleSigningIn: boolean;
  /** Set once a Google session exists but there's no customers row yet — Google gives no phone, so one more step collects it. */
  pendingGoogleProfile: { userId: string; displayName: string | null } | null;
  finishingGoogleSignup: boolean;

  tick: () => void;
  setPushToken: (token: string) => void;
  bootstrapLocation: () => Promise<void>;
  loadLocations: () => Promise<void>;
  selectLocation: (locationId: string) => Promise<void>;
  changeLocation: () => Promise<void>;
  loadCatalog: () => Promise<void>;
  bootstrapCustomer: () => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  cancelPhoneAuth: () => void;
  signInWithGoogle: () => Promise<void>;
  completeGoogleSession: (accessToken: string, refreshToken: string) => Promise<void>;
  finishGoogleSignup: (phone: string) => Promise<void>;
  signOutCustomer: () => Promise<void>;
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
  selectedLocationId: null,
  locationBootstrapped: false,
  locations: [],
  locationsLoading: true,
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

  customer: null,
  customerBootstrapped: false,
  otpPhone: null,
  sendingOtp: false,
  verifyingOtp: false,
  authError: null,
  googleSigningIn: false,
  pendingGoogleProfile: null,
  finishingGoogleSignup: false,

  tick: () => set({ now: Date.now() }),
  setPushToken: (pushToken) => set({ pushToken }),

  bootstrapLocation: async () => {
    try {
      const stored = await AsyncStorage.getItem(SELECTED_LOCATION_STORAGE_KEY);
      set({ selectedLocationId: stored, locationBootstrapped: true });
      if (stored) get().loadCatalog();
    } catch {
      set({ locationBootstrapped: true });
    }
    get().loadLocations();
  },

  loadLocations: async () => {
    set({ locationsLoading: true });
    try {
      const locations = await fetchAllLocations();
      set({ locations, locationsLoading: false });
    } catch (err) {
      set({ locationsLoading: false, error: errorMessage(err) });
    }
  },

  selectLocation: async (locationId) => {
    set({ selectedLocationId: locationId });
    try {
      await AsyncStorage.setItem(SELECTED_LOCATION_STORAGE_KEY, locationId);
    } catch {
      // Non-fatal — worst case the picker shows again next app open.
    }
    await get().loadCatalog();
  },

  changeLocation: async () => {
    set({ selectedLocationId: null, brands: [], items: [], cart: [], shopBrandId: '' });
    try {
      await AsyncStorage.removeItem(SELECTED_LOCATION_STORAGE_KEY);
    } catch {
      // Non-fatal.
    }
  },

  bootstrapCustomer: async () => {
    try {
      const customer = await fetchMyCustomer();
      set({ customer, customerBootstrapped: true });
    } catch {
      set({ customerBootstrapped: true });
    }
  },

  sendOtp: async (phone) => {
    set({ sendingOtp: true, authError: null });
    try {
      await sendCustomerOtp(phone);
      set({ sendingOtp: false, otpPhone: phone });
    } catch (err) {
      set({ sendingOtp: false, authError: errorMessage(err) });
    }
  },

  verifyOtp: async (code) => {
    const { otpPhone } = get();
    if (!otpPhone) return;
    set({ verifyingOtp: true, authError: null });
    try {
      const customer = await verifyCustomerOtp(otpPhone, code);
      set({ customer, verifyingOtp: false, otpPhone: null });
    } catch (err) {
      set({ verifyingOtp: false, authError: errorMessage(err) });
    }
  },

  cancelPhoneAuth: () => set({ otpPhone: null, authError: null }),

  signInWithGoogle: async () => {
    set({ googleSigningIn: true, authError: null });
    try {
      const redirectTo = Linking.createURL('auth-callback');
      const url = await getGoogleOAuthUrl(redirectTo);

      if (Platform.OS === 'web') {
        // A full-page redirect would unmount the app and lose the
        // in-memory cart (nothing persists it across a reload) — a
        // popup keeps the main tab alive. useOAuthPopupSelfClose runs
        // in the popup once it lands back on our origin, hands the
        // session tokens over via postMessage, and closes itself.
        const popup = window.open(url, 'sck-google-auth', 'width=480,height=640');
        const tokens = await new Promise<{ accessToken: string; refreshToken: string } | null>((resolve) => {
          const timer = setInterval(() => {
            if (popup?.closed) {
              clearInterval(timer);
              window.removeEventListener('message', onMessage);
              resolve(null);
            }
          }, 500);
          function onMessage(event: MessageEvent) {
            if (event.origin !== window.location.origin || event.data?.type !== OAUTH_MESSAGE_TYPE) return;
            clearInterval(timer);
            window.removeEventListener('message', onMessage);
            resolve({ accessToken: event.data.accessToken, refreshToken: event.data.refreshToken });
          }
          window.addEventListener('message', onMessage);
        });

        if (!tokens) {
          set({ googleSigningIn: false });
          return;
        }
        await get().completeGoogleSession(tokens.accessToken, tokens.refreshToken);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        set({ googleSigningIn: false });
        return;
      }
      const params = parseHashParams(result.url);
      if (!params.access_token || !params.refresh_token) {
        set({ googleSigningIn: false, authError: 'Google sign-in did not return a session.' });
        return;
      }
      await get().completeGoogleSession(params.access_token, params.refresh_token);
    } catch (err) {
      set({ googleSigningIn: false, authError: errorMessage(err) });
    }
  },

  completeGoogleSession: async (accessToken, refreshToken) => {
    set({ googleSigningIn: true, authError: null });
    try {
      await consumeOAuthSession(accessToken, refreshToken);
      const { userId, displayName, customer } = await resolveOAuthSession();
      if (customer) {
        set({ customer, googleSigningIn: false, pendingGoogleProfile: null });
      } else {
        set({ googleSigningIn: false, pendingGoogleProfile: { userId, displayName } });
      }
    } catch (err) {
      set({ googleSigningIn: false, authError: errorMessage(err) });
    }
  },

  finishGoogleSignup: async (phone) => {
    const { pendingGoogleProfile } = get();
    if (!pendingGoogleProfile) return;
    set({ finishingGoogleSignup: true, authError: null });
    try {
      const customer = await upsertCustomerProfile(pendingGoogleProfile.userId, phone, pendingGoogleProfile.displayName);
      set({ customer, finishingGoogleSignup: false, pendingGoogleProfile: null });
    } catch (err) {
      set({ finishingGoogleSignup: false, authError: errorMessage(err) });
    }
  },

  signOutCustomer: async () => {
    await signOutCustomerAuth();
    set({ customer: null });
  },

  loadCatalog: async () => {
    const { selectedLocationId } = get();
    if (!selectedLocationId) return;
    set({ loading: true, error: null });
    try {
      const brands = await fetchBrands([selectedLocationId]);
      const items = await fetchMenuItems(brands.map((b) => b.id));
      set((s) => ({ brands, items, loading: false, shopBrandId: s.shopBrandId || (brands[0]?.id ?? '') }));
    } catch (err) {
      set({ loading: false, error: errorMessage(err) });
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
    const { cart, items, customer, selectedLocationId } = get();
    if (!cart.length || !customer || !selectedLocationId) return;
    const brandId = items.find((i) => i.id === cart[0].menuItemId)?.brand_id;
    if (!brandId) return;

    set({ placingOrder: true, error: null });
    try {
      const { id } = await insertDirectOrder({
        locationId: selectedLocationId,
        brandId,
        customerId: customer.id,
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
      set({ placingOrder: false, error: errorMessage(err) });
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
      set({ feedbackSubmitting: false, error: errorMessage(err) });
    }
  },
}));
