/**
 * LoadingSpinner component matching web design
 * Adapted for React Native
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PRIMARY_COLORS, SECONDARY_COLORS, NEUTRAL_COLORS } from '../../utils/design';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  style?: ViewStyle;
}

const sizeMap = {
  sm: 'small' as const,
  md: 'small' as const,
  lg: 'large' as const,
  xl: 'large' as const,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  style,
}) => {
  const { colors, isDark } = useTheme();

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return PRIMARY_COLORS[600];
      case 'secondary':
        return SECONDARY_COLORS[600];
      case 'white':
        return '#FFFFFF';
      case 'gray':
        return isDark ? NEUTRAL_COLORS[300] : NEUTRAL_COLORS[600];
      default:
        return PRIMARY_COLORS[600];
    }
  };

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={sizeMap[size]} color={getColor()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;

