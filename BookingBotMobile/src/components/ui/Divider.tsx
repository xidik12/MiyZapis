/**
 * Divider component for visual separation
 * Supports horizontal/vertical orientation with optional text
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { FONT_SIZES, FONT_WEIGHTS, SPACING } from '../../utils/design';

type Orientation = 'horizontal' | 'vertical';
type Variant = 'solid' | 'dashed' | 'dotted';

interface DividerProps {
  orientation?: Orientation;
  variant?: Variant;
  text?: string;
  textPosition?: 'left' | 'center' | 'right';
  thickness?: number;
  spacing?: number; // Margin around the divider
  color?: string; // Custom color override
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  text,
  textPosition = 'center',
  thickness = 1,
  spacing = SPACING.md,
  color,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const dividerColor = color || colors.border;

  // For dashed/dotted, we use borderStyle
  const getBorderStyle = () => {
    if (variant === 'dashed') return 'dashed';
    if (variant === 'dotted') return 'dotted';
    return 'solid';
  };

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.verticalContainer,
          {
            marginHorizontal: spacing,
            borderLeftWidth: thickness,
            borderLeftColor: dividerColor,
            borderStyle: getBorderStyle(),
          },
          style,
        ]}
      />
    );
  }

  // Horizontal divider
  if (!text) {
    return (
      <View
        style={[
          styles.horizontalContainer,
          {
            marginVertical: spacing,
            borderBottomWidth: thickness,
            borderBottomColor: dividerColor,
            borderStyle: getBorderStyle(),
          },
          style,
        ]}
      />
    );
  }

  // Horizontal divider with text
  const getTextContainerStyle = (): ViewStyle => {
    switch (textPosition) {
      case 'left':
        return { justifyContent: 'flex-start' };
      case 'right':
        return { justifyContent: 'flex-end' };
      case 'center':
      default:
        return { justifyContent: 'center' };
    }
  };

  return (
    <View style={[styles.withTextContainer, { marginVertical: spacing }, style]}>
      <View
        style={[
          styles.line,
          {
            borderBottomWidth: thickness,
            borderBottomColor: dividerColor,
            borderStyle: getBorderStyle(),
          },
          textPosition === 'left' && { flex: 0.2 },
          textPosition === 'right' && { flex: 1 },
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: colors.textSecondary },
          textStyle,
        ]}
      >
        {text}
      </Text>
      <View
        style={[
          styles.line,
          {
            borderBottomWidth: thickness,
            borderBottomColor: dividerColor,
            borderStyle: getBorderStyle(),
          },
          textPosition === 'left' && { flex: 1 },
          textPosition === 'right' && { flex: 0.2 },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    width: '100%',
  },
  verticalContainer: {
    height: '100%',
    width: 1,
  },
  withTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    paddingHorizontal: SPACING.md,
  },
});

export default Divider;
