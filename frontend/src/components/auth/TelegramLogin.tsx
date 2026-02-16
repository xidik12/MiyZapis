import React, { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { telegramLogin } from '@/store/slices/authSlice';

interface TelegramLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onSuccess, onError, disabled = false }) => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    // Set up global callback function
    window.onTelegramAuth = handleTelegramAuth;

    // Load Telegram widget script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername || 'your_bot_username');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      // Cleanup
      if (containerRef.current && script.parentNode) {
        containerRef.current.removeChild(script);
      }
      delete window.onTelegramAuth;
    };
  }, [botUsername]);

  const handleTelegramAuth = async (user: TelegramUser) => {
    try {
      if (!user || !user.hash) {
        throw new Error('Invalid Telegram authentication data');
      }

      // Send Telegram's original field names so the backend can verify the hash correctly.
      // Telegram computes the hash over "auth_date=...\nfirst_name=...\nid=..." etc.
      const telegramData: Record<string, any> = {
        telegramId: user.id.toString(),
        firstName: user.first_name,
        authDate: user.auth_date,
        hash: user.hash,
      };
      if (user.last_name) telegramData.lastName = user.last_name;
      if (user.username) telegramData.username = user.username;
      if (user.photo_url) telegramData.photoUrl = user.photo_url;

      // Dispatch Telegram login action
      await dispatch(telegramLogin(telegramData)).unwrap();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Telegram Auth Error:', error);
      const errorMessage = error.message || 'Telegram authentication failed';
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  if (!botUsername || botUsername === 'your_bot_username') {
    return null; // Don't render if not configured
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full flex justify-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    />
  );
};

export default TelegramLogin;