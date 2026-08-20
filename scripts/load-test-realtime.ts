// Load test for the realtime order pipe — spins up N concurrent
// subscribers (simulating N kitchen tablets/customer devices all
// watching the same location) and measures how fast a Postgres UPDATE
// actually reaches every one of them. Uses the anon key against the real
// project; no service role needed. Safe to re-run — cleans up after
// itself.
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

const url = 'https://iifggjikayvymcmubkqt.supabase.co';
const anonKey = 'sb_publishable_IPPR1RpclK9wx13CsMtuUg_gH5CuzEp';
const HSR = '11111111-0000-0000-0000-000000000010';
const CURRY_LINE = '22222222-0000-0000-0000-000000000001';

const SUBSCRIBER_COUNT = Number(process.argv[2] ?? 25);
const EVENT_COUNT = Number(process.argv[3] ?? 12);

interface Sample {
  eventIdx: number;
  subscriberIdx: number;
  latencyMs: number;
}

async function main() {
  const admin = createClient(url, anonKey);
  // Order updates are staff-only (staff_scoped_orders) — without this,
  // .update() silently no-ops under RLS (0 rows affected, no error), so
  // nothing actually changes and no realtime event ever fires. Learned
  // this the hard way: an earlier run of this script reported 0%
  // delivery that had nothing to do with realtime at all.
  const signIn = await admin.auth.signInWithPassword({ email: 'ayesha@staff.smartcloudkitchen.dev', password: 'sck-dev-staff-2026' });
  if (signIn.error) throw signIn.error;

  console.log(`Placing a test order to update ${EVENT_COUNT} times, watched by ${SUBSCRIBER_COUNT} subscribers...`);
  const code = await admin.rpc('next_order_code');
  if (code.error) throw code.error;
  const orderInsert = await admin
    .from('orders')
    .insert({ location_id: HSR, brand_id: CURRY_LINE, customer_id: null, channel: 'direct', code: code.data, stage: 'new', promise_minutes: 16 })
    .select('id')
    .single();
  if (orderInsert.error) throw orderInsert.error;
  const orderId = orderInsert.data.id as string;

  const subscribers = Array.from({ length: SUBSCRIBER_COUNT }, () => createClient(url, anonKey));
  const channels: RealtimeChannel[] = [];
  const samples: Sample[] = [];
  const sentAt: number[] = [];

  try {
    console.log(`Opening ${SUBSCRIBER_COUNT} realtime channels...`);
    let subscribedCount = 0;

    const subscribedPromises = subscribers.map(
      (client, subscriberIdx) =>
        new Promise<void>((resolve) => {
          const channel = client
            .channel(`loadtest:${subscriberIdx}:${Date.now()}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
              const note = (payload.new as any).note as string | null;
              const match = note?.match(/^__seq:(\d+)$/);
              if (!match) return;
              const seq = Number(match[1]);
              samples.push({ eventIdx: seq, subscriberIdx, latencyMs: Date.now() - sentAt[seq] });
            })
            .subscribe((status, err) => {
              if (status === 'SUBSCRIBED') {
                subscribedCount++;
                resolve();
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                console.log(`  subscriber ${subscriberIdx}: ${status}`, err?.message ?? '');
                resolve();
              }
            });
          channels[subscriberIdx] = channel;
        })
    );

    await Promise.all(subscribedPromises);
    console.log(`${subscribedCount}/${SUBSCRIBER_COUNT} channels reached SUBSCRIBED.`);

    console.log('Firing updates...');
    for (let i = 0; i < EVENT_COUNT; i++) {
      sentAt[i] = Date.now();
      // note carries the sequence number so every subscriber's payload
      // can be matched back to when it was sent; stage alternates so the
      // row genuinely changes each time (a no-op UPDATE still fires a
      // realtime event, but this is closer to real ticket-bump traffic).
      const stage = i % 2 === 0 ? 'cooking' : 'new';
      const update = await admin.from('orders').update({ stage, note: `__seq:${i}` }).eq('id', orderId);
      if (update.error) throw update.error;
      await new Promise((r) => setTimeout(r, 400));
    }

    // Let stragglers arrive.
    await new Promise((r) => setTimeout(r, 3000));

    channels.forEach((ch, i) => subscribers[i].removeChannel(ch));

    const expected = SUBSCRIBER_COUNT * EVENT_COUNT;
    const received = samples.length;
    const latencies = samples.map((s) => s.latencyMs).sort((a, b) => a - b);
    const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
    const max = latencies[latencies.length - 1] ?? 0;

    console.log('\n--- Results ---');
    console.log(`Expected deliveries: ${expected} (${SUBSCRIBER_COUNT} subscribers × ${EVENT_COUNT} events)`);
    console.log(`Actually received:   ${received} (${((received / expected) * 100).toFixed(1)}%)`);
    console.log(`Latency  avg: ${avg.toFixed(0)}ms   p50: ${p50}ms   p95: ${p95}ms   max: ${max}ms`);
  } finally {
    await admin.from('orders').delete().eq('id', orderId);
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message ?? err);
  process.exit(1);
});
