import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { setTokens, setUser } from '@/store/slices/authSlice';
import { setAuthTokens } from '@/services/api';
import { environment } from '@/config/environment';

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

    // Chrome: ready + full height + theme.
    try {
      wa.ready?.();
      wa.expand?.();
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
    } catch { /* ignore */ }

    if (!wa.initData) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${environment.API_URL}/auth-enhanced/telegram/webapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: wa.initData }),
        });
        const data = await res.json();
        if (!cancelled && data?.success && data?.data?.tokens?.accessToken) {
          const { user, tokens } = data.data;
          setAuthTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
          dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
          if (user) dispatch(setUser(user));
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
