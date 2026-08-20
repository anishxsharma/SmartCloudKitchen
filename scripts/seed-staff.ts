// One-off admin script — creates real Supabase Auth users for the four
// mock-data staff fixtures and inserts their `staff` rows. Auth users
// can't be created from seed.sql (no plain-SQL path into auth.users that
// Supabase supports), hence a separate script using the admin API.
//
// Run with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set:
//   npx tsx scripts/seed-staff.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.');
}

const supabase = createClient(url, serviceRoleKey);

const HSR = '11111111-0000-0000-0000-000000000010';
const INDIRANAGAR = '11111111-0000-0000-0000-000000000020';
const ORG = '11111111-0000-0000-0000-000000000001';

// Dev-only fixture password — these are throwaway accounts on a dev
// project, not real credentials. Real staff sign-in is PIN-based (see the
// build plan's Auth section); this email+password bridge exists only
// until that's built, and DEV_STAFF_CREDENTIALS in mock-data documents it
// as such.
const DEV_PASSWORD = 'sck-dev-staff-2026';

const STAFF = [
  { email: 'ravi@staff.smartcloudkitchen.dev', display_name: 'Ravi K.', role: 'line_cook', location_id: HSR, org_id: null },
  { email: 'ayesha@staff.smartcloudkitchen.dev', display_name: 'Ayesha N.', role: 'kitchen_manager', location_id: HSR, org_id: null },
  { email: 'deepak@staff.smartcloudkitchen.dev', display_name: 'Deepak S.', role: 'line_cook', location_id: INDIRANAGAR, org_id: null },
  { email: 'meera@staff.smartcloudkitchen.dev', display_name: 'Meera R.', role: 'owner', location_id: null, org_id: ORG },
] as const;

async function main() {
  for (const s of STAFF) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: s.email,
      password: DEV_PASSWORD,
      email_confirm: true,
    });

    let userId = created?.user?.id;

    if (createError) {
      if (!createError.message.includes('already been registered')) throw createError;
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      userId = list.users.find((u) => u.email === s.email)?.id;
    }

    if (!userId) throw new Error(`Could not resolve a user id for ${s.email}`);

    const { error: staffError } = await supabase
      .from('staff')
      .upsert({ id: userId, display_name: s.display_name, role: s.role, location_id: s.location_id, org_id: s.org_id });

    if (staffError) throw staffError;

    console.log(`✓ ${s.display_name} <${s.email}> → staff.id ${userId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
