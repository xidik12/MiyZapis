import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { telegramLogin } from '@/store/slices/authSlice';

interface TelegramLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onSuccess, onError, disabled = false }) => {
  const dispatch = useAppDispatch();
  const botUsername = (import.meta.env as any).VITE_TELEGRAM_BOT_USERNAME;
  const [isLoading, setIsLoading] = useState(false);

  const handleTelegramLogin = () => {
    if (!botUsername || botUsername === 'your_bot_username') return;

    // Open Telegram OAuth in a popup window
    const redirectUri = `${window.location.origin}/auth/telegram-callback`;
    const authUrl = `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${encodeURIComponent(window.location.origin)}&request_access=write&return_to=${encodeURIComponent(redirectUri)}`;

    const width = 550;
    const height = 470;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'TelegramAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      onError?.('Failed to open Telegram login popup. Please allow popups.');
      return;
    }

    setIsLoading(true);

    // Listen for messages from the popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (data?.type === 'telegram-auth' && data.user) {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);

        try {
          const telegramData = {
            telegramId: data.user.id.toString(),
            firstName: data.user.first_name,
            lastName: data.user.last_name || '',
            ...(data.user.username && { username: data.user.username }),
            authDate: data.user.auth_date,
            hash: data.user.hash,
          };

          await dispatch(telegramLogin(telegramData)).unwrap();
          onSuccess?.();
        } catch (error: any) {
          console.error('Telegram Auth Error:', error);
          onError?.(error.message || 'Telegram authentication failed');
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed without completing auth
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        setIsLoading(false);
      }
    }, 500);
  };

  if (!botUsername || botUsername === 'your_bot_username') {
    return null;
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleTelegramLogin}
        disabled={disabled || isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.84 14.22 15.51 15.99C15.37 16.74 15.09 16.99 14.83 17.02C14.25 17.07 13.81 16.64 13.25 16.27C12.37 15.69 11.87 15.33 11.02 14.77C10.03 14.12 10.67 13.76 11.24 13.18C11.39 13.03 13.95 10.7 14 10.49C14.0069 10.4582 14.0039 10.4252 13.9914 10.3949C13.979 10.3646 13.9575 10.3381 13.93 10.318C13.88 10.29 13.82 10.3 13.77 10.31C13.7 10.33 12.25 11.28 9.44 13.16C9.04 13.43 8.68 13.56 8.36 13.55C8.01 13.54 7.33 13.34 6.83 13.17C6.21 12.96 5.72 12.85 5.76 12.5C5.78 12.33 6.01 12.15 6.45 11.97C9.48 10.63 11.5 9.75 12.51 9.33C15.4 8.11 15.92 7.92 16.27 7.92C16.35 7.92 16.53 7.94 16.65 8.04C16.75 8.12 16.78 8.23 16.79 8.31C16.78 8.37 16.8 8.53 16.64 8.8Z"
            fill="#2AABEE"
          />
        </svg>
        {isLoading ? 'Connecting...' : 'Sign in with Telegram'}
      </button>
    </div>
  );
};

export default TelegramLogin;
