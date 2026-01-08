/**
 * Button component matching web design
 * Adapted for React Native
 */
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PRIMARY_COLORS, SECONDARY_COLORS, ACCENT_COLORS, ERROR_COLOR, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../utils/design';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent' | 'outline';
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
}) => {
  const { colors, isDark } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: PRIMARY_COLORS[500],
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50],
          borderWidth: 1,
          borderColor: isDark ? SECONDARY_COLORS[700] : SECONDARY_COLORS[200],
        };
      case 'accent':
        return {
          backgroundColor: ACCENT_COLORS[500],
        };
      case 'destructive':
        return {
          backgroundColor: ERROR_COLOR,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: PRIMARY_COLORS[500],
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
        return '#FFFFFF';
      case 'secondary':
        return isDark ? SECONDARY_COLORS[100] : SECONDARY_COLORS[900];
      case 'outline':
        return PRIMARY_COLORS[500];
      case 'ghost':
        return isDark ? SECONDARY_COLORS[300] : SECONDARY_COLORS[600];
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

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const textColor = getTextColor();
  const fontSize = getFontSize();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles,
        sizeStyles,
        {
          borderRadius: BORDER_RADIUS.lg,
          opacity: disabled || loading ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {leftIcon && <>{leftIcon}</>}
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize }, textStyle]}>
          {children}
        </Text>
      )}
      {rightIcon && <>{rightIcon}</>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
});

export default Button;

