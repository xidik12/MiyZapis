/**
 * Card component - Enhanced with press animations
 * Matching web design, adapted for React Native with Panhaha design system
 */
import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  hapticFeedback?: boolean;
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
  hapticFeedback = false, // Disabled by default for cards (only important actions)
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(1)).current;

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

  const handlePressIn = () => {
    if (onPress && hover) {
      // Scale down animation
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();

      // Haptic feedback (only if enabled)
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (onPress && hover) {
      // Scale back animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  // If onPress is provided, make it pressable with animations
  if (onPress) {
    return (
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1} // We control the animation
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: getBackgroundColor(),
              borderRadius: BORDER_RADIUS.lg,
              ...getBorderStyles(),
              ...getElevationStyles(),
              transform: [{ scale: scaleAnim }],
            },
            gradient && styles.gradient,
            style,
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Non-pressable card
  return (
    <View
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
    >
      {children}
    </View>
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
