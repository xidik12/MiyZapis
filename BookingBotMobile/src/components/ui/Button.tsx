/**
 * Button component - Enhanced with haptic feedback and animations
 * Matching web design, adapted for React Native with premium interactions
 */
import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { PRIMARY_COLORS, SECONDARY_COLORS, ACCENT_COLORS, ERROR_COLOR, SUCCESS_COLOR, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../utils/design';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent' | 'outline' | 'subtle' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hapticFeedback?: boolean; // Enable/disable haptic feedback
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  hapticFeedback = true, // Enabled by default
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        // Crimson Red - Energy, action, CTAs
        return {
          backgroundColor: colors.primary, // #DC2626
        };
      case 'secondary':
        // Deep Sea Blue - Trust, structure
        return {
          backgroundColor: colors.secondary, // #00739B
        };
      case 'subtle':
        // Subtle variant - Low emphasis background
        return {
          backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : SECONDARY_COLORS[50], // 20% opacity in dark mode
          borderWidth: 0,
        };
      case 'accent':
        // Gold - Borders, highlights (use sparingly)
        return {
          backgroundColor: ACCENT_COLORS[500],
        };
      case 'success':
        // Emerald Green - Success actions
        return {
          backgroundColor: SUCCESS_COLOR,
        };
      case 'destructive':
        // Crimson Red - Destructive actions
        return {
          backgroundColor: ERROR_COLOR,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {};
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'destructive':
      case 'accent':
      case 'success':
        return '#FFFFFF';
      case 'secondary':
        return '#FFFFFF'; // White text on Deep Sea Blue
      case 'subtle':
        return isDark ? SECONDARY_COLORS[200] : SECONDARY_COLORS[700];
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.text;
      default:
        return '#FFFFFF';
    }
  };

  const getSizeStyles = (): { paddingVertical: number; paddingHorizontal: number; minHeight: number } => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16, minHeight: 40 };
      case 'md':
        return { paddingVertical: 12, paddingHorizontal: 24, minHeight: 48 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32, minHeight: 56 };
      case 'xl':
        return { paddingVertical: 20, paddingHorizontal: 40, minHeight: 64 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24, minHeight: 48 };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return FONT_SIZES.sm;
      case 'md':
        return FONT_SIZES.base;
      case 'lg':
        return FONT_SIZES.lg;
      case 'xl':
        return FONT_SIZES.xl;
      default:
        return FONT_SIZES.base;
    }
  };

  const handlePressIn = () => {
    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

    // Haptic feedback
    if (hapticFeedback && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    // Scale back animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (onPress && !disabled && !loading) {
      onPress();
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const textColor = getTextColor();
  const fontSize = getFontSize();

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={1} // We control opacity through animation
    >
      <Animated.View
        style={[
          styles.button,
          variantStyles,
          sizeStyles,
          {
            borderRadius: BORDER_RADIUS.lg,
            opacity: disabled || loading ? 0.5 : 1,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text style={[styles.text, { color: textColor, fontSize }, textStyle]}>
            {children}
          </Text>
        )}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8, // mr-2 in web (8px)
    marginLeft: -4, // -ml-1 in web (tighten spacing)
  },
  rightIcon: {
    marginLeft: 8, // ml-2 in web (8px)
    marginRight: -4, // -mr-1 in web (tighten spacing)
  },
});

export default Button;
