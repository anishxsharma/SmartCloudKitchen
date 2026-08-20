import express, { type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { verifyHmacSignature } from './verifySignature.js';
import { zippPayloadSchema, normalizeZippOrder } from './aggregators/zipp.js';
import { munchlyPayloadSchema, normalizeMunchlyOrder } from './aggregators/munchly.js';
import { ingestNormalizedOrder } from './ingest.js';
import { IngestError } from './types.js';

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

const app = express();

// Raw body is kept alongside the parsed JSON — signature verification
// needs the exact bytes the aggregator signed, not a re-serialized copy.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: string }).rawBody = buf.toString('utf8');
    },
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/webhooks/zipp', async (req, res) => {
  await handleWebhook(req, res, {
    secret: config.zippWebhookSecret,
    signatureHeader: 'x-zipp-signature',
    schema: zippPayloadSchema,
    normalize: normalizeZippOrder,
  });
});

app.post('/webhooks/munchly', async (req, res) => {
  await handleWebhook(req, res, {
    secret: config.munchlyWebhookSecret,
    signatureHeader: 'x-munchly-signature',
    schema: munchlyPayloadSchema,
    normalize: normalizeMunchlyOrder,
  });
});

async function handleWebhook<T>(
  req: Request,
  res: Response,
  opts: {
    secret: string;
    signatureHeader: string;
    schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: unknown } };
    normalize: (payload: T) => import('./types.js').NormalizedOrder;
  }
) {
  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? '';
  const signature = req.header(opts.signatureHeader);

  if (!verifyHmacSignature(rawBody, signature, opts.secret)) {
    res.status(401).json({ error: 'invalid signature' });
    return;
  }

  const parsed = opts.schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid payload', details: parsed.error });
    return;
  }

  try {
    const normalized = opts.normalize(parsed.data);
    const result = await ingestNormalizedOrder(supabase, normalized);
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (err) {
    if (err instanceof IngestError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Unexpected ingestion failure', err);
    res.status(500).json({ error: 'internal error' });
  }
}

app.listen(config.port, () => {
  console.log(`order-ingestion listening on :${config.port}`);
});
