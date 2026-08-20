// Deno Edge Function — deploy with `supabase functions deploy notify-order-stage-change`.
// Invoked by the orders_notify_stage_change trigger (see
// supabase/migrations/0003_aggregator_ingestion_and_push.sql) whenever a
// ticket's stage actually changes. Looks up the customer's registered
// devices and pushes an update via Expo's push API — the in-app realtime
// subscription already covers a foregrounded app, so this is specifically
// for a customer who's backgrounded the app.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const STAGE_COPY: Record<string, { title: string; body: string }> = {
  cooking: { title: 'Cooking now', body: "The kitchen's started on your order." },
  ready: { title: 'Order ready', body: 'Packed and waiting for a rider.' },
  picked: { title: 'On the way', body: 'Your order just left the kitchen.' },
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { order_id, stage } = await req.json();
  const copy = STAGE_COPY[stage];
  if (!copy) {
    // 'new' has no push — the customer just placed the order, they know.
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('code, customer_id')
    .eq('id', order_id)
    .single();

  if (orderError || !order?.customer_id) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no customer on order' }), { status: 200 });
  }

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('customer_id', order.customer_id);

  if (!tokens?.length) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no push tokens' }), { status: 200 });
  }

  const messages = tokens.map((t) => ({
    to: t.expo_push_token,
    title: `${copy.title} · ${order.code}`,
    body: copy.body,
    sound: 'default',
    data: { order_id, stage },
  }));

  const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });

  return new Response(JSON.stringify({ sent: messages.length, expoStatus: pushResponse.status }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
