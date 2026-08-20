# order-ingestion

Not built yet — arrives in Phase 3 of the build plan. This will be a small
Node/NestJS service that receives Zipp/Munchly aggregator webhooks,
validates their signatures, maps their payloads onto `menu_items` (so an
aggregator webhook can never silently override your own pricing), and
inserts the result into the same `orders`/`order_lines` tables the apps
already read from — a normal row with `channel = 'zipp' | 'munchly'` by
the time either app sees it.
