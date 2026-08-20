import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyHmacSignature } from './verifySignature.js';

const secret = 'test-secret';
const body = JSON.stringify({ order_id: 'ZP-1' });
const validSignature = createHmac('sha256', secret).update(body, 'utf8').digest('hex');

test('accepts a correctly signed body', () => {
  assert.equal(verifyHmacSignature(body, validSignature, secret), true);
});

test('rejects a tampered body', () => {
  assert.equal(verifyHmacSignature(body + 'x', validSignature, secret), false);
});

test('rejects the wrong secret', () => {
  assert.equal(verifyHmacSignature(body, validSignature, 'wrong-secret'), false);
});

test('rejects a missing signature header', () => {
  assert.equal(verifyHmacSignature(body, undefined, secret), false);
});

test('rejects a malformed signature without throwing', () => {
  assert.equal(verifyHmacSignature(body, 'not-hex-and-wrong-length', secret), false);
});
