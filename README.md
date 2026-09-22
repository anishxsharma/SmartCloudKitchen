# SmartCloudKitchen

Two React Native apps sharing one Supabase Postgres database: a customer
storefront and a kitchen console. See the build plan for the full
architecture, data model, and roadmap.

## Layout

```
apps/
  customer/           storefront — browse, cart, checkout, tracking
  kitchen/             tablet + phone console — queue, ticket, menu, stock, sales
packages/
  api-client/           Supabase client, typed queries, realtime subscriptions
  design-tokens/       colors, Archivo/IBM Plex Mono type scale — ported from the prototype
  types/                 shared TS types matching the Postgres schema
services/
  order-ingestion/     aggregator webhook handler — deployed to Render
supabase/
  migrations/           schema as versioned SQL
```

## Getting started

Requires **Node ^20.19.4 or ^22.13.0+** (Metro/React Native's own engine
requirement — older Node versions will hit `EBADENGINE` warnings or a
`File is not defined` crash in some CLI tooling).

```
npm install
```

Each app needs its own `.env` with Supabase credentials — copy the
`.env.example` in `apps/customer` and `apps/kitchen`, and fill in your
Supabase project's URL and anon key. Apply `supabase/migrations` to your
project (via the Supabase CLI or the SQL editor) before running either app.

```
npm run dev:customer   # cd apps/customer && expo start
npm run dev:kitchen    # cd apps/kitchen && expo start
```
