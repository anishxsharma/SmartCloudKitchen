import { z } from 'zod';
import type { NormalizedOrder } from '../types.js';

// Munchly's webhook shape — nested, itemCode-based line items. Genuinely
// different field names/structure from Zipp's, which is the point: each
// aggregator gets its own schema and mapper rather than one "flexible"
// parser trying to cover both.
export const munchlyPayloadSchema = z.object({
  munchlyOrderRef: z.string().min(1),
  sla: z.object({ prepTimeMinutes: z.number().int().positive() }),
  customerNote: z.string().nullable().default(null),
  lineItems: z
    .array(
      z.object({
        itemCode: z.string().min(1),
        count: z.number().int().positive(),
        specialRequest: z.string().nullable().default(null),
      })
    )
    .min(1),
});

export type MunchlyPayload = z.infer<typeof munchlyPayloadSchema>;

export function normalizeMunchlyOrder(payload: MunchlyPayload): NormalizedOrder {
  return {
    channel: 'munchly',
    externalOrderId: payload.munchlyOrderRef,
    promiseMinutes: payload.sla.prepTimeMinutes,
    note: payload.customerNote,
    lines: payload.lineItems.map((item) => ({
      externalItemId: item.itemCode,
      qty: item.count,
      note: item.specialRequest,
    })),
  };
}
