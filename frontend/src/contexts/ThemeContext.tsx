import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check if theme is stored in localStorage
        const stored = localStorage.getItem('booking-theme');
        if (stored === 'light' || stored === 'dark') {
          setTheme(stored);
          return;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
        }
      } catch (error) {
        console.warn('Failed to initialize theme:', error);
      }
    };

    initializeTheme();
  }, []);

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      
      // Remove previous theme classes
      root.classList.remove('light', 'dark');
      
      // Add current theme class
      root.classList.add(theme);
      
      // Store theme preference
      localStorage.setItem('booking-theme', theme);
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1e293b' : '#ffffff');
      }
    } catch (error) {
      console.warn('Failed to apply theme:', error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};