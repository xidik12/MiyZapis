import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    name: string;
  }>;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export const MessagingPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { webApp } = useTelegramWebApp();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participantId: '2',
          participantName: 'Dr. Elena Melnik',
          lastMessage: 'Thank you for the session today!',
          lastMessageTime: '2025-08-18T10:30:00Z',
          unreadCount: 0,
          isOnline: true
        },
        {
          id: '2',
          participantId: '3',
          participantName: 'Maxim K.',
          lastMessage: 'Can we reschedule tomorrow\'s appointment?',
          lastMessageTime: '2025-08-18T09:15:00Z',
          unreadCount: 2,
          isOnline: false
        },
        {
          id: '3',
          participantId: '4',
          participantName: 'Anna S.',
          lastMessage: 'Perfect, see you then!',
          lastMessageTime: '2025-08-17T16:45:00Z',
          unreadCount: 0,
          isOnline: true
        }
      ];

      setConversations(mockConversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      webApp?.showAlert('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Mock data - replace with actual API call
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: '2',
          senderName: 'Dr. Elena Melnik',
          content: 'Hello! I hope you\'re doing well. Just wanted to follow up on our last session.',
          timestamp: '2025-08-18T10:00:00Z',
          isRead: true
        },
        {
          id: '2',
          senderId: user?.id || '1',
          senderName: user?.firstName || 'You',
          content: 'Hi Dr. Elena! Yes, I\'ve been practicing the techniques we discussed.',
          timestamp: '2025-08-18T10:15:00Z',
          isRead: true
        },
        {
          id: '3',
          senderId: '2',
          senderName: 'Dr. Elena Melnik',
          content: 'That\'s wonderful to hear! Keep up the great work.',
          timestamp: '2025-08-18T10:30:00Z',
          isRead: true
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      webApp?.showAlert('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);

      const message: Message = {
        id: Date.now().toString(),
        senderId: user?.id || '1',
        senderName: user?.firstName || 'You',
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isRead: false
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Update conversation last message
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: message.content, lastMessageTime: message.timestamp }
          : conv
      ));

      // Here you would send to API
      // await apiService.sendMessage(selectedConversation, newMessage);

    } catch (error) {
      console.error('Failed to send message:', error);
      webApp?.showAlert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Conversations List */}
      <div className="w-full max-w-sm border-r border-white/5 bg-bg-secondary">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-text-primary">Messages</h2>
        </div>

        <div className="overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 border-b border-white/5 cursor-pointer hover:bg-bg-hover transition-colors ${
                selectedConversation === conversation.id ? 'bg-accent-primary/20' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {conversation.participantName.charAt(0)}
                    </span>
                  </div>
                  {conversation.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-green rounded-full border-2 border-bg-secondary"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-text-primary truncate">
                      {conversation.participantName}
                    </h3>
                    <span className="text-xs text-text-secondary">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs bg-accent-primary text-white rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <div className="p-4 border-b border-white/5 bg-bg-secondary">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {conversations.find(c => c.id === selectedConversation)?.participantName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">
                    {conversations.find(c => c.id === selectedConversation)?.participantName}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {conversations.find(c => c.id === selectedConversation)?.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-accent-primary text-white rounded-br-sm'
                          : 'bg-bg-secondary text-text-primary rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-white/70' : 'text-text-secondary'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/5 bg-bg-secondary">
              <div className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-6"
                >
                  {sending ? '...' : 'Send'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Select a conversation
              </h3>
              <p className="text-text-secondary">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
