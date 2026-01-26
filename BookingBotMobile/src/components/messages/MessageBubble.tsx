/**
 * MessageBubble Component for React Native
 * Displays individual chat messages with read status
 * Based on web MessageBubble with Panhaha design system
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRIMARY_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
} from '../../utils/design';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    readAt?: string;
  };
  isOwnMessage: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
  senderName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = false,
  avatarUrl,
  senderName,
}) => {
  const { colors, isDark } = useTheme();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const senderInitial = senderName?.charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.container, isOwnMessage && styles.containerOwn]}>
      {/* Avatar for received messages */}
      {!isOwnMessage && (
        showAvatar ? (
          avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
              <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                {senderInitial}
              </Text>
            </View>
          )
        ) : (
          <View style={styles.avatarSpacer} />
        )
      )}

      {/* Message Bubble */}
      <View
        style={[
          styles.bubble,
          isOwnMessage
            ? [styles.bubbleOwn, { backgroundColor: PRIMARY_COLORS[500] }]
            : [
                styles.bubbleOther,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: colors.border,
                },
              ],
        ]}
      >
        {/* Message Content */}
        <Text
          style={[
            styles.content,
            { color: isOwnMessage ? '#FFFFFF' : colors.text },
          ]}
        >
          {message.content}
        </Text>

        {/* Time and Read Status */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.time,
              { color: isOwnMessage ? 'rgba(255, 255, 255, 0.8)' : colors.textSecondary },
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>

          {/* Read Status (for own messages) */}
          {isOwnMessage && (
            <Text
              style={[
                styles.checkmark,
                { color: message.readAt ? '#60A5FA' : 'rgba(255, 255, 255, 0.6)' },
              ]}
            >
              ✓✓
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  avatarSpacer: {
    width: 32,
  },
  bubble: {
    maxWidth: '70%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  bubbleOwn: {
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
  bubbleOther: {
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  content: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  time: {
    fontSize: FONT_SIZES.xs,
  },
  checkmark: {
    fontSize: 12,
  },
});

export default MessageBubble;
