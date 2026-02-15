import React, { useState, useEffect, useRef, useCallback } from 'react';
import { userService } from '@/services/user.service';
import { useAppDispatch } from '@/hooks/redux';
import { updateUserProfile } from '@/store/slices/authSlice';

interface TelegramLinkWidgetProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    onTelegramLinkAuth?: (user: any) => void;
  }
}

const TelegramLinkWidget: React.FC<TelegramLinkWidgetProps> = ({ onSuccess, onError }) => {
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
      const linkData = {
        telegramId: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name || undefined,
        username: user.username || undefined,
        authDate: user.auth_date,
        hash: user.hash,
      };

      await userService.linkTelegram(linkData);
      dispatch(updateUserProfile({ telegramId: linkData.telegramId }));
      onSuccess?.();
    } catch (error: any) {
      console.error('Telegram Link Error:', error);
      onError?.(error.message || 'Failed to link Telegram account');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, onSuccess, onError]);

  useEffect(() => {
    if (!botUsername || botUsername === 'your_bot_username' || scriptLoaded.current) return;

    window.onTelegramLinkAuth = handleAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'medium');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onTelegramLinkAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    const checkInterval = setInterval(() => {
      if (widgetRef.current) {
        const iframe = widgetRef.current.querySelector('iframe');
        if (iframe && iframe.offsetHeight > 0) {
          setWidgetReady(true);
          clearInterval(checkInterval);
        }
      }
    }, 500);

    const stopTimeout = setTimeout(() => clearInterval(checkInterval), 4000);

    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
      widgetRef.current.appendChild(script);
      scriptLoaded.current = true;
    }

    return () => {
      clearInterval(checkInterval);
      clearTimeout(stopTimeout);
      delete window.onTelegramLinkAuth;
    };
  }, [botUsername, handleAuth]);

  if (!botUsername || botUsername === 'your_bot_username') {
    return null;
  }

  return (
    <div className="w-full">
      {/* Hidden widget container */}
      <div
        ref={widgetRef}
        className={`flex justify-center [&>iframe]:!rounded-xl ${widgetReady ? '' : 'hidden'}`}
      />

      {/* Fallback deep link button */}
      {!widgetReady && (
        <a
          href={`https://t.me/${botUsername}?start=link`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 py-2 px-4 bg-[#54a9eb] hover:bg-[#4a96d2] text-white text-sm font-medium rounded-xl transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Link Telegram
        </a>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Linking Telegram...
        </div>
      )}
    </div>
  );
};

export default TelegramLinkWidget;
