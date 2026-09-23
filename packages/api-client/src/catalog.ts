import type { Brand, Location, MenuItem, StockItem } from '@smartcloudkitchen/types';
import { getSupabase } from './client';

export async function fetchLocations(locationIds: string[]): Promise<Location[]> {
  const { data, error } = await getSupabase().from('locations').select('*').in('id', locationIds);
  if (error) throw error;
  return data ?? [];
}

/** Every location in an org — what an owner's LocationSwitcher lists, replacing the old hardcoded mock-data filter. */
export async function fetchLocationsForOrg(orgId: string): Promise<Location[]> {
  const { data, error } = await getSupabase().from('locations').select('*').eq('org_id', orgId);
  if (error) throw error;
  return data ?? [];
}

/** Every location across every business on the platform — the customer app's "choose a kitchen" picker (public_read_locations, 0019). */
export async function fetchAllLocations(): Promise<Location[]> {
  const { data, error } = await getSupabase().from('locations').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export interface CreateLocationInput {
  orgId: string;
  name: string;
  timezone?: string;
}

/** Owner-only (owner_insert_locations RLS, 0018) — an owner adding a new city location to their own org. */
export async function createLocation(input: CreateLocationInput): Promise<Location> {
  const { data, error } = await getSupabase()
    .from('locations')
    .insert({ org_id: input.orgId, name: input.name, timezone: input.timezone ?? 'Asia/Kolkata' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBrands(locationIds: string[]): Promise<Brand[]> {
  const { data, error } = await getSupabase().from('brands').select('*').in('location_id', locationIds);
  if (error) throw error;
  return data ?? [];
}

// cost_cents is deliberately excluded — it's revoked at the column level
// for `authenticated` (0016) so it can be scoped per-org instead of
// readable by any staff member platform-wide. Use fetchMenuItemCosts for
// the one place (menu editing) that legitimately needs it.
const MENU_ITEM_COLUMNS = 'id, brand_id, name, description, price_cents, station, prep_minutes, available, image_url';

export async function fetchMenuItems(brandIds: string[]): Promise<MenuItem[]> {
  const { data, error } = await getSupabase().from('menu_items').select(MENU_ITEM_COLUMNS).in('brand_id', brandIds);
  if (error) throw error;
  return data ?? [];
}

/** cost_cents per menu item, scoped to the caller's own org/location via the menu_item_costs view (see 0016). */
export async function fetchMenuItemCosts(brandIds: string[]): Promise<Record<string, number>> {
  const { data, error } = await getSupabase().from('menu_item_costs').select('menu_item_id, cost_cents').in('brand_id', brandIds);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.menu_item_id, r.cost_cents]));
}

export async function fetchStockItems(locationIds: string[]): Promise<StockItem[]> {
  const { data, error } = await getSupabase().from('stock_items').select('*').in('location_id', locationIds);
  if (error) throw error;
  return data ?? [];
}

export async function setMenuItemAvailable(menuItemId: string, available: boolean) {
  const { error } = await getSupabase().from('menu_items').update({ available }).eq('id', menuItemId);
  if (error) throw error;
}

export interface MenuItemInput {
  brandId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  costCents: number;
  station: MenuItem['station'];
  prepMinutes: number;
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  const { data, error } = await getSupabase()
    .from('menu_items')
    .insert({
      brand_id: input.brandId,
      name: input.name,
      description: input.description ?? null,
      price_cents: input.priceCents,
      cost_cents: input.costCents,
      station: input.station,
      prep_minutes: input.prepMinutes,
      available: true,
    })
    .select(MENU_ITEM_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export interface MenuItemPatch {
  name?: string;
  description?: string | null;
  price_cents?: number;
  cost_cents?: number;
  station?: MenuItem['station'];
  prep_minutes?: number;
  image_url?: string | null;
}

export async function updateMenuItem(menuItemId: string, patch: MenuItemPatch) {
  const { error } = await getSupabase().from('menu_items').update(patch).eq('id', menuItemId);
  if (error) throw error;
}

/**
 * Uploads a locally-picked photo (expo-image-picker's asset.uri) to the
 * public menu-item-photos bucket and returns its public URL — save that
 * onto menu_items.image_url via updateMenuItem separately, so a failed
 * save doesn't need to re-upload.
 */
export async function uploadMenuItemPhoto(menuItemId: string, localUri: string, contentType = 'image/jpeg'): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const ext = contentType.split('/')[1] ?? 'jpg';
  const path = `${menuItemId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await getSupabase()
    .storage.from('menu-item-photos')
    .upload(path, blob, { contentType, upsert: true });
  if (uploadError) throw uploadError;

  const { data } = getSupabase().storage.from('menu-item-photos').getPublicUrl(path);
  return data.publicUrl;
}
