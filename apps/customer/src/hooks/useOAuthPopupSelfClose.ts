import { useEffect } from 'react';
import { Platform } from 'react-native';

export const OAUTH_MESSAGE_TYPE = 'sck-oauth';

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

/**
 * signInWithGoogle (web) opens the OAuth flow in a popup rather than
 * navigating the main tab away — losing the main tab would lose the
 * in-memory cart, since nothing persists it across a page reload. This
 * runs in that popup: once Google redirects it back to our own origin
 * with session tokens in the hash, it hands them to the opener via
 * postMessage and closes itself, rather than rendering the app a
 * second time in a window nobody's looking at.
 */
export function useOAuthPopupSelfClose() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.opener) return;

    const params = parseHashParams(window.location.href);
    if (!params.access_token || !params.refresh_token) return;

    window.opener.postMessage(
      { type: OAUTH_MESSAGE_TYPE, accessToken: params.access_token, refreshToken: params.refresh_token },
      window.location.origin
    );
    window.close();
  }, []);
}
