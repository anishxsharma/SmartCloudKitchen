import type { DailyBrandSales, DailyLocationSales, HourlyOrders } from '@smartcloudkitchen/types';
import { getSupabase } from './client';

/** UTC midnight range for "today" — matches how the views bucket `day` (see 0010's comment on timezone handling). */
function todayRangeUtc(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function fetchTodaySalesByLocation(locationIds: string[]): Promise<DailyLocationSales[]> {
  const { start, end } = todayRangeUtc();
  const { data, error } = await getSupabase()
    .from('daily_sales_by_location')
    .select('*')
    .in('location_id', locationIds)
    .gte('day', start)
    .lt('day', end);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTodaySalesByBrand(locationIds: string[]): Promise<DailyBrandSales[]> {
  const { start, end } = todayRangeUtc();
  const { data, error } = await getSupabase()
    .from('daily_sales_by_brand')
    .select('*')
    .in('location_id', locationIds)
    .gte('day', start)
    .lt('day', end);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTodayHourly(locationIds: string[]): Promise<HourlyOrders[]> {
  const { start, end } = todayRangeUtc();
  const { data, error } = await getSupabase()
    .from('hourly_orders_by_location')
    .select('*')
    .in('location_id', locationIds)
    .gte('day', start)
    .lt('day', end);
  if (error) throw error;
  return data ?? [];
}
