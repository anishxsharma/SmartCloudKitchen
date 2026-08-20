import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zippPayloadSchema, normalizeZippOrder } from './zipp.js';

test('normalizes a well-formed Zipp payload', () => {
  const payload = zippPayloadSchema.parse({
    order_id: 'ZP-88213',
    promised_minutes: 18,
    special_instructions: 'Ring twice.',
    items: [
      { sku: 'ZP-BCB-01', quantity: 2, notes: 'mild' },
      { sku: 'ZP-DAL-02', quantity: 1, notes: null },
    ],
  });

  const normalized = normalizeZippOrder(payload);

  assert.equal(normalized.channel, 'zipp');
  assert.equal(normalized.externalOrderId, 'ZP-88213');
  assert.equal(normalized.promiseMinutes, 18);
  assert.equal(normalized.note, 'Ring twice.');
  assert.deepEqual(normalized.lines, [
    { externalItemId: 'ZP-BCB-01', qty: 2, note: 'mild' },
    { externalItemId: 'ZP-DAL-02', qty: 1, note: null },
  ]);
});

test('defaults missing optional fields to null rather than failing', () => {
  const payload = zippPayloadSchema.parse({
    order_id: 'ZP-1',
    promised_minutes: 10,
    items: [{ sku: 'ZP-X', quantity: 1 }],
  });
  assert.equal(payload.special_instructions, null);
  assert.equal(payload.items[0].notes, null);
});

test('rejects a payload with no line items', () => {
  const result = zippPayloadSchema.safeParse({
    order_id: 'ZP-1',
    promised_minutes: 10,
    items: [],
  });
  assert.equal(result.success, false);
});

test('rejects a non-positive quantity', () => {
  const result = zippPayloadSchema.safeParse({
    order_id: 'ZP-1',
    promised_minutes: 10,
    items: [{ sku: 'ZP-X', quantity: 0 }],
  });
  assert.equal(result.success, false);
});
