import React, { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';
import { MessagesService } from '@/services/messages.service';
import { toast } from 'react-toastify';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  readAt?: string;
}

interface Conversation {
  id: string;
  specialist?: {
    firstName: string;
    lastName: string;
    avatar?: string;
    businessName?: string;
  };
  customer?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  lastMessageAt?: string;
  unreadCount: number;
}

interface MessageInterfaceProps {
  currentUserId: string;
  userRole: 'customer' | 'specialist';
  title: string;
  emptyTitle: string;
  emptyDescription: string;
}

export const MessageInterface: React.FC<MessageInterfaceProps> = ({
  currentUserId,
  userRole,
  title,
  emptyTitle,
  emptyDescription
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesService = new MessagesService();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesService.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const response = await messagesService.getConversation(conversationId);
      setMessages(response.messages || []);

      // Mark messages as read
      await messagesService.markAsRead(conversationId);

      // Update conversation unread count
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const sentMessage = await messagesService.sendMessage(
        selectedConversation.id,
        messageText
      );

      setMessages(prev => [...prev, sentMessage]);

      // Update conversation's last message
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              lastMessage: sentMessage,
              lastMessageAt: sentMessage.createdAt
            }
          : conv
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message
    } finally {
      setSendingMessage(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv => {
      if (userRole === 'customer') {
        const specialistName = `${conv.specialist?.firstName} ${conv.specialist?.lastName}`;
        const businessName = conv.specialist?.businessName || '';
        const lastMessage = conv.lastMessage?.content || '';
        return (
          specialistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
        );
      } else {
        const customerName = `${conv.customer?.firstName} ${conv.customer?.lastName}`;
        const lastMessage = conv.lastMessage?.content || '';
        return (
          customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    });

    setFilteredConversations(filtered);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-gray-50 dark:bg-gray-900">
      {/* Conversation List - Hidden on mobile when chat is selected */}
      <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full lg:w-96 flex-shrink-0`}>
        <ConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          title={title}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          userRole={userRole}
        />
      </div>

      {/* Chat Area - Hidden on mobile when no conversation is selected */}
      <div className={`${!selectedConversation ? 'hidden lg:flex' : 'flex'} flex-1`}>
        <ChatArea
          conversation={selectedConversation}
          messages={messages}
          currentUserId={currentUserId}
          newMessage={newMessage}
          onNewMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          onBack={() => setSelectedConversation(null)}
          isTyping={isTyping}
          userRole={userRole}
        />
      </div>
    </div>
  );
};
