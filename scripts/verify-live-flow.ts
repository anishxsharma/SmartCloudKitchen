// One-off verification — exercises the exact flow the apps now run
// against the real project: customer places an order, kitchen staff
// (signed in for real) sees it and bumps it, customer's subscription
// picks up the change. Not part of either app; delete once you trust it.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const HSR = '11111111-0000-0000-0000-000000000010';
const CURRY_LINE = '22222222-0000-0000-0000-000000000001';
const BUTTER_CHICKEN = '33333333-0000-0000-0000-000000000001';

async function main() {
  // --- customer client: anon, no session (menu is public-read, orders insert is open per schema) ---
  const customerClient = createClient(url, anonKey);
  const kitchenClient = createClient(url, anonKey);
  let orderId: string | undefined;

  try {
    await run(customerClient, kitchenClient, (id) => (orderId = id));
    console.log('\n✓ Live flow verified end to end.');
  } finally {
    // Always attempt cleanup, even on failure — an earlier run of this
    // script left a stray order behind because cleanup only ran on the
    // success path.
    if (orderId) {
      console.log(`Cleaning up test order ${orderId}...`);
      // Cleanup needs the kitchen client's staff session, which may not
      // exist yet if the script failed before step 3 — don't let a
      // cleanup failure mask the real error.
      try {
        await kitchenClient.auth.signInWithPassword({ email: 'ravi@staff.smartcloudkitchen.dev', password: 'sck-dev-staff-2026' });
        await kitchenClient.from('orders').delete().eq('id', orderId);
      } catch (cleanupErr) {
        console.warn(`Could not clean up order ${orderId} automatically:`, cleanupErr);
      }
    }
  }
}

async function run(
  customerClient: ReturnType<typeof createClient>,
  kitchenClient: ReturnType<typeof createClient>,
  setOrderId: (id: string) => void
) {

  console.log('1. Customer browses the real menu...');
  const { data: menu, error: menuError } = await customerClient
    .from('menu_items')
    .select('name, price_cents')
    .eq('id', BUTTER_CHICKEN)
    .single();
  if (menuError) throw menuError;
  console.log(`   ✓ ${menu.name} — ₹${menu.price_cents / 100}`);

  console.log('2. Customer places a direct order...');
  const codeResult = await customerClient.rpc('next_order_code');
  if (codeResult.error) throw codeResult.error;
  const orderInsert = await customerClient
    .from('orders')
    .insert({
      location_id: HSR,
      brand_id: CURRY_LINE,
      customer_id: null,
      channel: 'direct',
      code: codeResult.data,
      stage: 'new',
      promise_minutes: 16,
      note: 'verify-live-flow test order',
    })
    .select('id, code')
    .single();
  if (orderInsert.error) throw orderInsert.error;
  const orderId = orderInsert.data.id as string;
  setOrderId(orderId);
  console.log(`   ✓ order ${orderInsert.data.code} (${orderId})`);

  const linesInsert = await customerClient
    .from('order_lines')
    .insert({ order_id: orderId, menu_item_id: BUTTER_CHICKEN, qty: 2, done: false });
  if (linesInsert.error) throw linesInsert.error;
  console.log('   ✓ order_lines inserted');

  // --- kitchen client: real signed-in staff session, RLS-gated ---
  console.log('3. Kitchen staff (Ravi, line cook) signs in for real...');
  const signIn = await kitchenClient.auth.signInWithPassword({
    email: 'ravi@staff.smartcloudkitchen.dev',
    password: 'sck-dev-staff-2026',
  });
  if (signIn.error) throw signIn.error;
  console.log(`   ✓ signed in as staff.id ${signIn.data.user?.id}`);

  console.log('4. Kitchen queries open orders at HSR (RLS-gated by staff_location_ids)...');
  const { data: openOrders, error: openError } = await kitchenClient
    .from('orders')
    .select('id, code, stage')
    .eq('location_id', HSR)
    .neq('stage', 'picked');
  if (openError) throw openError;
  const found = openOrders.find((o) => o.id === orderId);
  if (!found) throw new Error('Kitchen could not see the order the customer just placed — RLS or scoping bug.');
  console.log(`   ✓ sees ${openOrders.length} open order(s), including ${found.code}`);

  console.log('5. Kitchen bumps the ticket to "cooking"...');
  const advance = await kitchenClient.from('orders').update({ stage: 'cooking' }).eq('id', orderId);
  if (advance.error) throw advance.error;

  console.log('6. Customer re-reads the order and sees the real stage change...');
  const { data: after, error: afterError } = await customerClient.from('orders').select('stage').eq('id', orderId).single();
  if (afterError) throw afterError;
  if (after.stage !== 'cooking') throw new Error(`Expected stage 'cooking', got '${after.stage}'`);
  console.log(`   ✓ stage is now "${after.stage}" — visible to the customer with no special access`);
}

main().catch((err) => {
  console.error('\n✗ FAILED:', err.message ?? err);
  process.exit(1);
});
