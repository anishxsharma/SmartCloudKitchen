// Deno Edge Function — deploy with `supabase functions deploy onboard-organization`.
//
// Called by a platform_admin (from the kitchen app's PlatformAdmin tab)
// to bring a brand-new, independent kitchen business onto the platform:
// creates its organization row, a first location, invites the owner by
// email, and creates their staff row. Runs as service_role for the same
// reason invite-staff does — every authorization check that matters
// happens in here, not in the client, and org creation itself has no
// other path (organizations' own RLS only ever lets platform_admin
// touch it, but a plain client insert still can't also invite an owner
// and roll back atomically on failure).
//
// Same set-password flow as invite-staff: the new owner clicks their
// invite email, lands on set-password with session tokens in the URL
// fragment, and sets their own password. Reuses the same
// STAFF_INVITE_REDIRECT_URL secret.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const INVITE_REDIRECT_URL = Deno.env.get('STAFF_INVITE_REDIRECT_URL') ?? 'sckkitchen://set-password';

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Invalid session' }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerStaff, error: callerStaffError } = await admin
    .from('staff')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (callerStaffError || !callerStaff || callerStaff.role !== 'platform_admin') {
    return json({ error: 'Not authorized to onboard an organization' }, 403);
  }

  let body: {
    orgName?: string;
    locationName?: string;
    timezone?: string;
    ownerEmail?: string;
    ownerDisplayName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { orgName, locationName, timezone, ownerEmail, ownerDisplayName } = body;
  if (!orgName || !locationName || !ownerEmail || !ownerDisplayName) {
    return json({ error: 'orgName, locationName, ownerEmail and ownerDisplayName are required' }, 400);
  }

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: orgName })
    .select('id')
    .single();
  if (orgError || !org) return json({ error: orgError?.message ?? 'Could not create organization' }, 400);

  const { data: location, error: locationError } = await admin
    .from('locations')
    .insert({ org_id: org.id, name: locationName, timezone: timezone ?? 'Asia/Kolkata' })
    .select('id')
    .single();
  if (locationError || !location) {
    await admin.from('organizations').delete().eq('id', org.id);
    return json({ error: locationError?.message ?? 'Could not create location' }, 400);
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(ownerEmail, {
    redirectTo: INVITE_REDIRECT_URL,
  });
  if (inviteError || !invited?.user) {
    await admin.from('locations').delete().eq('id', location.id);
    await admin.from('organizations').delete().eq('id', org.id);
    return json({ error: inviteError?.message ?? 'Could not send owner invite' }, 400);
  }

  const { error: staffInsertError } = await admin.from('staff').insert({
    id: invited.user.id,
    display_name: ownerDisplayName,
    role: 'owner',
    location_id: null,
    org_id: org.id,
  });

  if (staffInsertError) {
    // Don't leave an orphaned auth user, location, or org behind.
    await admin.auth.admin.deleteUser(invited.user.id);
    await admin.from('locations').delete().eq('id', location.id);
    await admin.from('organizations').delete().eq('id', org.id);
    return json({ error: staffInsertError.message }, 400);
  }

  return json({ ok: true, orgId: org.id, locationId: location.id, ownerId: invited.user.id }, 200);
});
