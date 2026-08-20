import { test } from 'node:test';
import assert from 'node:assert/strict';
import { munchlyPayloadSchema, normalizeMunchlyOrder } from './munchly.js';

test('normalizes a well-formed Munchly payload', () => {
  const payload = munchlyPayloadSchema.parse({
    munchlyOrderRef: 'MU-771029',
    sla: { prepTimeMinutes: 16 },
    customerNote: 'Cut into 8.',
    lineItems: [{ itemCode: 'MU-TRUF-9', count: 1, specialRequest: 'well done' }],
  });

  const normalized = normalizeMunchlyOrder(payload);

  assert.equal(normalized.channel, 'munchly');
  assert.equal(normalized.externalOrderId, 'MU-771029');
  assert.equal(normalized.promiseMinutes, 16);
  assert.equal(normalized.note, 'Cut into 8.');
  assert.deepEqual(normalized.lines, [{ externalItemId: 'MU-TRUF-9', qty: 1, note: 'well done' }]);
});

test('rejects a payload missing the nested sla object', () => {
  const result = munchlyPayloadSchema.safeParse({
    munchlyOrderRef: 'MU-1',
    lineItems: [{ itemCode: 'MU-X', count: 1 }],
  });
  assert.equal(result.success, false);
});
