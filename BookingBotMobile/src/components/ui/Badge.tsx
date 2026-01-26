/**
 * Badge component for status indicators
 * Panhaha design system
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  ERROR_COLOR,
  WARNING_COLOR,
  NEUTRAL_COLORS,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type Size = 'sm' | 'md' | 'lg';
type Style = 'solid' | 'outline' | 'soft';

interface BadgeProps {
  variant?: Variant;
  size?: Size;
  styleType?: Style;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  styleType = 'solid',
  children,
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();

  const getVariantColors = (): { backgroundColor: string; textColor: string; borderColor?: string } => {
    const variantMap = {
      primary: {
        solid: { backgroundColor: PRIMARY_COLORS[500], textColor: '#FFFFFF' },
        outline: { backgroundColor: 'transparent', textColor: PRIMARY_COLORS[500], borderColor: PRIMARY_COLORS[500] },
        soft: { backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : PRIMARY_COLORS[50], textColor: PRIMARY_COLORS[600] },
      },
      secondary: {
        solid: { backgroundColor: SECONDARY_COLORS[500], textColor: '#FFFFFF' },
        outline: { backgroundColor: 'transparent', textColor: SECONDARY_COLORS[500], borderColor: SECONDARY_COLORS[500] },
        soft: { backgroundColor: isDark ? SECONDARY_COLORS[900] + '33' : SECONDARY_COLORS[50], textColor: SECONDARY_COLORS[600] },
      },
      success: {
        solid: { backgroundColor: SUCCESS_COLOR, textColor: '#FFFFFF' },
        outline: { backgroundColor: 'transparent', textColor: SUCCESS_COLOR, borderColor: SUCCESS_COLOR },
        soft: { backgroundColor: isDark ? '#10B98133' : '#D1FAE5', textColor: '#065F46' },
      },
      warning: {
        solid: { backgroundColor: WARNING_COLOR, textColor: '#FFFFFF' },
        outline: { backgroundColor: 'transparent', textColor: WARNING_COLOR, borderColor: WARNING_COLOR },
        soft: { backgroundColor: isDark ? '#F59E0B33' : '#FEF3C7', textColor: '#92400E' },
      },
      error: {
        solid: { backgroundColor: ERROR_COLOR, textColor: '#FFFFFF' },
        outline: { backgroundColor: 'transparent', textColor: ERROR_COLOR, borderColor: ERROR_COLOR },
        soft: { backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : PRIMARY_COLORS[50], textColor: PRIMARY_COLORS[600] },
      },
      info: {
        solid: { backgroundColor: SECONDARY_COLORS[500], textColor: '#FFFFFF' },
        outline: { backgroundColor: 'transparent', textColor: SECONDARY_COLORS[500], borderColor: SECONDARY_COLORS[500] },
        soft: { backgroundColor: isDark ? SECONDARY_COLORS[900] + '33' : SECONDARY_COLORS[50], textColor: SECONDARY_COLORS[600] },
      },
      neutral: {
        solid: { backgroundColor: NEUTRAL_COLORS[500], textColor: '#FFFFFF' },
        outline: { backgroundColor: 'transparent', textColor: NEUTRAL_COLORS[600], borderColor: NEUTRAL_COLORS[400] },
        soft: { backgroundColor: isDark ? NEUTRAL_COLORS[800] : NEUTRAL_COLORS[100], textColor: NEUTRAL_COLORS[700] },
      },
    };

    return variantMap[variant][styleType];
  };

  const getSizeStyles = (): { paddingVertical: number; paddingHorizontal: number; fontSize: number } => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 2, paddingHorizontal: 8, fontSize: FONT_SIZES.xs };
      case 'md':
        return { paddingVertical: 4, paddingHorizontal: 12, fontSize: FONT_SIZES.sm };
      case 'lg':
        return { paddingVertical: 6, paddingHorizontal: 16, fontSize: FONT_SIZES.base };
      default:
        return { paddingVertical: 4, paddingHorizontal: 12, fontSize: FONT_SIZES.sm };
    }
  };

  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantColors.backgroundColor,
          borderWidth: styleType === 'outline' ? 1 : 0,
          borderColor: variantColors.borderColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: BORDER_RADIUS.full,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantColors.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
});

export default Badge;
