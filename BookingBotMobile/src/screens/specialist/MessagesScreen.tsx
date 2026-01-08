// Messages Screen - Specialist messaging (matching web version)
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { messagingService, Conversation, Message } from '../../services/messaging.service';
import { Avatar } from '../../components/ui/Avatar';
import { format, isToday, isYesterday } from 'date-fns';

export const SpecialistMessagesScreen: React.FC = () => {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
      setNewMessage(messageText); // Restore message on error
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
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  const handleArchiveConversation = async (conversationId: string) => {
    Alert.alert(
      'Archive Conversation',
      'Are you sure you want to archive this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              // Archive logic here - would need API endpoint
              setConversations((prev) =>
                prev.filter((conv) => conv.id !== conversationId)
              );
              if (selectedConversation === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
              }
            } catch (error) {
              console.error('Failed to archive conversation:', error);
            }
          },
        },
      ]
    );
  };

  const handleBlockConversation = async (conversationId: string) => {
    Alert.alert(
      'Block Conversation',
      'Are you sure you want to block this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              // Block logic here - would need API endpoint
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === conversationId ? { ...conv, isBlocked: true } : conv
                )
              );
            } catch (error) {
              console.error('Failed to block conversation:', error);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    conversationsList: {
      flex: 1,
    },
    conversationItem: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    conversationContent: {
      flex: 1,
      marginLeft: 12,
    },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    conversationName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    conversationTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    conversationLastMessage: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    unreadBadge: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      marginLeft: 8,
    },
    unreadText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    searchContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    searchInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesList: {
      flex: 1,
    },
    messageBubble: {
      maxWidth: '75%',
      padding: 12,
      borderRadius: 16,
      marginVertical: 4,
      marginHorizontal: 16,
    },
    messageSent: {
      backgroundColor: colors.primary,
      alignSelf: 'flex-end',
    },
    messageReceived: {
      backgroundColor: colors.surface,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: 16,
      color: '#FFFFFF',
    },
    messageTextReceived: {
      color: colors.text,
    },
    messageTime: {
      fontSize: 11,
      marginTop: 4,
      opacity: 0.8,
    },
    messageTimeReceived: {
      color: colors.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      marginRight: 8,
      maxHeight: 100,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      padding: 8,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedConversation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Messages from customers will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => setSelectedConversation(item.id)}
              >
                <Avatar
                  src={item.participantAvatar}
                  alt={item.participantName}
                  size="md"
                />
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName} numberOfLines={1}>
                      {item.participantName}
                    </Text>
                    {item.lastMessage && (
                      <Text style={styles.conversationTime}>
                        {formatTime(item.lastMessage.createdAt)}
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.conversationLastMessage} numberOfLines={1}>
                      {item.lastMessage?.content || 'No messages yet'}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  const currentConversation = conversations.find((c) => c.id === selectedConversation);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        {/* Chat Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              onPress={() => setSelectedConversation(null)}
              style={{ marginRight: 12 }}
            >
              <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
            </TouchableOpacity>
            <Avatar
              src={currentConversation?.participantAvatar}
              alt={currentConversation?.participantName || ''}
              size="md"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.text,
                }}
              >
                {currentConversation?.participantName}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => handleArchiveConversation(selectedConversation)}
            >
              <Text style={{ fontSize: 20 }}>📦</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => handleBlockConversation(selectedConversation)}
            >
              <Text style={{ fontSize: 20 }}>🚫</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={({ item }) => {
            const isSent = item.senderId !== currentConversation?.participantId;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isSent ? styles.messageSent : styles.messageReceived,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    !isSent && styles.messageTextReceived,
                  ]}
                >
                  {item.content}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    !isSent && styles.messageTimeReceived,
                  ]}
                >
                  {formatMessageTime(item.createdAt)}
                </Text>
              </View>
            );
          }}
          ListFooterComponent={<View ref={messagesEndRef} />}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontSize: 20 }}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
