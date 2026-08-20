import { z } from 'zod';
import type { NormalizedOrder } from '../types.js';

// Zipp's webhook shape — flat, SKU-based line items.
export const zippPayloadSchema = z.object({
  order_id: z.string().min(1),
  promised_minutes: z.number().int().positive(),
  special_instructions: z.string().nullable().default(null),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        quantity: z.number().int().positive(),
        notes: z.string().nullable().default(null),
      })
    )
    .min(1),
});

export type ZippPayload = z.infer<typeof zippPayloadSchema>;

export function normalizeZippOrder(payload: ZippPayload): NormalizedOrder {
  return {
    channel: 'zipp',
    externalOrderId: payload.order_id,
    promiseMinutes: payload.promised_minutes,
    note: payload.special_instructions,
    lines: payload.items.map((item) => ({
      externalItemId: item.sku,
      qty: item.quantity,
      note: item.notes,
    })),
  };
}
