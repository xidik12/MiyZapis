import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { setAuthTokens } from '@/services/api';
import { NATIVE_AUTH_SCHEME, isNativeAuthFlow } from '@/lib/nativeAuth';
import { logger } from '@/utils/logger';

// Landing page for the native "skip straight to Telegram" flow. The system
// browser arrives here after oauth.telegram.org with the signed user payload
// (as a #tgAuthResult fragment, or query params). We exchange it for our tokens
// via the existing /auth-enhanced/telegram endpoint, then hand them back to the
// app over the com.miyzapis.app:// deep link.

function parseTelegramPayload(): Record<string, any> | null {
  try {
    const hash = window.location.hash || '';
    const m = hash.match(/tgAuthResult=([^&]+)/);
    if (m) {
      let b64 = decodeURIComponent(m[1]).replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      return JSON.parse(atob(b64));
    }
  } catch { /* fall through to query parsing */ }
  // Fallback: fields as query params (id, first_name, ..., hash)
  const q = new URLSearchParams(window.location.search);
  if (q.get('id') && q.get('hash')) {
    const o: Record<string, any> = {};
    q.forEach((v, k) => { o[k] = v; });
    return o;
  }
  return null;
}

const TelegramReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = parseTelegramPayload();
      if (!u || !u.id || !u.hash) {
        setError('Telegram sign-in was cancelled or returned no data.');
        return;
      }
      try {
        // Same field mapping the Login Widget uses (only present fields, so the
        // backend hash check matches).
        const data: Record<string, any> = {
          telegramId: String(u.id),
          firstName: u.first_name,
          authDate: u.auth_date,
          hash: u.hash,
        };
        if (u.last_name) data.lastName = u.last_name;
        if (u.username) data.username = u.username;
        if (u.photo_url) data.photoUrl = u.photo_url;

        const res = await authService.telegramAuth(data as any);
        const access = res.tokens.accessToken;
        const refresh = res.tokens.refreshToken;
        setAuthTokens({ accessToken: access, refreshToken: refresh });

        if (isNativeAuthFlow()) {
          // Hand tokens back to the native app.
          window.location.href =
            `${NATIVE_AUTH_SCHEME}://auth?access=${encodeURIComponent(access)}&refresh=${encodeURIComponent(refresh)}`;
        } else {
          navigate('/', { replace: true });
        }
      } catch (e: any) {
        logger.error('Telegram return: auth failed', e);
        setError(e?.message || 'Telegram sign-in failed. Please try again.');
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center">
      <div>
        {error ? (
          <>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/auth/login', { replace: true })}
              className="px-4 py-2 rounded-xl bg-primary-600 text-white font-medium"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">Signing you in with Telegram…</p>
        )}
      </div>
    </div>
  );
};

export default TelegramReturnPage;
