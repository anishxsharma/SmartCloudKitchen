import type { Brand, Location, MenuItem, StockItem } from '@smartcloudkitchen/types';
import { getSupabase } from './client';

export async function fetchLocations(locationIds: string[]): Promise<Location[]> {
  const { data, error } = await getSupabase().from('locations').select('*').in('id', locationIds);
  if (error) throw error;
  return data ?? [];
}

export async function fetchBrands(locationIds: string[]): Promise<Brand[]> {
  const { data, error } = await getSupabase().from('brands').select('*').in('location_id', locationIds);
  if (error) throw error;
  return data ?? [];
}

export async function fetchMenuItems(brandIds: string[]): Promise<MenuItem[]> {
  const { data, error } = await getSupabase().from('menu_items').select('*').in('brand_id', brandIds);
  if (error) throw error;
  return data ?? [];
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
