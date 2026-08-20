import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Standard webhook pattern (Stripe/Shopify-style): the aggregator signs
 * the raw request body with a shared secret, sent as a hex HMAC-SHA256 in
 * a header. Verify against the raw body — not the parsed/re-serialized
 * JSON, which can differ byte-for-byte from what was actually signed.
 */
export function verifyHmacSignature(rawBody: string, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(signatureHeader, 'hex');

  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
