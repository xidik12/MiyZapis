import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTelegramWebApp, UseTelegramWebAppReturn } from '@/hooks/useTelegramWebApp';
import { User } from '@/types';

// @ts-ignore
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api/v1';

interface TelegramContextType extends UseTelegramWebAppReturn {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (additionalData?: any) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const useTelegram = (): TelegramContextType => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
};

/** Parse Telegram initData URL-encoded string to extract auth_date and hash */
function parseInitData(initData: string): { authDate: number; hash: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const authDate = params.get('auth_date');
    const hash = params.get('hash');
    if (!authDate || !hash) return null;
    return { authDate: parseInt(authDate, 10), hash };
  } catch {
    return null;
  }
}

/** Store auth tokens in both localStorage keys for compatibility */
function storeTokens(token: string, refreshToken?: string) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('booking_app_token', token);
  if (refreshToken) {
    localStorage.setItem('booking_app_refresh_token', refreshToken);
  }
}

/** Get stored auth token */
function getStoredToken(): string | null {
  return localStorage.getItem('authToken') || localStorage.getItem('booking_app_token');
}

/** Check if stored token is still valid (not expired) */
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

/** Clear all auth tokens */
function clearTokens() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('booking_app_token');
  localStorage.removeItem('booking_app_refresh_token');
}

interface TelegramProviderProps {
  children: React.ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const telegramWebApp = useTelegramWebApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticate via /auth-enhanced/telegram endpoint
  const authenticateWithTelegram = useCallback(async (): Promise<boolean> => {
    if (!telegramWebApp.initData) return false;

    const tgUser = (telegramWebApp.webApp as any)?.initDataUnsafe?.user;
    if (!tgUser?.id) return false;

    const parsed = parseInitData(telegramWebApp.initData);
    if (!parsed) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/auth-enhanced/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgUser.id.toString(),
          firstName: tgUser.first_name || 'User',
          lastName: tgUser.last_name || '',
          username: tgUser.username || '',
          authDate: parsed.authDate,
          hash: parsed.hash,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const { tokens, user: authUser, token } = data.data;
        const authToken = tokens?.accessToken || tokens?.token || token || '';
        if (authToken) {
          storeTokens(authToken, tokens?.refreshToken);
        }
        setUser(authUser);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Telegram auth request failed:', err);
      return false;
    }
  }, [telegramWebApp.initData, telegramWebApp.webApp]);

  // Fetch current user profile using stored token
  const fetchCurrentUser = useCallback(async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Check for existing valid token
        const existingToken = getStoredToken();
        if (existingToken && isTokenValid(existingToken)) {
          const restored = await fetchCurrentUser(existingToken);
          if (restored) {
            setIsLoading(false);
            return;
          }
        }

        // 2. Try auto-auth with Telegram initData
        if (telegramWebApp.webApp && telegramWebApp.initData) {
          const success = await authenticateWithTelegram();
          if (success) {
            telegramWebApp.hapticFeedback.notificationSuccess();
          }
          // If failed, silently show login page — no popup, no error
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (telegramWebApp.isReady) {
      initializeAuth();
    }
  }, [telegramWebApp.isReady, telegramWebApp.initData, authenticateWithTelegram, fetchCurrentUser]);

  const login = useCallback(async (additionalData?: any): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (additionalData) {
        // Manual registration with additional data via /auth-enhanced/register
        const tgUser = (telegramWebApp.webApp as any)?.initDataUnsafe?.user;
        const parsed = telegramWebApp.initData ? parseInitData(telegramWebApp.initData) : null;

        const res = await fetch(`${API_BASE_URL}/auth-enhanced/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: additionalData.firstName || tgUser?.first_name || 'User',
            lastName: additionalData.lastName || tgUser?.last_name || '',
            email: additionalData.email || `telegram_${tgUser?.id || 'unknown'}@miyzapis.com`,
            password: additionalData.password || `tg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            phone: additionalData.phone || '',
            telegramId: tgUser?.id?.toString() || '',
            userType: additionalData.userType || 'customer',
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          const { tokens, user: authUser, token } = data.data;
          const authToken = tokens?.accessToken || tokens?.token || token || '';
          if (authToken) storeTokens(authToken, tokens?.refreshToken);
          setUser(authUser);
          setIsAuthenticated(true);
          telegramWebApp.hapticFeedback.notificationSuccess();
        } else {
          throw new Error(data.error || data.message || 'Registration failed');
        }
      } else {
        // Try Telegram auto-auth
        const success = await authenticateWithTelegram();
        if (!success) {
          throw new Error('Telegram authentication failed');
        }
        telegramWebApp.hapticFeedback.notificationSuccess();
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      telegramWebApp.hapticFeedback.notificationError();
    } finally {
      setIsLoading(false);
    }
  }, [authenticateWithTelegram, telegramWebApp]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const token = getStoredToken();
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        } catch { /* ignore logout API errors */ }
      }
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      telegramWebApp.hapticFeedback.impactLight();
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  }, [telegramWebApp]);

  const clearErrorFn = useCallback((): void => {
    setError(null);
  }, []);

  // Configure Telegram Web App
  useEffect(() => {
    if (telegramWebApp.webApp) {
      if (isAuthenticated) {
        telegramWebApp.mainButton.hide();
      }
      telegramWebApp.backButton.hide();
      telegramWebApp.applyTheme();
      telegramWebApp.expand();
    }
  }, [isAuthenticated, telegramWebApp]);

  const contextValue: TelegramContextType = {
    ...telegramWebApp,
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    clearError: clearErrorFn
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
};
