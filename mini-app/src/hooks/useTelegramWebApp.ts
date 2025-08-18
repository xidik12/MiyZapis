import { useEffect, useState, useCallback } from 'react';
import { TelegramWebApp, TelegramWebAppEvent, TelegramUser, TelegramThemeParams } from '@/types/telegram';

export interface UseTelegramWebAppReturn {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string;
  themeParams: TelegramThemeParams;
  isReady: boolean;
  isExpanded: boolean;
  viewportHeight: number;
  colorScheme: 'light' | 'dark';
  platform: string;
  version: string;
  
  // Actions
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  showPopup: (params: any) => Promise<string | undefined>;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openInvoice: (url: string) => Promise<string>;
  
  // Haptic feedback
  hapticFeedback: {
    impactLight: () => void;
    impactMedium: () => void;
    impactHeavy: () => void;
    notificationSuccess: () => void;
    notificationError: () => void;
    notificationWarning: () => void;
    selectionChanged: () => void;
  };
  
  // Main button control
  mainButton: {
    setText: (text: string) => void;
    setColor: (color: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: () => void;
    hideProgress: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  
  // Back button control
  backButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  
  // Theme utilities
  applyTheme: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

export const useTelegramWebApp = (): UseTelegramWebAppReturn => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({});
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tgWebApp = window.Telegram.WebApp;
      setWebApp(tgWebApp);
      setThemeParams(tgWebApp.themeParams);
      setViewportHeight(tgWebApp.viewportHeight);
      setIsExpanded(tgWebApp.isExpanded);
      
      // Initialize the app
      tgWebApp.ready();
      setIsReady(true);
      
      // Apply theme
      applyTelegramTheme(tgWebApp.themeParams);
      
      // Event listeners
      const handleThemeChanged = () => {
        setThemeParams(tgWebApp.themeParams);
        applyTelegramTheme(tgWebApp.themeParams);
      };
      
      const handleViewportChanged = () => {
        setViewportHeight(tgWebApp.viewportHeight);
        setIsExpanded(tgWebApp.isExpanded);
      };
      
      tgWebApp.onEvent('themeChanged', handleThemeChanged);
      tgWebApp.onEvent('viewportChanged', handleViewportChanged);
      
      return () => {
        tgWebApp.offEvent('themeChanged', handleThemeChanged);
        tgWebApp.offEvent('viewportChanged', handleViewportChanged);
      };
    }
  }, []);

  const applyTelegramTheme = useCallback((theme: TelegramThemeParams) => {
    const root = document.documentElement;
    
    // Apply CSS variables
    if (theme.bg_color) root.style.setProperty('--tg-color-bg', theme.bg_color);
    if (theme.text_color) root.style.setProperty('--tg-color-text', theme.text_color);
    if (theme.hint_color) root.style.setProperty('--tg-color-hint', theme.hint_color);
    if (theme.link_color) root.style.setProperty('--tg-color-link', theme.link_color);
    if (theme.button_color) root.style.setProperty('--tg-color-button', theme.button_color);
    if (theme.button_text_color) root.style.setProperty('--tg-color-button-text', theme.button_text_color);
    if (theme.secondary_bg_color) root.style.setProperty('--tg-color-secondary-bg', theme.secondary_bg_color);
    if (theme.header_bg_color) root.style.setProperty('--tg-color-header-bg', theme.header_bg_color);
    if (theme.accent_text_color) root.style.setProperty('--tg-color-accent-text', theme.accent_text_color);
    if (theme.section_bg_color) root.style.setProperty('--tg-color-section-bg', theme.section_bg_color);
    if (theme.section_header_text_color) root.style.setProperty('--tg-color-section-header-text', theme.section_header_text_color);
    if (theme.subtitle_text_color) root.style.setProperty('--tg-color-subtitle-text', theme.subtitle_text_color);
    if (theme.destructive_text_color) root.style.setProperty('--tg-color-destructive-text', theme.destructive_text_color);
    
    // Set viewport height
    if (webApp) {
      root.style.setProperty('--tg-viewport-height', `${webApp.viewportHeight}px`);
    }
    
    // Apply theme class
    document.body.classList.toggle('dark', webApp?.colorScheme === 'dark');
    document.body.style.backgroundColor = theme.bg_color || '';
    document.body.style.color = theme.text_color || '';
  }, [webApp]);

  const ready = useCallback(() => {
    webApp?.ready();
  }, [webApp]);

  const expand = useCallback(() => {
    webApp?.expand();
  }, [webApp]);

  const close = useCallback(() => {
    webApp?.close();
  }, [webApp]);

  const sendData = useCallback((data: string) => {
    webApp?.sendData(data);
  }, [webApp]);

  const showAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      webApp?.showAlert(message, () => resolve());
    });
  }, [webApp]);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      webApp?.showConfirm(message, (confirmed) => resolve(confirmed));
    });
  }, [webApp]);

  const showPopup = useCallback((params: any): Promise<string | undefined> => {
    return new Promise((resolve) => {
      webApp?.showPopup(params, (buttonId) => resolve(buttonId));
    });
  }, [webApp]);

  const openLink = useCallback((url: string, options?: { try_instant_view?: boolean }) => {
    webApp?.openLink(url, options);
  }, [webApp]);

  const openInvoice = useCallback((url: string): Promise<string> => {
    return new Promise((resolve) => {
      webApp?.openInvoice(url, (status) => resolve(status));
    });
  }, [webApp]);

  const hapticFeedback = {
    impactLight: useCallback(() => webApp?.HapticFeedback.impactOccurred('light'), [webApp]),
    impactMedium: useCallback(() => webApp?.HapticFeedback.impactOccurred('medium'), [webApp]),
    impactHeavy: useCallback(() => webApp?.HapticFeedback.impactOccurred('heavy'), [webApp]),
    notificationSuccess: useCallback(() => webApp?.HapticFeedback.notificationOccurred('success'), [webApp]),
    notificationError: useCallback(() => webApp?.HapticFeedback.notificationOccurred('error'), [webApp]),
    notificationWarning: useCallback(() => webApp?.HapticFeedback.notificationOccurred('warning'), [webApp]),
    selectionChanged: useCallback(() => webApp?.HapticFeedback.selectionChanged(), [webApp])
  };

  const mainButton = {
    setText: useCallback((text: string) => webApp?.MainButton.setText(text), [webApp]),
    setColor: useCallback((color: string) => {
      if (webApp?.MainButton) {
        webApp.MainButton.color = color;
      }
    }, [webApp]),
    show: useCallback(() => webApp?.MainButton.show(), [webApp]),
    hide: useCallback(() => webApp?.MainButton.hide(), [webApp]),
    enable: useCallback(() => webApp?.MainButton.enable(), [webApp]),
    disable: useCallback(() => webApp?.MainButton.disable(), [webApp]),
    showProgress: useCallback(() => webApp?.MainButton.showProgress(), [webApp]),
    hideProgress: useCallback(() => webApp?.MainButton.hideProgress(), [webApp]),
    onClick: useCallback((callback: () => void) => webApp?.MainButton.onClick(callback), [webApp]),
    offClick: useCallback((callback: () => void) => webApp?.MainButton.offClick(callback), [webApp])
  };

  const backButton = {
    show: useCallback(() => webApp?.BackButton.show(), [webApp]),
    hide: useCallback(() => webApp?.BackButton.hide(), [webApp]),
    onClick: useCallback((callback: () => void) => webApp?.BackButton.onClick(callback), [webApp]),
    offClick: useCallback((callback: () => void) => webApp?.BackButton.offClick(callback), [webApp])
  };

  const applyTheme = useCallback(() => {
    if (webApp) {
      applyTelegramTheme(webApp.themeParams);
    }
  }, [webApp, applyTelegramTheme]);

  const setHeaderColor = useCallback((color: string) => {
    if (webApp) {
      webApp.headerColor = color;
    }
  }, [webApp]);

  const setBackgroundColor = useCallback((color: string) => {
    if (webApp) {
      webApp.backgroundColor = color;
    }
  }, [webApp]);

  return {
    webApp,
    user: webApp?.initDataUnsafe.user || null,
    initData: webApp?.initData || '',
    themeParams,
    isReady,
    isExpanded,
    viewportHeight,
    colorScheme: webApp?.colorScheme || 'light',
    platform: webApp?.platform || '',
    version: webApp?.version || '',
    
    // Actions
    ready,
    expand,
    close,
    sendData,
    showAlert,
    showConfirm,
    showPopup,
    openLink,
    openInvoice,
    
    // Utilities
    hapticFeedback,
    mainButton,
    backButton,
    applyTheme,
    setHeaderColor,
    setBackgroundColor
  };
};