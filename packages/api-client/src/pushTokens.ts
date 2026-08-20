import { getSupabase } from './client';

/**
 * Upserts a device's Expo push token against the signed-in customer —
 * what the notify-order-stage-change Edge Function reads from when a
 * ticket's stage changes (see supabase/functions/notify-order-stage-change).
 * Call this once notification permission is granted; safe to call again
 * on every app open, since (customer_id, expo_push_token) is unique.
 */
export async function registerPushToken(customerId: string, expoPushToken: string) {
  const { error } = await getSupabase()
    .from('push_tokens')
    .upsert({ customer_id: customerId, expo_push_token: expoPushToken }, { onConflict: 'customer_id,expo_push_token' });

  if (error) throw error;
}
