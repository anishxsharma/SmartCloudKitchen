import type { Order, OrderLine, OrderStage, OrderWithLines } from '@smartcloudkitchen/types';
import { getSupabase } from './client';

const NEXT_STAGE: Record<OrderStage, OrderStage> = {
  new: 'cooking',
  cooking: 'ready',
  ready: 'picked',
  picked: 'picked',
};

/** Open tickets for a location — everything the kitchen queue screen renders. */
export async function fetchOpenOrders(locationId: string): Promise<OrderWithLines[]> {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*, order_lines(*)')
    .eq('location_id', locationId)
    .neq('stage', 'picked')
    .order('placed_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, lines: row.order_lines as OrderLine[] }));
}

/** The one order a customer is currently tracking. */
export async function fetchOrder(orderId: string): Promise<OrderWithLines | null> {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*, order_lines(*)')
    .eq('id', orderId)
    .single();

  if (error) return null;
  return { ...data, lines: data.order_lines as OrderLine[] };
}

/** Bump a ticket to its next stage — mirrors the prototype's advance(id). */
export async function advanceOrder(orderId: string, currentStage: OrderStage) {
  const { error } = await getSupabase()
    .from('orders')
    .update({ stage: NEXT_STAGE[currentStage] })
    .eq('id', orderId);

  if (error) throw error;
}

export function toggleOrderLine(lineId: string, done: boolean) {
  return getSupabase().from('order_lines').update({ done }).eq('id', lineId);
}

/**
 * Subscribe to every order change for a location — this is the realtime
 * pipe the kitchen queue and the customer tracker both ride on. Returns an
 * unsubscribe function; call it from a useEffect cleanup.
 */
export function subscribeToLocationOrders(locationId: string, onChange: (order: Order) => void) {
  const channel = getSupabase()
    .channel(`orders:location:${locationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `location_id=eq.${locationId}` },
      (payload) => onChange(payload.new as Order)
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(channel);
  };
}

/** Subscribe to a single order — what the customer tracking screen uses. */
export function subscribeToOrder(orderId: string, onChange: (order: Order) => void) {
  const channel = getSupabase()
    .channel(`orders:id:${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => onChange(payload.new as Order)
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(channel);
  };
}
