/**
 * Input component matching web design
 * Adapted for React Native with mobile optimizations
 * - Minimum 44px height for iOS touch targets
 * - Minimum 16px font to prevent iOS auto-zoom
 * - Success/error states with visual feedback
 * - Shake animation on error
 * - Focus state highlighting
 */
import React, { useRef, useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, ERROR_COLOR, SUCCESS_COLOR } from '../../utils/design';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: string; // Success message
  hint?: string;
  rightSlot?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  showSuccessIcon?: boolean; // Show checkmark on success
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  hint,
  rightSlot,
  leftIcon,
  containerStyle,
  inputStyle,
  style,
  showSuccessIcon = true,
  disabled = false,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Shake animation on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const getBorderColor = () => {
    if (error) return ERROR_COLOR;
    if (success) return SUCCESS_COLOR;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  const getBackgroundColor = () => {
    if (disabled) return isDark ? colors.surface + '80' : colors.border + '40';
    return colors.surface;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          { transform: [{ translateX: shakeAnimation }] }
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: getBackgroundColor(),
              color: colors.text,
              borderColor: getBorderColor(),
              borderWidth: isFocused ? 2 : 1,
              paddingLeft: leftIcon ? 44 : 16,
              paddingRight: (rightSlot || (success && showSuccessIcon)) ? 44 : 16,
              opacity: disabled ? 0.6 : 1,
            },
            inputStyle,
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          editable={!disabled}
          {...props}
        />
        {success && showSuccessIcon && !rightSlot && (
          <View style={styles.rightSlot}>
            <View style={[styles.successIcon, { backgroundColor: SUCCESS_COLOR }]}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>
        )}
        {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
      </Animated.View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : success ? (
        <Text style={[styles.success, { color: SUCCESS_COLOR }]}>{success}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    minHeight: 48, // iOS touch target minimum (actually 44px, but 48px is more comfortable)
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    fontSize: FONT_SIZES.base, // 16px minimum prevents iOS auto-zoom
    fontWeight: FONT_WEIGHTS.normal,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rightSlot: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.bold,
  },
  error: {
    marginTop: 4,
    fontSize: FONT_SIZES.xs,
    color: ERROR_COLOR,
    fontWeight: FONT_WEIGHTS.medium,
  },
  success: {
    marginTop: 4,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  hint: {
    marginTop: 4,
    fontSize: FONT_SIZES.xs,
  },
});

export default Input;

