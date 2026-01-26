/**
 * EmptyState component for no data / empty list scenarios
 * Displays icon, title, description, and optional action button
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { FONT_SIZES, FONT_WEIGHTS, SPACING, TYPOGRAPHY } from '../../utils/design';
import { Button } from './Button';

type Variant = 'default' | 'search' | 'error' | 'success' | 'info';

interface EmptyStateProps {
  variant?: Variant;
  icon?: React.ReactNode;
  emoji?: string; // Simple emoji fallback if no icon provided
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  style?: ViewStyle;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  style,
  titleStyle,
  descriptionStyle,
}) => {
  const { colors, isDark } = useTheme();

  // Default emojis for each variant if no icon/emoji provided
  const getDefaultEmoji = () => {
    switch (variant) {
      case 'search':
        return '🔍';
      case 'error':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '📭';
    }
  };

  const displayEmoji = emoji || getDefaultEmoji();

  return (
    <View style={[styles.container, style]}>
      {/* Icon or Emoji */}
      {icon ? (
        <View style={styles.iconContainer}>{icon}</View>
      ) : (
        <Text style={styles.emoji}>{displayEmoji}</Text>
      )}

      {/* Title */}
      <Text
        style={[
          styles.title,
          { color: colors.text },
          titleStyle,
        ]}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={[
            styles.description,
            { color: colors.textSecondary },
            descriptionStyle,
          ]}
        >
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            variant={actionVariant}
            size="md"
            onPress={onAction}
          >
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
  },
  iconContainer: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    lineHeight: TYPOGRAPHY.h3.lineHeight,
    fontWeight: TYPOGRAPHY.h3.fontWeight,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.body.fontSize,
    lineHeight: TYPOGRAPHY.body.lineHeight,
    fontWeight: TYPOGRAPHY.body.fontWeight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 320, // Limit line length for readability
  },
  actionContainer: {
    marginTop: SPACING.md,
    width: '100%',
    maxWidth: 280,
  },
});

export default EmptyState;
