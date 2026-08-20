import type { Customer } from '@smartcloudkitchen/types';
import { getSupabase } from './client';

/**
 * Phone OTP checkout — no password, no separate sign-up step. Requires a
 * phone provider (Twilio, MessageBird, etc.) configured in the Supabase
 * project's Authentication settings; signInWithOtp/verifyOtp calls fail
 * until that's wired up.
 */
export async function sendCustomerOtp(phone: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({ phone });
  if (error) throw error;
}

/** Verifies the SMS code and ensures a customers row exists for this phone — relies on customer_insert_own_row (0014). */
export async function verifyCustomerOtp(phone: string, token: string): Promise<Customer> {
  const { data, error } = await getSupabase().auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error('Verification succeeded but no session was returned.');
  return upsertCustomerProfile(userId, phone);
}

/**
 * customers.phone is required (delivery needs some way to reach
 * someone) but Google only ever gives an email — this is the shared
 * landing spot both auth paths call once a session exists: phone OTP
 * already has a verified number in hand, Google's flow collects one
 * as plain text right after sign-in (see PhoneAuthScreen's Google step).
 */
export async function upsertCustomerProfile(userId: string, phone: string, displayName?: string | null): Promise<Customer> {
  const { data: customerRow, error: upsertError } = await getSupabase()
    .from('customers')
    .upsert({ id: userId, phone, display_name: displayName ?? undefined }, { onConflict: 'id' })
    .select('*')
    .single();
  if (upsertError) throw upsertError;
  return customerRow as Customer;
}

/** Called right after an OAuth session lands — Google gives no phone, so the caller still needs to collect one if this customer row doesn't exist yet. */
export async function resolveOAuthSession(): Promise<{ userId: string; displayName: string | null; customer: Customer | null }> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error('No session after sign-in.');

  const meta = data.user.user_metadata as Record<string, unknown> | undefined;
  const displayName = (meta?.full_name as string | undefined) ?? (meta?.name as string | undefined) ?? null;

  const customer = await fetchMyCustomer();
  return { userId, displayName, customer };
}

/** The signed-in customer's own row, if any — relies on customer_own_row (id = auth.uid()). */
export async function fetchMyCustomer(): Promise<Customer | null> {
  const { data: session } = await getSupabase().auth.getSession();
  if (!session.session) return null;

  const { data, error } = await getSupabase().from('customers').select('*').eq('id', session.session.user.id).maybeSingle();
  if (error) throw error;
  return (data as Customer | null) ?? null;
}

export async function signOutCustomer(): Promise<void> {
  await getSupabase().auth.signOut();
}
