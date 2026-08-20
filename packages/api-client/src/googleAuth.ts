import { getSupabase } from './client';

/**
 * Google OAuth via Supabase — needs a Google OAuth client configured in
 * the project's Authentication > Providers settings, and the app's
 * redirect URL added to Supabase's allowed redirect list.
 *
 * Web navigates away and back on its own (Supabase's client picks the
 * session up from the URL automatically — detectSessionInUrl defaults
 * to true). Native has no page to navigate away from, so it opens the
 * OAuth URL in an in-app browser and hands the resulting redirect URL
 * back to the caller, who exchanges its fragment tokens for a session —
 * same contract as the kitchen app's invite deep link.
 */
export async function getGoogleOAuthUrl(redirectTo: string): Promise<string> {
  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  return data.url;
}

export async function consumeOAuthSession(accessToken: string, refreshToken: string): Promise<void> {
  const { error } = await getSupabase().auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw error;
}
