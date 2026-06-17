import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { environment } from '@/config/environment';

// ---------------------------------------------------------------------------
// Telegram Mini App native-feel helpers: haptics + hardware BackButton.
// Everything no-ops outside Telegram, so it's safe to call from the website.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
export const tgWebApp = (): any =>
  typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined;

export const isTelegram = (): boolean => Boolean(tgWebApp()?.initData);

export interface TgWebAppTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authenticate the current Telegram Mini App user by validating the signed
 * initData against the backend. Returns tokens on success, null otherwise.
 * Google OAuth can't run inside Telegram's webview, so this is the in-app
 * login path. Shared by TelegramProvider (auto-auth on boot) and the
 * "Continue with Telegram" button on the login/register pages.
 */
export async function authWithTelegramWebApp(): Promise<TgWebAppTokens | null> {
  const wa = tgWebApp();
  if (!wa?.initData) return null;
  const res = await fetch(`${environment.API_URL}/auth-enhanced/telegram/webapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: wa.initData }),
  });
  const data = await res.json();
  if (data?.success && data?.data?.tokens?.accessToken) {
    return {
      accessToken: data.data.tokens.accessToken,
      refreshToken: data.data.tokens.refreshToken,
    };
  }
  return null;
}

export const haptic = {
  impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
    try { tgWebApp()?.HapticFeedback?.impactOccurred(style); } catch { /* noop */ }
  },
  notify(type: 'error' | 'success' | 'warning') {
    try { tgWebApp()?.HapticFeedback?.notificationOccurred(type); } catch { /* noop */ }
  },
  selection() {
    try { tgWebApp()?.HapticFeedback?.selectionChanged(); } catch { /* noop */ }
  },
};

// Routes where the Telegram BackButton should be HIDDEN (these are "home"
// screens — Telegram's own swipe-down-to-close applies there).
const ROOT_PATHS = new Set(['/', '/dashboard', '/customer/dashboard', '/specialist/dashboard']);

/**
 * Show Telegram's hardware/back button on non-home routes and wire it to
 * navigate back. Call once inside the Router (e.g. from <App/>). No-op on web.
 */
export function useTelegramBackButton(): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const bb = tgWebApp()?.BackButton;
    if (!bb) return;

    const goBack = () => {
      if (window.history.length > 1) navigate(-1);
      else navigate('/', { replace: true });
    };

    if (ROOT_PATHS.has(location.pathname)) {
      bb.hide?.();
    } else {
      bb.show?.();
    }
    bb.onClick?.(goBack);
    return () => { try { bb.offClick?.(goBack); } catch { /* noop */ } };
  }, [location.pathname, navigate]);
}
