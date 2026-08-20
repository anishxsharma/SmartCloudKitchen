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

## Tests

```
npm test
```

Covers the payload schemas/normalizers and signature verification — pure
functions, no live database needed. `ingest.ts` (the part that actually
writes to Postgres) is exercised by hand against a real Supabase project
rather than mocked, since a mocked Postgres client mostly just tests the
mock.
