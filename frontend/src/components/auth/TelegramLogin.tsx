import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { telegramLogin } from '@/store/slices/authSlice';
import { useLanguage } from '@/contexts/LanguageContext';

interface TelegramLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onSuccess, onError, disabled = false }) => {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const rawBotUsername = (import.meta.env as any).VITE_TELEGRAM_BOT_USERNAME;
  const botUsername = rawBotUsername?.replace(/^@/, '');
  const [isLoading, setIsLoading] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  const handleAuth = useCallback(async (user: any) => {
    setIsLoading(true);
    try {
      // Only include optional fields if they have values — Telegram
      // computes the hash only over fields that are present.
      // Sending empty strings breaks the hash verification.
      const telegramData: Record<string, any> = {
        telegramId: user.id.toString(),
        firstName: user.first_name,
        authDate: user.auth_date,
        hash: user.hash,
      };
      if (user.last_name) telegramData.lastName = user.last_name;
      if (user.username) telegramData.username = user.username;
      if (user.photo_url) telegramData.photoUrl = user.photo_url;

      await dispatch(telegramLogin(telegramData)).unwrap();
      onSuccess?.();
    } catch (error: any) {
      console.error('Telegram Auth Error:', error);
      onError?.(error.message || 'Telegram authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, onSuccess, onError]);

  // Load the official Telegram Login Widget
  useEffect(() => {
    if (!botUsername || botUsername === 'your_bot_username' || scriptLoaded.current) return;

    window.onTelegramAuth = handleAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Check if widget actually renders an iframe (means domain is configured)
    const checkInterval = setInterval(() => {
      if (widgetRef.current) {
        const iframe = widgetRef.current.querySelector('iframe');
        if (iframe && iframe.offsetHeight > 0) {
          setWidgetReady(true);
          clearInterval(checkInterval);
        }
      }
    }, 500);

    // Stop checking after 4 seconds
    const stopTimeout = setTimeout(() => clearInterval(checkInterval), 4000);

    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
      widgetRef.current.appendChild(script);
      scriptLoaded.current = true;
    }

    return () => {
      clearInterval(checkInterval);
      clearTimeout(stopTimeout);
      delete window.onTelegramAuth;
    };
  }, [botUsername, handleAuth]);

  if (!botUsername || botUsername === 'your_bot_username') {
    return null;
  }

  return (
    <div className="w-full">
      {/* Hidden widget container — only shown when iframe renders successfully */}
      <div
        ref={widgetRef}
        className={`flex justify-center [&>iframe]:!rounded-xl [&>iframe]:!w-full ${widgetReady ? '' : 'hidden'}`}
      />

      {/* Always show styled button unless widget loaded successfully */}
      {!widgetReady && (
        <a
          href={`https://t.me/${botUsername}?start=login`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#54a9eb] hover:bg-[#4a96d2] text-white font-semibold rounded-xl transition-colors duration-200 shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          {t('telegram.login.title')}
        </a>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-3 text-sm text-gray-500 dark:text-gray-400">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t('telegram.login.subtitle')}
        </div>
      )}
    </div>
  );
};

export default TelegramLogin;
