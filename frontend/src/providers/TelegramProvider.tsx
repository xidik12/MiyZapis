import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { setTokens, getCurrentUser } from '@/store/slices/authSlice';
import { setAuthTokens } from '@/services/api';
import { toast } from 'react-toastify';
import { haptic, isTelegram, authWithTelegramWebApp } from '@/lib/telegram';

// ---------------------------------------------------------------------------
// TelegramProvider — makes the main web app run as the bot's Telegram Mini App.
// When launched inside Telegram it: signals ready + expands, applies the
// Telegram theme (light/dark + colors), tags <body> for any TG-specific CSS,
// and AUTO-LOGS-IN the user by validating the signed initData against the
// backend (POST /auth-enhanced/telegram/webapp). Outside Telegram it's a no-op
// pass-through, so the same build serves the website and the mini app.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Telegram?: { WebApp?: any };
  }
}

const tg = (): any => (typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const webApp = tg();
  const inTelegram = Boolean(webApp && webApp.initData);
  // Outside Telegram we render immediately; inside, we hold until auto-auth
  // resolves so the app boots already-authenticated (no logged-out flash).
  const [ready, setReady] = useState(!inTelegram);

  useEffect(() => {
    const wa = tg();
    if (!wa) return;

    // IMPORTANT: telegram-web-app.js creates a window.Telegram.WebApp stub on the
    // PLAIN WEBSITE too (no initData). Only treat this as Telegram — and only
    // touch the dark class / tg styling — when there's real initData. Otherwise
    // the stub's default colorScheme ('light') was wiping the user's manual
    // light/dark choice owned by ThemeContext.
    const inTelegram = Boolean(wa.initData);

    try {
      wa.ready?.();
      wa.expand?.();
      if (inTelegram) {
        document.body.classList.add('tg-webapp');
        const apply = () => {
          if (wa.colorScheme === 'dark') document.documentElement.classList.add('dark');
          else if (wa.colorScheme === 'light') document.documentElement.classList.remove('dark');
          try {
            wa.setHeaderColor?.('secondary_bg_color');
            if (wa.themeParams?.bg_color) wa.setBackgroundColor?.(wa.themeParams.bg_color);
          } catch { /* older clients */ }
        };
        apply();
        wa.onEvent?.('themeChanged', apply);
      }
    } catch { /* ignore */ }

    if (!inTelegram) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const tokens = await authWithTelegramWebApp();
        if (!cancelled && tokens) {
          setAuthTokens(tokens);
          dispatch(setTokens(tokens));
          // Load the CANONICAL user via /auth/me (correct lowercase userType,
          // matching the rest of the app) — the webapp endpoint returns an
          // uppercase userType that breaks role redirects.
          try { await dispatch(getCurrentUser()).unwrap(); } catch { /* ignore */ }
        }
      } catch (err) {
        // Silent — fall through to the normal (manual) login UI.
        console.error('Telegram auto-auth failed:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Global haptics: fire a notification buzz whenever a success/error/warning
  // toast appears — covers most "key actions" (saved, booked, paid, failed)
  // without touching every handler. Telegram-only.
  useEffect(() => {
    if (!isTelegram()) return;
    const unsub = toast.onChange((payload) => {
      if (payload.status !== 'added') return;
      if (payload.type === 'success') haptic.notify('success');
      else if (payload.type === 'error') haptic.notify('error');
      else if (payload.type === 'warning') haptic.notify('warning');
    });
    return () => { try { unsub(); } catch { /* noop */ } };
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tg-theme-bg-color, #0f172a)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'tgspin 0.8s linear infinite' }} />
        <style>{`@keyframes tgspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  return <>{children}</>;
};

export default TelegramProvider;
