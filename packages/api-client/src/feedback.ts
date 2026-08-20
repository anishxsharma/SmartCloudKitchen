import type { OrderFeedback } from '@smartcloudkitchen/types';
import { getSupabase } from './client';

/** What the customer app's "rate your order" prompt calls once an order is picked up. */
export async function submitFeedback(orderId: string, rating: number, comment: string | null): Promise<void> {
  const { error } = await getSupabase().from('order_feedback').insert({ order_id: orderId, rating, comment });
  if (error) throw error;
}

export async function fetchFeedbackForOrder(orderId: string): Promise<OrderFeedback | null> {
  const { data, error } = await getSupabase().from('order_feedback').select('*').eq('order_id', orderId).maybeSingle();
  if (error) throw error;
  return data;
}

export interface FeedbackWithOrder extends OrderFeedback {
  order: { code: string; brand_id: string };
}

/** Recent feedback across whichever locations the caller (staff) can see — what the Sales screen's feedback section reads. */
export async function fetchFeedbackForLocations(locationIds: string[], limit = 20): Promise<FeedbackWithOrder[]> {
  const { data, error } = await getSupabase()
    .from('order_feedback')
    .select('*, order:orders!inner(location_id, code, brand_id)')
    .in('orders.location_id', locationIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as FeedbackWithOrder[];
}
