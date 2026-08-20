import type { Staff } from '@smartcloudkitchen/types';
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
