import React, { createContext, useContext, useEffect, useState } from 'react';
import { TelegramThemeParams } from '@/types/telegram';

interface TelegramThemeContextType {
  themeParams: TelegramThemeParams;
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  viewportHeight: number;
  platform: string;
  applyTheme: () => void;
  setCustomTheme: (theme: Partial<TelegramThemeParams>) => void;
}

const TelegramThemeContext = createContext<TelegramThemeContextType | undefined>(undefined);

export const useTelegramTheme = (): TelegramThemeContextType => {
  const context = useContext(TelegramThemeContext);
  if (!context) {
    throw new Error('useTelegramTheme must be used within TelegramThemeProvider');
  }
  return context;
};

interface TelegramThemeProviderProps {
  children: React.ReactNode;
}

export const TelegramThemeProvider: React.FC<TelegramThemeProviderProps> = ({ children }) => {
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({});
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    
    if (webApp) {
      // Initialize theme from Telegram
      setThemeParams(webApp.themeParams);
      setColorScheme(webApp.colorScheme);
      setIsExpanded(webApp.isExpanded);
      setViewportHeight(webApp.viewportHeight);
      setPlatform(webApp.platform);
      
      // Apply initial theme
      applyTelegramTheme(webApp.themeParams, webApp.colorScheme);
      
      // Listen for theme changes
      const handleThemeChanged = () => {
        setThemeParams(webApp.themeParams);
        setColorScheme(webApp.colorScheme);
        applyTelegramTheme(webApp.themeParams, webApp.colorScheme);
      };
      
      const handleViewportChanged = () => {
        setIsExpanded(webApp.isExpanded);
        setViewportHeight(webApp.viewportHeight);
        updateViewportHeight(webApp.viewportHeight);
      };
      
      webApp.onEvent('themeChanged', handleThemeChanged);
      webApp.onEvent('viewportChanged', handleViewportChanged);
      
      return () => {
        webApp.offEvent('themeChanged', handleThemeChanged);
        webApp.offEvent('viewportChanged', handleViewportChanged);
      };
    } else {
      // Fallback for development/testing
      applyDefaultTheme();
    }
  }, []);

  const applyTelegramTheme = (theme: TelegramThemeParams, scheme: 'light' | 'dark') => {
    const root = document.documentElement;

    // Apply Telegram theme variables — MiyZapis dark-first design
    const themeMap = {
      '--tg-color-bg': theme.bg_color || '#0c0f16',
      '--tg-color-text': theme.text_color || '#f0f2f5',
      '--tg-color-hint': theme.hint_color || '#64748b',
      '--tg-color-link': theme.link_color || '#0ea5e9',
      '--tg-color-button': theme.button_color || '#14b8a6',
      '--tg-color-button-text': theme.button_text_color || '#ffffff',
      '--tg-color-secondary-bg': theme.secondary_bg_color || '#141820',
      '--tg-color-header-bg': theme.header_bg_color || '#0c0f16',
      '--tg-color-accent-text': theme.accent_text_color || '#14b8a6',
      '--tg-color-section-bg': theme.section_bg_color || 'rgba(22, 28, 38, 0.65)',
      '--tg-color-section-header-text': theme.section_header_text_color || '#94a3b8',
      '--tg-color-subtitle-text': theme.subtitle_text_color || '#64748b',
      '--tg-color-destructive-text': theme.destructive_text_color || '#ff4d6a',
    };
    
    Object.entries(themeMap).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Apply color scheme class
    document.body.classList.toggle('dark', scheme === 'dark');
    document.body.setAttribute('data-theme', scheme);
    
    // Set body background
    document.body.style.backgroundColor = themeMap['--tg-color-bg'];
    document.body.style.color = themeMap['--tg-color-text'];
    
    // Apply platform-specific styles
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      document.body.classList.add(`platform-${webApp.platform}`);
      document.body.classList.toggle('expanded', webApp.isExpanded);
    }
  };

  const applyDefaultTheme = () => {
    // Default dark theme for development (matches MiyZapis design system)
    const defaultTheme: TelegramThemeParams = {
      bg_color: '#0c0f16',
      text_color: '#f0f2f5',
      hint_color: '#64748b',
      link_color: '#0ea5e9',
      button_color: '#14b8a6',
      button_text_color: '#ffffff',
      secondary_bg_color: '#141820',
      header_bg_color: '#0c0f16',
      accent_text_color: '#14b8a6',
      section_bg_color: 'rgba(22, 28, 38, 0.65)',
      section_header_text_color: '#94a3b8',
      subtitle_text_color: '#64748b',
      destructive_text_color: '#ff4d6a',
    };

    applyTelegramTheme(defaultTheme, 'dark');
  };

  const updateViewportHeight = (height: number) => {
    document.documentElement.style.setProperty('--tg-viewport-height', `${height}px`);
  };

  const applyTheme = () => {
    applyTelegramTheme(themeParams, colorScheme);
  };

  const setCustomTheme = (customTheme: Partial<TelegramThemeParams>) => {
    const mergedTheme = { ...themeParams, ...customTheme };
    setThemeParams(mergedTheme);
    applyTelegramTheme(mergedTheme, colorScheme);
  };

  const contextValue: TelegramThemeContextType = {
    themeParams,
    colorScheme,
    isExpanded,
    viewportHeight,
    platform,
    applyTheme,
    setCustomTheme
  };

  return (
    <TelegramThemeContext.Provider value={contextValue}>
      {children}
    </TelegramThemeContext.Provider>
  );
};