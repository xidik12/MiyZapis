import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Capacitor native-shell glue. The iOS/Android apps load the live web app
// (Live-site wrap), so this code ships with the web build and only activates
// inside the native wrapper — it no-ops on the website and in Telegram.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
const cap = (): any => (typeof window !== 'undefined' ? (window as any).Capacitor : undefined);

export const isNativeApp = (): boolean => Boolean(cap()?.isNativePlatform?.());
export const nativePlatform = (): string => cap()?.getPlatform?.() ?? 'web';

/**
 * Wire native-shell behaviour: Android hardware back button (navigate back, or
 * exit at the root), a matching status-bar style, and hide the splash once the
 * app is interactive. Call once inside the Router (e.g. from <App/>). No-op on
 * web/Telegram.
 */
export function useCapacitorShell(): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeApp()) return;
    let removeBack: (() => void) | undefined;

    (async () => {
      // Android hardware back button → in-app back, or exit at the root.
      try {
        const { App } = await import('@capacitor/app');
        const sub = await App.addListener('backButton', ({ canGoBack }: any) => {
          if (canGoBack && window.history.length > 1) navigate(-1);
          else App.exitApp();
        });
        removeBack = () => { try { sub.remove(); } catch { /* noop */ } };
      } catch { /* plugin unavailable */ }

      // Status bar: match the app theme (dark icons on light, light on dark).
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const dark = document.documentElement.classList.contains('dark');
        await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
      } catch { /* ignore */ }

      // Hide the native splash once the web app is up.
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch { /* ignore */ }

      // Register for native push (no-op on web/Telegram).
      registerPush((path) => navigate(path));
    })();

    return () => { removeBack?.(); };
  }, [navigate]);
}

/**
 * Register the device for native push notifications and sync the FCM/APNs token
 * to the backend. No-op off-native. Safe to call repeatedly (e.g. after login) —
 * the token is upserted server-side. Tapping a push navigates to data.url.
 */
export async function registerPush(navigate?: (path: string) => void): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return;

    await PushNotifications.addListener('registration', async (token: { value: string }) => {
      try {
        const { apiClient } = await import('@/services/api');
        await apiClient.post('/notifications/device-token', { token: token.value, platform: nativePlatform() });
      } catch { /* not signed in yet — re-registers on next launch */ }
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
      const url = action?.notification?.data?.url;
      if (url && navigate) navigate(String(url));
    });

    await PushNotifications.register();
  } catch { /* plugin unavailable */ }
}
