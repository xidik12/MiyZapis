// Native (Capacitor) Google Sign-In via @capgo/capacitor-social-login.
//
// Tapping "Sign in with Google" in the app shows the iOS/Android system account
// picker (no browser, no second login page) and returns a Google ID token, which
// we hand to the existing /auth-enhanced/google endpoint just like the web flow.
//
// Gated on VITE_GOOGLE_IOS_CLIENT_ID (and the web client id): until those are
// configured, isNativeGoogleConfigured() returns false and callers fall back to
// the system-browser flow, so login never breaks.

import { isNativeApp, nativePlatform } from './capacitor';

const WEB_CLIENT_ID = (import.meta.env as any).VITE_GOOGLE_CLIENT_ID as string | undefined;
const IOS_CLIENT_ID = (import.meta.env as any).VITE_GOOGLE_IOS_CLIENT_ID as string | undefined;
const ANDROID_CLIENT_ID = (import.meta.env as any).VITE_GOOGLE_ANDROID_CLIENT_ID as string | undefined;

/** True when the native account picker can be used (app + platform client id set). */
export function isNativeGoogleConfigured(): boolean {
  if (!isNativeApp() || !WEB_CLIENT_ID) return false;
  return nativePlatform() === 'ios' ? !!IOS_CLIENT_ID : !!ANDROID_CLIENT_ID;
}

let initialized = false;
async function ensureInitialized(): Promise<any> {
  const { SocialLogin } = await import('@capgo/capacitor-social-login');
  if (!initialized) {
    await SocialLogin.initialize({
      google: {
        webClientId: WEB_CLIENT_ID,
        iOSClientId: IOS_CLIENT_ID,
        // Android uses the web client id as serverClientId for the ID token.
        ...(ANDROID_CLIENT_ID ? {} : {}),
      },
    } as any);
    initialized = true;
  }
  return SocialLogin;
}

/**
 * Trigger the native Google account picker and return the Google ID token
 * (to POST as `credential`). Returns null if unavailable or cancelled.
 */
export async function nativeGoogleSignIn(): Promise<string | null> {
  if (!isNativeGoogleConfigured()) return null;
  try {
    const SocialLogin = await ensureInitialized();
    const res: any = await SocialLogin.login({
      provider: 'google',
      options: { scopes: ['email', 'profile'] },
    });
    // The plugin returns the token under result.idToken (shape guarded defensively).
    return (
      res?.result?.idToken ||
      res?.result?.authentication?.idToken ||
      res?.idToken ||
      null
    );
  } catch {
    return null;
  }
}
