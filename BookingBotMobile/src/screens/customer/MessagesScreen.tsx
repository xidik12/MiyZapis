/**
 * MessagesScreen - Redesigned with Panhaha design system
 * Customer messaging with conversation list and chat interface
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { messagingService, Conversation, Message } from '../../services/messaging.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';
import { format, isToday, isYesterday } from 'date-fns';

export const CustomerMessagesScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const messagesEndRef = useRef<View>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const conversations = await messagingService.getConversations();
      setConversations(conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await messagingService.getMessages(conversationId);
      setMessages(response.messages || []);
      await messagingService.markAsRead(conversationId);

      // Update conversation unread count
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await messagingService.sendMessage(
        selectedConversation,
        messageText
      );
      setMessages((prev) => [...prev, sentMessage]);

      // Update conversation's last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation
            ? {
                ...conv,
                lastMessage: {
                  content: sentMessage.content,
                  createdAt: sentMessage.createdAt,
                  isRead: false,
                },
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conv) => {
      const name = (conv.participantName || '').toLowerCase();
      const lastMessage = conv.lastMessage?.content.toLowerCase() || '';
      return name.includes(query) || lastMessage.includes(query);
    });

    setFilteredConversations(filtered);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.setNativeProps({});
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return t('messages.yesterday');
    } else {
      return format(date, 'MMM d');
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[SECONDARY_COLORS[500], SECONDARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: ACCENT_COLORS[500] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>💬</Text>
          <Text style={styles.heroTitle}>{t('messages.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('messages.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <Card style={styles.conversationCard} borderVariant="subtle" elevation="sm">
      <TouchableOpacity
        style={styles.conversationContent}
        onPress={() => setSelectedConversation(item.id)}
      >
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50] },
          ]}
        >
          <Text style={[styles.avatarText, { color: SECONDARY_COLORS[500] }]}>
            {item.participantName?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
              {item.participantName || t('messages.unknown')}
            </Text>
            {item.lastMessage && (
              <Text style={[styles.conversationTime, { color: colors.textSecondary }]}>
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <View style={styles.conversationFooter}>
            <Text
              style={[
                styles.conversationLastMessage,
                { color: colors.textSecondary },
                item.unreadCount > 0 && { fontWeight: FONT_WEIGHTS.semibold },
              ]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || t('messages.noMessages')}
            </Text>
            {item.unreadCount > 0 && (
              <Badge
                label={item.unreadCount.toString()}
                variant="primary"
                size="sm"
                style={styles.unreadBadge}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={[
          styles.searchInput,
          { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
        ]}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('messages.searchPlaceholder')}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );

  const renderChatHeader = () => {
    const currentConversation = conversations.find((c) => c.id === selectedConversation);

    return (
      <View style={[styles.chatHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setSelectedConversation(null)}
          style={styles.backButton}
        >
          <Text style={[styles.backIcon, { color: SECONDARY_COLORS[500] }]}>←</Text>
        </TouchableOpacity>
        <View
          style={[
            styles.chatAvatar,
            { backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50] },
          ]}
        >
          <Text style={[styles.chatAvatarText, { color: SECONDARY_COLORS[500] }]}>
            {currentConversation?.participantName?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.chatHeaderInfo}>
          <Text style={[styles.chatHeaderName, { color: colors.text }]}>
            {currentConversation?.participantName || t('messages.unknown')}
          </Text>
        </View>
      </View>
    );
  };

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const currentConversation = conversations.find((c) => c.id === selectedConversation);
    const isSent = item.senderId !== currentConversation?.participantId;

    return (
      <View style={[styles.messageBubble, isSent ? styles.messageSent : styles.messageReceived]}>
        <View
          style={[
            styles.messageBubbleContent,
            isSent
              ? { backgroundColor: SECONDARY_COLORS[500] }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isSent ? '#FFFFFF' : colors.text },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isSent ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderMessageInput = () => (
    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder={t('messages.typePlaceholder')}
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={1000}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: SECONDARY_COLORS[500] },
          (!newMessage.trim() || sending) && styles.sendButtonDisabled,
        ]}
        onPress={handleSendMessage}
        disabled={!newMessage.trim() || sending}
      >
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <View style={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={50} style={{ marginBottom: SPACING.lg }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height={80}
              style={{ marginBottom: SPACING.md }}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // Chat view
  if (selectedConversation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={90}
        >
          {renderChatHeader()}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            renderItem={renderMessageBubble}
            ListFooterComponent={<View ref={messagesEndRef} />}
          />
          {renderMessageInput()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Conversation list view
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <View style={styles.scrollView}>
        {renderSearchBar()}
        {filteredConversations.length === 0 ? (
          <EmptyState
            emoji="💬"
            title={searchQuery ? t('messages.noResults') : t('messages.noConversations')}
            description={
              searchQuery ? t('messages.noResultsDesc') : t('messages.noConversationsDesc')
            }
          />
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.conversationsList}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={SECONDARY_COLORS[500]}
                colors={[SECONDARY_COLORS[500]]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 160,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  decorativeOrbs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 140,
    height: 140,
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  orb2: {
    width: 110,
    height: 110,
    bottom: -20,
    left: -20,
    opacity: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  searchContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  searchInput: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.base,
    borderWidth: 1,
  },
  conversationsList: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  conversationCard: {
    padding: SPACING.md,
  },
  conversationContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
  },
  conversationInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
  },
  conversationTime: {
    fontSize: FONT_SIZES.xs,
    marginLeft: SPACING.sm,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationLastMessage: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  unreadBadge: {
    marginLeft: SPACING.sm,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarText: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.bold,
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  chatHeaderName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  messageBubble: {
    marginVertical: SPACING.xs,
  },
  messageSent: {
    alignItems: 'flex-end',
  },
  messageReceived: {
    alignItems: 'flex-start',
  },
  messageBubbleContent: {
    maxWidth: '75%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  messageText: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.xs,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.base,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
