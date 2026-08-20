import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useSessionStore } from '../store/sessionStore';

/**
 * Supabase's invite email points at sckkitchen://set-password with the
 * session tokens in the URL fragment (…#access_token=…&refresh_token=…),
 * not the query string — expo-linking's own parser only reads query
 * params, so the fragment is picked apart by hand here.
 */
function parseHashParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};
  const params: Record<string, string> = {};
  for (const pair of url.slice(hashIndex + 1).split('&')) {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
  }
  return params;
}

/** Mount once near the app root — catches both a cold start and a warm-app tap on the invite link. */
export function useInviteDeepLink() {
  const url = Linking.useURL();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!url || handled.current === url) return;
    const params = parseHashParams(url);
    if (params.access_token && params.refresh_token) {
      handled.current = url;
      useSessionStore.getState().beginPasswordSetup(params.access_token, params.refresh_token);
    }
  }, [url]);
}
