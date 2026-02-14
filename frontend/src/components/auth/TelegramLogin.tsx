import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { telegramLogin } from '@/store/slices/authSlice';

interface TelegramLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

// Declare the global callback for Telegram widget
declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onSuccess, onError, disabled = false }) => {
  const dispatch = useAppDispatch();
  const botUsername = (import.meta.env as any).VITE_TELEGRAM_BOT_USERNAME;
  const [isLoading, setIsLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  const handleAuth = useCallback(async (user: any) => {
    setIsLoading(true);
    try {
      const telegramData = {
        telegramId: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name || '',
        ...(user.username && { username: user.username }),
        ...(user.photo_url && { photoUrl: user.photo_url }),
        authDate: user.auth_date,
        hash: user.hash,
      };

      await dispatch(telegramLogin(telegramData)).unwrap();
      onSuccess?.();
    } catch (error: any) {
      console.error('Telegram Auth Error:', error);
      onError?.(error.message || 'Telegram authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, onSuccess, onError]);

  useEffect(() => {
    if (!botUsername || botUsername === 'your_bot_username' || scriptLoaded.current) return;

    // Set global callback
    window.onTelegramAuth = handleAuth;

    // Inject Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
      widgetRef.current.appendChild(script);
      scriptLoaded.current = true;
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botUsername, handleAuth]);

  if (!botUsername || botUsername === 'your_bot_username') {
    return null;
  }

  return (
    <div className="w-full">
      {/* Telegram widget container */}
      <div ref={widgetRef} className="flex justify-center [&>iframe]:!rounded-xl [&>iframe]:!w-full" />

      {/* Fallback button if widget fails to load */}
      {isLoading && (
        <div className="flex items-center justify-center py-3 text-sm text-gray-500 dark:text-gray-400">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting to Telegram...
        </div>
      )}
    </div>
  );
};

export default TelegramLogin;
