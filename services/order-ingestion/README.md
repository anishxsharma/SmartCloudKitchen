# order-ingestion

Receives Zipp and Munchly webhook orders, verifies their signature, maps
their line items onto our own `menu_items` (via `aggregator_menu_mappings`
— never by matching names), and inserts the result into `orders`/
`order_lines`. By the time it returns, the kitchen app's realtime
subscription sees a normal ticket — there's no aggregator-specific code
anywhere past this service.

## Setup

```
cp .env.example .env   # fill in your Supabase project + webhook secrets
npm run dev             # tsx watch, restarts on change
```

Before any webhook can resolve, seed `aggregator_menu_mappings` with a row
per (channel, external item id) → your `menu_items.id`. Nothing here
guesses that mapping — an unmapped item fails the whole order with a 422
rather than silently dropping a line.

## Endpoints

- `POST /webhooks/zipp` — signed with `X-Zipp-Signature` (HMAC-SHA256 hex of the raw body)
- `POST /webhooks/munchly` — signed with `X-Munchly-Signature`, same scheme
- `GET /health`

Both webhook handlers are idempotent on `(channel, external_ref)` — a
retried delivery returns the existing order rather than creating a
duplicate ticket.

## Deploying (Render)

Zipp and Munchly need a public HTTPS URL to webhook into — `npm run dev`
on localhost doesn't reach them. `render.yaml` at the repo root is a
Render Blueprint for this service — Render builds it from the
`Dockerfile` in this directory.

1. Render Dashboard → New → Blueprint → connect the
   `anishxsharma/SmartCloudKitchen` GitHub repo. Render finds
   `render.yaml` and proposes the `smartcloudkitchen-order-ingestion`
   web service automatically.
2. Before the first deploy, fill in the env vars marked `sync: false` in
   `render.yaml` (Render prompts for these in the same flow, or set them
   later under the service's Environment tab): `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ZIPP_WEBHOOK_SECRET`,
   `MUNCHLY_WEBHOOK_SECRET`.
3. Deploy. Render gives the service a `https://smartcloudkitchen-order-ingestion.onrender.com`-style URL.

The free plan spins the service down after ~15 minutes idle — the
tradeoff is a 10-30s cold start on the first webhook delivery after a
quiet spell. If an aggregator's retry/timeout budget turns out to be
too tight for that, move to a paid instance type (no code change,
just a plan change in the Render dashboard).

Register the deployed `/webhooks/zipp` and `/webhooks/munchly` URLs (and
whatever secret you set above) in each aggregator's developer portal —
that's the actual source of truth for `ZIPP_WEBHOOK_SECRET` and
`MUNCHLY_WEBHOOK_SECRET`, not something we invent.

## Tests

```
npm test
```

Covers the payload schemas/normalizers and signature verification — pure
functions, no live database needed. `ingest.ts` (the part that actually
writes to Postgres) is exercised by hand against a real Supabase project
rather than mocked, since a mocked Postgres client mostly just tests the
mock.
