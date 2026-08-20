import { nextStage } from '@smartcloudkitchen/domain';
import type { Channel, Order, OrderLine, OrderStage, OrderWithLines } from '@smartcloudkitchen/types';
import { getSupabase } from './client';

/**
 * Every subscribe* call below suffixes its channel name with one of
 * these. Supabase's realtime client reuses an existing channel object
 * when you call .channel() with a topic it already has open — if a
 * caller's cleanup (removeChannel, which is async) hasn't finished
 * before the same effect fires again with the same topic (React's dev
 * double-invoke, a fast reconnect, whatever), .on() then throws "cannot
 * add postgres_changes callbacks ... after subscribe()" on the reused,
 * already-subscribed object. A unique suffix per call means there's
 * never a topic to collide on in the first place.
 */
let channelSeq = 0;
function channelInstanceId(): string {
  channelSeq += 1;
  return `${Date.now()}-${channelSeq}`;
}

/** Open tickets across one or more locations — what the kitchen queue screen renders (an owner can view several at once). */
export async function fetchOpenOrders(locationIds: string[]): Promise<OrderWithLines[]> {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*, order_lines(*)')
    .in('location_id', locationIds)
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
    .update({ stage: nextStage(currentStage) })
    .eq('id', orderId);

  if (error) throw error;
}

export async function toggleOrderLine(lineId: string, done: boolean) {
  const { error } = await getSupabase().from('order_lines').update({ done }).eq('id', lineId);
  if (error) throw error;
}

export interface NewOrderLine {
  menuItemId: string;
  qty: number;
  note?: string | null;
}

/** Places a direct (non-aggregator) order — what the customer app's checkout calls. */
export async function insertDirectOrder(input: {
  locationId: string;
  brandId: string;
  customerId: string | null;
  promiseMinutes: number;
  note: string | null;
  lines: NewOrderLine[];
}): Promise<{ id: string; code: string }> {
  const supabase = getSupabase();

  const codeResult = await supabase.rpc('next_order_code');
  if (codeResult.error) throw codeResult.error;
  const code = codeResult.data as string;

  const orderInsert = await supabase
    .from('orders')
    .insert({
      location_id: input.locationId,
      brand_id: input.brandId,
      customer_id: input.customerId,
      channel: 'direct' satisfies Channel,
      code,
      stage: 'new',
      promise_minutes: input.promiseMinutes,
      note: input.note,
    })
    .select('id')
    .single();

  if (orderInsert.error) throw orderInsert.error;
  const orderId = orderInsert.data.id as string;

  const linesInsert = await supabase.from('order_lines').insert(
    input.lines.map((l) => ({ order_id: orderId, menu_item_id: l.menuItemId, qty: l.qty, note: l.note ?? null, done: false }))
  );
  if (linesInsert.error) throw linesInsert.error;

  return { id: orderId, code };
}

/**
 * Subscribe to every order change across one or more locations — this is
 * the realtime pipe the kitchen queue and the customer tracker both ride
 * on. Realtime filters don't support "in (...)", so for more than one
 * location this subscribes unfiltered and lets the caller check
 * membership; fine at this scale, revisit if a single kitchen ever needs
 * to ignore a flood of other locations' traffic. Returns an unsubscribe
 * function; call it from a useEffect cleanup.
 */
export function subscribeToLocationOrders(
  locationIds: string[],
  onChange: (order: Order, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) {
  const filter = locationIds.length === 1 ? `location_id=eq.${locationIds[0]}` : undefined;
  const channel = getSupabase()
    .channel(`orders:${locationIds.join(',')}:${channelInstanceId()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', ...(filter ? { filter } : {}) },
      (payload) => {
        const order = payload.new as Order;
        if (locationIds.includes(order.location_id)) {
          onChange(order, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
        }
      }
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(channel);
  };
}

/**
 * Subscribe to order_lines changes across whatever orders the caller
 * currently cares about — realtime can't filter by a join to orders, so
 * this comes through unfiltered and the caller checks membership
 * (mirrors subscribeToLocationOrders for the same reason).
 */
export function subscribeToOrderLineChanges(
  onChange: (line: OrderLine, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) {
  const channel = getSupabase()
    .channel(`order_lines:all:${channelInstanceId()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_lines' }, (payload) => {
      const line = (payload.eventType === 'DELETE' ? payload.old : payload.new) as OrderLine;
      onChange(line, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
    })
    .subscribe();

  return () => {
    getSupabase().removeChannel(channel);
  };
}

/** Subscribe to a single order — what the customer tracking screen uses. */
export function subscribeToOrder(orderId: string, onChange: (order: Order) => void) {
  const channel = getSupabase()
    .channel(`orders:id:${orderId}:${channelInstanceId()}`)
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
