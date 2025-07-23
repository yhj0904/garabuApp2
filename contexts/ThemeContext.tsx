import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: typeof lightColors | typeof darkColors;
}

const lightColors = {
  // Primary colors - Modern blue gradient
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  primaryGradient: ['#3B82F6', '#1D4ED8'],
  
  // Background colors - Clean and bright
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  backgroundElevated: '#FFFFFF',
  
  // Surface colors - Subtle depth
  surface: '#FFFFFF',
  surfaceVariant: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  
  // Text colors - High contrast for readability
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textInverse: '#FFFFFF',
  textMuted: '#94A3B8',
  
  // Border colors - Subtle and clean
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderMedium: '#CBD5E1',
  
  // Status colors - Vibrant and accessible
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Special colors - Financial app specific
  income: '#10B981',
  incomeLight: '#D1FAE5',
  expense: '#EF4444',
  expenseLight: '#FEE2E2',
  transfer: '#8B5CF6',
  transferLight: '#EDE9FE',
  
  // Tint color - Primary accent
  tint: '#3B82F6',
  
  // Shadow - Subtle depth
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',
  
  // Tab bar - Clean and modern
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#94A3B8',
  tabBarBorder: '#E2E8F0',
  
  // Card and component colors
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  input: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputFocus: '#3B82F6',
  
  // Overlay and modal
  overlay: 'rgba(15, 23, 42, 0.4)',
  modal: '#FFFFFF',
  
  // Chart colors
  chart1: '#3B82F6',
  chart2: '#10B981',
  chart3: '#F59E0B',
  chart4: '#EF4444',
  chart5: '#8B5CF6',
  chart6: '#06B6D4',
};

const darkColors = {
  // Primary colors - Bright and vibrant in dark mode
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryLight: '#93C5FD',
  primaryGradient: ['#60A5FA', '#3B82F6'],
  
  // Background colors - Rich dark tones
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#334155',
  backgroundElevated: '#1E293B',
  
  // Surface colors - Layered depth
  surface: '#1E293B',
  surfaceVariant: '#334155',
  surfaceElevated: '#475569',
  
  // Text colors - High contrast on dark
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',
  textMuted: '#64748B',
  
  // Border colors - Subtle but visible
  border: '#334155',
  borderLight: '#475569',
  borderMedium: '#64748B',
  
  // Status colors - Bright and accessible
  success: '#34D399',
  successLight: '#065F46',
  error: '#F87171',
  errorLight: '#7F1D1D',
  warning: '#FBBF24',
  warningLight: '#78350F',
  info: '#60A5FA',
  infoLight: '#1E3A8A',
  
  // Special colors - Financial app specific
  income: '#34D399',
  incomeLight: '#065F46',
  expense: '#F87171',
  expenseLight: '#7F1D1D',
  transfer: '#A78BFA',
  transferLight: '#5B21B6',
  
  // Tint color - Primary accent
  tint: '#60A5FA',
  
  // Shadow - Stronger for depth
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowStrong: 'rgba(0, 0, 0, 0.5)',
  
  // Tab bar - Dark and elegant
  tabBarBackground: '#1E293B',
  tabBarActive: '#60A5FA',
  tabBarInactive: '#64748B',
  tabBarBorder: '#334155',
  
  // Card and component colors
  card: '#1E293B',
  cardElevated: '#334155',
  input: '#1E293B',
  inputBorder: '#475569',
  inputFocus: '#60A5FA',
  
  // Overlay and modal
  overlay: 'rgba(0, 0, 0, 0.6)',
  modal: '#1E293B',
  
  // Chart colors
  chart1: '#60A5FA',
  chart2: '#34D399',
  chart3: '#FBBF24',
  chart4: '#F87171',
  chart5: '#A78BFA',
  chart6: '#22D3EE',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update dark mode based on theme mode and system preference
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for styled components
export const useThemedStyles = <T,>(
  styleFactory: (colors: typeof lightColors, isDarkMode: boolean) => T
): T => {
  const { colors, isDarkMode } = useTheme();
  return styleFactory(colors, isDarkMode);
};