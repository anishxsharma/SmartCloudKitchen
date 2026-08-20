import type { SupabaseClient } from '@supabase/supabase-js';
import { IngestError, type NormalizedOrder } from './types.js';

export interface IngestResult {
  orderId: string;
  code: string;
  idempotent: boolean;
}

/**
 * Writes a normalized aggregator order into the same orders/order_lines
 * tables both apps already read from — by the time this returns, the
 * kitchen queue's realtime subscription picks it up exactly like a direct
 * order. Runs with the service role, so it bypasses RLS by design; that's
 * appropriate here since this is a trusted backend service, not a staff
 * or customer session.
 */
export async function ingestNormalizedOrder(
  supabase: SupabaseClient,
  normalized: NormalizedOrder
): Promise<IngestResult> {
  const existing = await supabase
    .from('orders')
    .select('id, code')
    .eq('channel', normalized.channel)
    .eq('external_ref', normalized.externalOrderId)
    .maybeSingle();

  if (existing.error) throw new IngestError(`Idempotency check failed: ${existing.error.message}`, 500);
  if (existing.data) return { orderId: existing.data.id, code: existing.data.code, idempotent: true };

  const externalItemIds = normalized.lines.map((l) => l.externalItemId);
  const mappings = await supabase
    .from('aggregator_menu_mappings')
    .select('external_item_id, menu_item_id, menu_items(brand_id, brands(location_id))')
    .eq('channel', normalized.channel)
    .in('external_item_id', externalItemIds);

  if (mappings.error) throw new IngestError(`Menu mapping lookup failed: ${mappings.error.message}`, 500);

  const byExternalId = new Map(mappings.data.map((m) => [m.external_item_id, m]));
  const unmapped = externalItemIds.filter((id) => !byExternalId.has(id));
  if (unmapped.length) {
    throw new IngestError(
      `No menu mapping for ${normalized.channel} item(s): ${unmapped.join(', ')}. Add a row to aggregator_menu_mappings first.`,
      422
    );
  }

  const brandIds = new Set(mappings.data.map((m) => (m.menu_items as any).brand_id));
  if (brandIds.size > 1) {
    throw new IngestError('Order spans more than one brand — each aggregator listing should map to a single brand.', 422);
  }
  const [brandId] = brandIds;
  const locationId = (mappings.data[0].menu_items as any).brands.location_id as string;

  const codeResult = await supabase.rpc('next_order_code');
  if (codeResult.error) throw new IngestError(`Code generation failed: ${codeResult.error.message}`, 500);
  const code = codeResult.data as string;

  const orderInsert = await supabase
    .from('orders')
    .insert({
      location_id: locationId,
      brand_id: brandId,
      customer_id: null,
      channel: normalized.channel,
      external_ref: normalized.externalOrderId,
      code,
      stage: 'new',
      promise_minutes: normalized.promiseMinutes,
      note: normalized.note,
    })
    .select('id')
    .single();

  if (orderInsert.error) throw new IngestError(`Order insert failed: ${orderInsert.error.message}`, 500);
  const orderId = orderInsert.data.id as string;

  const lineRows = normalized.lines.map((line) => ({
    order_id: orderId,
    menu_item_id: byExternalId.get(line.externalItemId)!.menu_item_id,
    qty: line.qty,
    note: line.note,
    done: false,
  }));

  const linesInsert = await supabase.from('order_lines').insert(lineRows);
  if (linesInsert.error) throw new IngestError(`Order line insert failed: ${linesInsert.error.message}`, 500);

  return { orderId, code, idempotent: false };
}
