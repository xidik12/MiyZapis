/**
 * Card component matching web design
 * Adapted for React Native
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, SHADOWS } from '../../utils/design';

interface CardProps {
  className?: string;
  hover?: boolean;
  glass?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  hover = true,
  glass = true,
  children,
  onPress,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.card,
        {
          backgroundColor: glass
            ? isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.6)'
            : isDark
            ? colors.surface
            : '#FFFFFF',
          borderWidth: glass ? 1 : 0,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
          borderRadius: BORDER_RADIUS['2xl'],
          ...SHADOWS.lg,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={hover && onPress ? 0.8 : 1}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
  },
});

export default Card;

