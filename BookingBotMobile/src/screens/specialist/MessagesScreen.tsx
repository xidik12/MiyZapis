/**
 * SpecialistMessagesScreen - Redesigned with Panhaha design system
 * Messaging interface with archive and block functionality
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { messagingService } from '../../services/messaging.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  SECONDARY_COLORS,
  PRIMARY_COLORS,
  ACCENT_COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  isBlocked?: boolean;
}

export const SpecialistMessagesScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const messagesEndRef = useRef<View>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await messagingService.getConversations();
      setConversations(result);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const result = await messagingService.getMessages(conversationId);
      setMessages(result);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await messagingService.markAsRead(conversationId);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await messagingService.sendMessage(selectedConversation, messageText);
      setMessages((prev) => [...prev, sentMessage]);

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation ? { ...conv, lastMessage: sentMessage } : conv
        )
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    Alert.alert(
      t('messages.archiveConversation'),
      t('messages.archiveConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('messages.archive'),
          style: 'destructive',
          onPress: async () => {
            try {
              await messagingService.archiveConversation(conversationId);
              setConversations((prev) =>
                prev.filter((conv) => conv.id !== conversationId)
              );
              if (selectedConversation === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
              }
            } catch (error) {
              console.error('Failed to archive conversation:', error);
              Alert.alert(t('common.error'), t('messages.archiveFailed'));
            }
          },
        },
      ]
    );
  };

  const handleBlockConversation = async (conversationId: string) => {
    Alert.alert(
      t('messages.blockConversation'),
      t('messages.blockConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('messages.block'),
          style: 'destructive',
          onPress: async () => {
            try {
              await messagingService.blockConversation(conversationId);
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === conversationId ? { ...conv, isBlocked: true } : conv
                )
              );
              if (selectedConversation === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
              }
            } catch (error) {
              console.error('Failed to block conversation:', error);
              Alert.alert(t('common.error'), t('messages.blockFailed'));
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = (conv.participantName || '').toLowerCase();
    const lastMsg = (conv.lastMessage?.content || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || lastMsg.includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return t('common.yesterday');
    } else {
      return format(date, 'MMM d');
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `${t('common.yesterday')} ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
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
          <Text style={styles.heroSubtitle}>{t('messages.specialistSubtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={[
          styles.searchInput,
          { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
        ]}
        placeholder={t('messages.searchPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <Card style={styles.conversationCard} borderVariant="subtle" elevation="sm">
      <TouchableOpacity
        style={styles.conversationContent}
        onPress={() => setSelectedConversation(item.id)}
      >
        {/* Avatar */}
        {item.participantAvatar ? (
          <View style={styles.avatar}>
            {/* Avatar image would go here */}
            <Text style={[styles.avatarText, { color: SECONDARY_COLORS[500] }]}>
              {item.participantName?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50] },
            ]}
          >
            <Text style={[styles.avatarText, { color: SECONDARY_COLORS[500] }]}>
              {item.participantName?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        {/* Conversation Info */}
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
          {item.isBlocked && (
            <Badge label={t('messages.blocked')} variant="error" size="sm" style={{ marginTop: SPACING.xs }} />
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderChatHeader = () => {
    const currentConversation = conversations.find((c) => c.id === selectedConversation);

    return (
      <View style={[styles.chatHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.chatHeaderLeft}>
          <TouchableOpacity
            onPress={() => {
              setSelectedConversation(null);
              setMessages([]);
            }}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, { color: SECONDARY_COLORS[500] }]}>←</Text>
          </TouchableOpacity>

          {/* Avatar */}
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

          <Text style={[styles.chatHeaderName, { color: colors.text }]} numberOfLines={1}>
            {currentConversation?.participantName || t('messages.unknown')}
          </Text>
        </View>

        {/* Archive and Block buttons */}
        <View style={styles.chatHeaderActions}>
          <TouchableOpacity
            style={styles.chatHeaderButton}
            onPress={() => selectedConversation && handleArchiveConversation(selectedConversation)}
          >
            <Text style={styles.chatHeaderButtonEmoji}>📦</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatHeaderButton}
            onPress={() => selectedConversation && handleBlockConversation(selectedConversation)}
          >
            <Text style={styles.chatHeaderButtonEmoji}>🚫</Text>
          </TouchableOpacity>
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
    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
        placeholder={t('messages.typePlaceholder')}
        placeholderTextColor={colors.textSecondary}
        value={newMessage}
        onChangeText={setNewMessage}
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
        {sending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.sendButtonText}>➤</Text>
        )}
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
              height={90}
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
            renderItem={renderMessageBubble}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
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
            description={searchQuery ? t('messages.noResultsDesc') : t('messages.noConversationsDesc')}
          />
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.conversationsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={SECONDARY_COLORS[500]}
                colors={[SECONDARY_COLORS[500]]}
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
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
  avatarPlaceholder: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  chatAvatarText: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.bold,
  },
  chatHeaderName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chatHeaderButton: {
    padding: SPACING.sm,
  },
  chatHeaderButtonEmoji: {
    fontSize: 20,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: SPACING.md,
  },
  messageBubble: {
    marginVertical: 4,
    marginHorizontal: SPACING.md,
  },
  messageSent: {
    alignItems: 'flex-end',
  },
  messageReceived: {
    alignItems: 'flex-start',
  },
  messageBubbleContent: {
    maxWidth: '75%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.base,
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
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
