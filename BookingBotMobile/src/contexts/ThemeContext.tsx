import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../types';
import { PRIMARY_COLORS, SECONDARY_COLORS, ACCENT_COLORS, NEUTRAL_COLORS, SUCCESS_COLOR, ERROR_COLOR } from '../utils/design';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
  };
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Panhaha color scheme - using design system constants
const lightColors = {
  primary: PRIMARY_COLORS[500], // Dark Navy Blue
  secondary: SECONDARY_COLORS[500], // Bright Crimson Red
  accent: ACCENT_COLORS[500], // Gold
  background: NEUTRAL_COLORS[50],
  surface: '#FFFFFF',
  text: NEUTRAL_COLORS[900],
  textSecondary: NEUTRAL_COLORS[500],
  border: NEUTRAL_COLORS[200],
  error: ERROR_COLOR,
  success: SUCCESS_COLOR,
};

const darkColors = {
  primary: PRIMARY_COLORS[400], // Lighter Navy Blue
  secondary: SECONDARY_COLORS[400], // Lighter Crimson Red
  accent: ACCENT_COLORS[400], // Lighter Gold
  background: NEUTRAL_COLORS[900],
  surface: NEUTRAL_COLORS[800],
  text: NEUTRAL_COLORS[50],
  textSecondary: NEUTRAL_COLORS[400],
  border: NEUTRAL_COLORS[700],
  error: SECONDARY_COLORS[400],
  success: PRIMARY_COLORS[400],
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeState(savedTheme as Theme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Update isDark based on theme
  useEffect(() => {
    if (theme === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme, systemColorScheme]);

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

