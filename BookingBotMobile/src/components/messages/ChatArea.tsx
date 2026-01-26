/**
 * ChatArea Component for React Native
 * Container for displaying conversation messages with auto-scroll
 * Based on web ChatArea with Panhaha design system
 */
import React, { useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../../utils/design';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from '../ui/EmptyState';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readAt?: string;
}

interface ChatAreaProps {
  messages: Message[];
  currentUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  loading?: boolean;
  onLoadMore?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentUserId,
  otherUserName,
  otherUserAvatar,
  loading = false,
  onLoadMore,
}) => {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isOwnMessage && (!previousMessage || previousMessage.senderId !== item.senderId);

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        avatarUrl={!isOwnMessage ? otherUserAvatar : undefined}
        senderName={!isOwnMessage ? otherUserName : undefined}
      />
    );
  };

  const renderDateSeparator = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label = '';
    if (messageDate.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }

    return (
      <View style={styles.dateSeparator}>
        <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dateSeparatorText, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border }]} />
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const currentDate = new Date(item.createdAt).toDateString();
    const previousDate = previousMessage ? new Date(previousMessage.createdAt).toDateString() : null;
    const showDateSeparator = currentDate !== previousDate;

    return (
      <View>
        {showDateSeparator && renderDateSeparator(item.createdAt)}
        {renderMessage({ item, index })}
      </View>
    );
  };

  if (messages.length === 0 && !loading) {
    return (
      <EmptyState
        emoji="💬"
        title="No messages yet"
        description="Start the conversation by sending a message"
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: SPACING.md,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ChatArea;
