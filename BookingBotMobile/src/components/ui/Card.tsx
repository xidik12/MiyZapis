/**
 * Card component matching web design
 * Adapted for React Native with Panhaha design system
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, SHADOWS, ACCENT_COLORS } from '../../utils/design';

type BorderVariant = 'none' | 'subtle' | 'accent';
type Elevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  className?: string;
  hover?: boolean;
  glass?: boolean;
  gradient?: boolean;
  borderVariant?: BorderVariant;
  elevation?: Elevation;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  hover = true,
  glass = false,
  gradient = false,
  borderVariant = 'none',
  elevation = 'md',
  children,
  onPress,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const Component = onPress ? TouchableOpacity : View;

  // Get border styles based on variant
  const getBorderStyles = (): ViewStyle => {
    switch (borderVariant) {
      case 'subtle':
        return {
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'accent':
        return {
          borderWidth: 2,
          borderColor: ACCENT_COLORS[500], // Gold border
        };
      case 'none':
      default:
        return {
          borderWidth: 0,
        };
    }
  };

  // Get elevation/shadow styles
  const getElevationStyles = (): ViewStyle => {
    if (elevation === 'none') return {};
    return Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: SHADOWS[elevation].elevation / 2 },
        shadowOpacity: SHADOWS[elevation].shadowOpacity,
        shadowRadius: SHADOWS[elevation].elevation,
      },
      android: {
        elevation: SHADOWS[elevation].elevation,
      },
      default: SHADOWS[elevation],
    });
  };

  // Get background color
  const getBackgroundColor = (): string => {
    if (glass) {
      return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)';
    }
    return isDark ? colors.surface : colors.surface;
  };

  return (
    <Component
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: BORDER_RADIUS.lg,
          ...getBorderStyles(),
          ...getElevationStyles(),
        },
        gradient && styles.gradient,
        style,
      ]}
      onPress={onPress}
      activeOpacity={hover && onPress ? 0.7 : 1}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    overflow: 'hidden', // Important for borderRadius with children
  },
  gradient: {
    // Note: For true gradients, use expo-linear-gradient or react-native-linear-gradient
    // This is a placeholder that can be enhanced later
  },
});

export default Card;

