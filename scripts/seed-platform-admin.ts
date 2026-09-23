// One-off admin script — creates the first platform_admin account.
// There's no other way to get one: onboard-organization (the only path
// that creates staff rows for a new business) requires an existing
// platform_admin to call it, so bootstrapping the very first one needs
// direct access, same reason scripts/seed-staff.ts exists.
//
// Run with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set:
//   npx tsx scripts/seed-platform-admin.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.');
}

const supabase = createClient(url, serviceRoleKey);

// Dev-only fixture password — same pattern/caveat as seed-staff.ts's
// DEV_PASSWORD: throwaway on a dev project, not a real credential.
const EMAIL = 'admin@platform.smartcloudkitchen.dev';
const PASSWORD = 'sck-dev-platform-admin-2026';

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  let userId = created?.user?.id;

  if (createError) {
    if (!createError.message.includes('already been registered')) throw createError;
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    userId = list.users.find((u) => u.email === EMAIL)?.id;
  }

  if (!userId) throw new Error(`Could not resolve a user id for ${EMAIL}`);

  const { error: staffError } = await supabase
    .from('staff')
    .upsert({ id: userId, display_name: 'Platform Admin', role: 'platform_admin', location_id: null, org_id: null });

  if (staffError) throw staffError;

  console.log(`✓ Platform Admin <${EMAIL}> → staff.id ${userId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
