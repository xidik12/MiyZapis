import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { setTokens, getCurrentUser } from '@/store/slices/authSlice';
import { setAuthTokens } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { authWithTelegramWebApp, haptic } from '@/lib/telegram';
import { InlineLoader } from '@/components/ui';

interface TelegramMiniAppLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

// One-tap login for the Telegram Mini App. Google OAuth is blocked inside
// Telegram's webview and the Login Widget iframe won't render there either, so
// inside Telegram we authenticate the user from the signed initData instead.
const TelegramMiniAppLogin: React.FC<TelegramMiniAppLoginProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const tokens = await authWithTelegramWebApp();
      if (!tokens) throw new Error(t('telegram.login.failed'));
      setAuthTokens(tokens);
      dispatch(setTokens(tokens));
      await dispatch(getCurrentUser()).unwrap();
      haptic.notify('success');
      onSuccess?.();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      haptic.notify('error');
      onError?.(err.message || t('telegram.login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#54a9eb] hover:bg-[#4a96d2] text-white font-semibold rounded-xl transition duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.96] disabled:active:scale-100"
    >
      {loading ? (
        <InlineLoader size="sm" color="white" className="mr-1" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      )}
      {loading ? t('telegram.login.subtitle') : t('telegram.login.continueWith')}
    </button>
  );
};

export default TelegramMiniAppLogin;
