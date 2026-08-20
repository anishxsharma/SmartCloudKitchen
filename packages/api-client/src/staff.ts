import type { Staff, StaffRole } from '@smartcloudkitchen/types';
import { getSupabase } from './client';

/**
 * Email+password bridge to a real Supabase Auth session — stands in for
 * PIN entry until that's built (see the build plan's Auth section and
 * DEV_STAFF_CREDENTIALS in mock-data, which only exist on the dev
 * project's seeded accounts).
 */
export async function signInStaff(email: string, password: string) {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOutStaff() {
  await getSupabase().auth.signOut();
}

/** The signed-in staff member's own row — relies on the staff_own_row RLS policy (id = auth.uid()). */
export async function fetchMyStaff(): Promise<Staff | null> {
  const { data: session } = await getSupabase().auth.getSession();
  if (!session.session) return null;

  const { data, error } = await getSupabase().from('staff').select('*').eq('id', session.session.user.id).maybeSingle();
  if (error) throw error;
  return (data as Staff | null) ?? null;
}

/** A manager/owner's team — relies on the staff_scoped_read RLS policy (0013). Empty for a line cook. */
export async function fetchScopedStaff(): Promise<Staff[]> {
  const { data, error } = await getSupabase().from('staff').select('*').order('display_name');
  if (error) throw error;
  return (data ?? []) as Staff[];
}

export interface InviteStaffInput {
  email: string;
  displayName: string;
  role: StaffRole;
  /** Required unless role is 'owner'. */
  locationId?: string | null;
}

/** Owner/manager-only — runs server-side via the invite-staff Edge Function, which re-checks authorization itself rather than trusting the caller. */
export async function inviteStaff(input: InviteStaffInput): Promise<void> {
  const { error } = await getSupabase().functions.invoke('invite-staff', {
    body: { email: input.email, displayName: input.displayName, role: input.role, locationId: input.locationId ?? null },
  });
  if (error) throw error;
}

/** Exchanges the tokens from an invite deep link (sckkitchen://set-password#access_token=...&refresh_token=...) for a real session. */
export async function consumeInviteSession(accessToken: string, refreshToken: string): Promise<void> {
  const { error } = await getSupabase().auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw error;
}

/** Sets the password on the session established by consumeInviteSession — the one step that turns an invite into a usable account. */
export async function setOwnPassword(password: string): Promise<void> {
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) throw error;
}
