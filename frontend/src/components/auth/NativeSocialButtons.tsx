import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppDispatch } from '@/hooks/redux';
import { googleLogin } from '@/store/slices/authSlice';
import { openNativeAuth, openNativeTelegram } from '@/lib/nativeAuth';
import { isNativeGoogleConfigured, nativeGoogleSignIn } from '@/lib/nativeGoogle';

// Native-app social sign-in. OAuth (Google/Telegram widgets) is blocked inside
// the app webview, so each button opens the system browser to the web login —
// but we render them with the same branded styling as the website so the app
// doesn't look like a stripped-down fallback.
interface Props {
  mode: 'login' | 'register';
  disabled?: boolean;
}

const GoogleIcon: React.FC = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const TelegramIcon: React.FC = () => (
  <span className="grid place-items-center h-6 w-6 rounded-full bg-white">
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#54a9eb" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  </span>
);

export const NativeSocialButtons: React.FC<Props> = ({ mode, disabled }) => {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // Native account picker when configured; otherwise hand off to the browser flow.
  const handleGoogle = async () => {
    if (!isNativeGoogleConfigured()) {
      openNativeAuth(mode, 'google');
      return;
    }
    setBusy(true);
    try {
      const idToken = await nativeGoogleSignIn();
      if (!idToken) { setBusy(false); return; } // cancelled
      const result: any = await dispatch(googleLogin({ credential: idToken }) as any).unwrap();
      if (result?.requiresUserTypeSelection) {
        // New account needs a role — let the full web UI handle it in the browser.
        openNativeAuth(mode, 'google');
        return;
      }
      navigate('/', { replace: true });
    } catch (e: any) {
      toast.error(e?.message || (t('auth.googleSignInFailed') || 'Google sign-in failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <GoogleIcon />
        {t('auth.google.signIn') || 'Sign in with Google'}
      </button>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => openNativeTelegram(mode)}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#54a9eb] hover:bg-[#4398da] text-white font-medium shadow-sm transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <TelegramIcon />
        {t('telegram.login.title') || 'Sign in with Telegram'}
      </button>
    </div>
  );
};

export default NativeSocialButtons;
