import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../types';
import { PRIMARY_COLORS, SECONDARY_COLORS, ACCENT_COLORS, NEUTRAL_COLORS, SUCCESS_COLOR, ERROR_COLOR, WARNING_COLOR, INFO_COLOR } from '../utils/design';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Panhaha color scheme - NEW design system
// PRIMARY = Crimson Red (energy, CTAs), SECONDARY = Deep Sea Blue (trust, structure)
const lightColors = {
  primary: PRIMARY_COLORS[500], // #DC2626 - Crimson Red
  secondary: SECONDARY_COLORS[500], // #00739B - Deep Sea Blue
  accent: ACCENT_COLORS[500], // #EAB308 - Gold (borders only)
  info: INFO_COLOR, // #00739B - Deep Sea Blue
  background: NEUTRAL_COLORS[50], // #FAFAFA
  surface: '#FFFFFF',
  text: NEUTRAL_COLORS[900], // #18181B
  textSecondary: NEUTRAL_COLORS[500], // #71717A
  border: NEUTRAL_COLORS[200], // #E4E4E7
  error: ERROR_COLOR, // #DC2626 - Crimson Red
  success: SUCCESS_COLOR, // #10B981 - Emerald Green
  warning: WARNING_COLOR, // #F59E0B - Amber Yellow
};

const darkColors = {
  primary: PRIMARY_COLORS[400], // #F87171 - Lighter Crimson for dark mode
  secondary: SECONDARY_COLORS[400], // #338FAF - Lighter Deep Sea Blue
  accent: ACCENT_COLORS[400], // #FACC15 - Lighter Gold
  info: SECONDARY_COLORS[400], // #338FAF - Lighter Deep Sea Blue
  background: NEUTRAL_COLORS[900], // #18181B
  surface: NEUTRAL_COLORS[800], // #27272A
  text: NEUTRAL_COLORS[50], // #FAFAFA
  textSecondary: NEUTRAL_COLORS[400], // #A1A1AA
  border: NEUTRAL_COLORS[700], // #3F3F46
  error: PRIMARY_COLORS[400], // #F87171 - Lighter Crimson
  success: '#34D399', // Lighter Emerald for dark mode
  warning: '#FCD34D', // Lighter Amber for dark mode
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

