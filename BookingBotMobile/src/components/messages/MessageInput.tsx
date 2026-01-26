/**
 * MessageInput Component for React Native
 * Input field for typing and sending messages
 * Based on web MessageInput with Panhaha design system
 */
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
} from '../../utils/design';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const { colors, isDark } = useTheme();

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        {/* Attachment Button (Optional - can be implemented later) */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? colors.surface : colors.border }]}
          disabled={disabled}
        >
          <Text style={styles.iconText}>📎</Text>
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          editable={!disabled}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        {/* Emoji Button (Optional - can be implemented later) */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? colors.surface : colors.border }]}
          disabled={disabled}
        >
          <Text style={styles.iconText}>😊</Text>
        </TouchableOpacity>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? PRIMARY_COLORS[500] : colors.border,
              opacity: canSend ? 1 : 0.5,
            },
          ]}
          onPress={handleSubmit}
          disabled={!canSend}
        >
          <Text style={styles.sendIcon}>✈️</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm + 2 : SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
  },
});

export default MessageInput;
