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

  const { data: customerRow, error: upsertError } = await getSupabase()
    .from('customers')
    .upsert({ id: userId, phone }, { onConflict: 'id' })
    .select('*')
    .single();
  if (upsertError) throw upsertError;

  return customerRow as Customer;
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
