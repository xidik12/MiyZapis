// Native (Capacitor) auth bridge.
//
// Google's OAuth and the Telegram Login Widget are blocked inside embedded app
// webviews, so in the native app we open the normal web login in the SYSTEM
// browser (where they work) flagged with ?native=1. After a successful sign-in
// there, the web redirects back to the app via the com.miyzapis.app:// deep
// link carrying the tokens, which the app's deep-link handler consumes.

import { isNativeApp } from './capacitor';

export const NATIVE_AUTH_SCHEME = 'com.miyzapis.app';

/** Open the web login/register in the system browser for native social sign-in.
 *  An optional provider hint is forwarded so the browser leg can highlight/auto
 *  the chosen method; both providers remain available there regardless. */
export async function openNativeAuth(
  mode: 'login' | 'register' = 'login',
  provider?: 'google' | 'telegram',
): Promise<void> {
  try {
    const { Browser } = await import('@capacitor/browser');
    const base = (typeof window !== 'undefined' && window.location.origin.startsWith('http'))
      ? window.location.origin
      : 'https://miyzapis.com';
    const q = `native=1${provider ? `&provider=${provider}` : ''}`;
    await Browser.open({ url: `${base}/auth/${mode}?${q}`, presentationStyle: 'popover' });
  } catch {
    /* plugin unavailable — no-op */
  }
}

/** True when this page is the system-browser leg of the native auth flow. */
export function isNativeAuthFlow(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('native') === '1';
}

/** Hand the freshly-issued tokens back to the app via the deep link. */
export function returnTokensToApp(): boolean {
  if (typeof window === 'undefined') return false;
  const access = localStorage.getItem('auth_token');
  const refresh = localStorage.getItem('refresh_token');
  if (!access || !refresh) return false;
  window.location.href =
    `${NATIVE_AUTH_SCHEME}://auth?access=${encodeURIComponent(access)}&refresh=${encodeURIComponent(refresh)}`;
  return true;
}

/** In the app (not the browser leg): should social buttons open the system browser? */
export function shouldUseNativeAuth(): boolean {
  return isNativeApp() && !isNativeAuthFlow();
}
