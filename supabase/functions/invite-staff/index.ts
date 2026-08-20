// Deno Edge Function — deploy with `supabase functions deploy invite-staff`.
//
// Called by the kitchen app when an owner or kitchen_manager adds a new
// hire. Runs as service_role (needed for auth.admin.inviteUserByEmail and
// to insert the staff row ahead of RLS), so every authorization check
// that matters happens in here rather than relying on the database —
// the caller's own JWT is used only to look up who's calling, never
// trusted for what they're allowed to do.
//
// A cook or manager clicking the invite email lands on set-password
// with the session tokens in the URL fragment
// (…#access_token=…&refresh_token=…), which the app exchanges for a
// session (see api-client's staff.ts / useInviteDeepLink) and uses to
// set their own password — nobody but the new hire ever sees it.
//
// Defaults to the native app's deep link; once the kitchen web build is
// deployed, set the STAFF_INVITE_REDIRECT_URL secret
// (`supabase secrets set STAFF_INVITE_REDIRECT_URL=https://...`) to
// send new invites there instead — same fragment-token contract works
// on web (useInviteDeepLink reads location.href there), no code change
// needed on either side.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const INVITE_REDIRECT_URL = Deno.env.get('STAFF_INVITE_REDIRECT_URL') ?? 'sckkitchen://set-password';
const ROLES = ['line_cook', 'kitchen_manager', 'owner'] as const;
type Role = (typeof ROLES)[number];

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

  if (callerStaffError || !callerStaff || !['owner', 'kitchen_manager'].includes(callerStaff.role)) {
    return json({ error: 'Not authorized to invite staff' }, 403);
  }

  let body: { email?: string; displayName?: string; role?: string; locationId?: string | null };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, displayName, role, locationId } = body;
  if (!email || !displayName || !role) return json({ error: 'email, displayName and role are required' }, 400);
  if (!ROLES.includes(role as Role)) return json({ error: 'Invalid role' }, 400);

  if (callerStaff.role === 'kitchen_manager') {
    if (role === 'owner') return json({ error: 'Only an owner can invite another owner' }, 403);
    if (locationId !== callerStaff.location_id) return json({ error: 'Can only invite staff to your own location' }, 403);
  }

  let resolvedLocationId: string | null = null;
  let resolvedOrgId: string | null = null;

  if (role === 'owner') {
    resolvedOrgId = callerStaff.org_id;
  } else {
    if (!locationId) return json({ error: 'locationId is required for this role' }, 400);
    const { data: location } = await admin.from('locations').select('id, org_id').eq('id', locationId).single();
    if (!location || (callerStaff.role === 'owner' && location.org_id !== callerStaff.org_id)) {
      return json({ error: 'Invalid location' }, 400);
    }
    resolvedLocationId = locationId;
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_REDIRECT_URL,
  });

  if (inviteError || !invited?.user) return json({ error: inviteError?.message ?? 'Could not send invite' }, 400);

  const { error: staffInsertError } = await admin.from('staff').insert({
    id: invited.user.id,
    display_name: displayName,
    role,
    location_id: resolvedLocationId,
    org_id: resolvedOrgId,
  });

  if (staffInsertError) {
    // Don't leave an orphaned auth user behind if the staff row failed.
    await admin.auth.admin.deleteUser(invited.user.id);
    return json({ error: staffInsertError.message }, 400);
  }

  return json({ ok: true, staffId: invited.user.id }, 200);
});
