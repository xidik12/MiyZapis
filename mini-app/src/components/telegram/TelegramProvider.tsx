import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTelegramWebApp, UseTelegramWebAppReturn } from '@/hooks/useTelegramWebApp';
import { telegramAuthService } from '@/services/telegramAuth.service';
import { User } from '@/types';

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

interface TelegramProviderProps {
  children: React.ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const telegramWebApp = useTelegramWebApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Setup axios interceptors
        telegramAuthService.setupAxiosInterceptors();

        // Check if user is already authenticated
        if (telegramAuthService.isAuthenticated()) {
          const currentUser = await telegramAuthService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        } else if (telegramWebApp.webApp && telegramWebApp.initData) {
          // Try to authenticate with Telegram init data
          await authenticateWithTelegram();
        }
      } catch (err) {
        console.error('Authentication initialization failed:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    if (telegramWebApp.isReady) {
      initializeAuth();
    }
  }, [telegramWebApp.isReady, telegramWebApp.initData]);

  const authenticateWithTelegram = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!telegramWebApp.initData) {
        throw new Error('No Telegram init data available');
      }

      const authResponse = await telegramAuthService.authenticateWithTelegram(
        telegramWebApp.initData
      );

      setUser(authResponse.user);
      setIsAuthenticated(true);
      
      // Show success feedback
      await telegramWebApp.showAlert('Successfully authenticated!');
      telegramWebApp.hapticFeedback.notificationSuccess();
      
    } catch (err) {
      console.error('Telegram authentication failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      telegramWebApp.hapticFeedback.notificationError();
      
      // Try to register if user doesn't exist
      if (err instanceof Error && err.message.includes('not found')) {
        await handleUserRegistration();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserRegistration = async (): Promise<void> => {
    try {
      if (!telegramWebApp.user || !telegramWebApp.initData) {
        throw new Error('No user data available for registration');
      }

      const shouldRegister = await telegramWebApp.showConfirm(
        'You are not registered yet. Would you like to create an account?'
      );

      if (!shouldRegister) {
        setError('Registration cancelled');
        return;
      }

      // Get additional user data if needed
      const registrationData = {
        firstName: telegramWebApp.user.first_name,
        lastName: telegramWebApp.user.last_name,
        phone: undefined,
        email: undefined
      };

      const authResponse = await telegramAuthService.registerWithTelegram(
        telegramWebApp.initData,
        registrationData
      );

      setUser(authResponse.user);
      setIsAuthenticated(true);
      
      await telegramWebApp.showAlert('Account created successfully!');
      telegramWebApp.hapticFeedback.notificationSuccess();
      
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      telegramWebApp.hapticFeedback.notificationError();
    }
  };

  const login = async (additionalData?: any): Promise<void> => {
    if (additionalData) {
      // Handle manual registration with additional data
      try {
        setIsLoading(true);
        setError(null);

        if (!telegramWebApp.initData) {
          throw new Error('No Telegram init data available');
        }

        const authResponse = await telegramAuthService.registerWithTelegram(
          telegramWebApp.initData,
          additionalData
        );

        setUser(authResponse.user);
        setIsAuthenticated(true);
        
        telegramWebApp.hapticFeedback.notificationSuccess();
        
      } catch (err) {
        console.error('Login failed:', err);
        setError(err instanceof Error ? err.message : 'Login failed');
        telegramWebApp.hapticFeedback.notificationError();
      } finally {
        setIsLoading(false);
      }
    } else {
      await authenticateWithTelegram();
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await telegramAuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      telegramWebApp.hapticFeedback.impactLight();
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  // Configure Telegram Web App based on authentication state
  useEffect(() => {
    if (telegramWebApp.webApp) {
      // Configure main button
      if (isAuthenticated) {
        telegramWebApp.mainButton.hide();
      }
      
      // Configure back button
      telegramWebApp.backButton.hide();
      
      // Apply theme
      telegramWebApp.applyTheme();
      
      // Expand viewport for better UX
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
    clearError
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
};