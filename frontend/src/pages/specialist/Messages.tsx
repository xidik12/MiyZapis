import React, { useState, useEffect, useRef } from 'react';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import { useLanguage } from '../../contexts/LanguageContext';
import { messagesService, Conversation, Message } from '../../services/messages.service';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  ArchiveBoxIcon,
  NoSymbolIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const SpecialistMessages: React.FC = () => {
  const { t } = useLanguage();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Load conversations from API
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await messagesService.getConversations();
        setConversations(response.conversations);
        
        // Select first conversation if available
        if (response.conversations.length > 0 && !selectedChat) {
          setSelectedChat(response.conversations[0].id);
        }
      } catch (err: any) {
        console.error('Error loading conversations:', err);
        setError(err.message || 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat) {
        setMessages([]);
        return;
      }

      try {
        setMessagesLoading(true);
        const response = await messagesService.getConversation(selectedChat);
        setMessages(response.messages);
        
        // Mark conversation as read
        await messagesService.markAsRead(selectedChat);
        
        // Update conversation unread count in local state
        setConversations(prev => prev.map(conv => 
          conv.id === selectedChat 
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
      } catch (err: any) {
        console.error('Error loading messages:', err);
        setError(err.message || 'Failed to load messages');
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await messagesService.sendMessage(selectedChat, {
        content: messageContent,
        messageType: 'TEXT'
      });

      // Add message to local state
      setMessages(prev => [...prev, sentMessage]);
      
      // Update conversation's last message
      setConversations(prev => prev.map(conv => 
        conv.id === selectedChat
          ? { 
              ...conv, 
              lastMessage: sentMessage,
              lastMessageAt: sentMessage.createdAt
            }
          : conv
      ));

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      // Restore message content on error
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await messagesService.archiveConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (selectedChat === conversationId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Error archiving conversation:', err);
      setError(err.message || 'Failed to archive conversation');
    }
  };

  const handleBlockConversation = async (conversationId: string) => {
    try {
      await messagesService.blockConversation(conversationId);
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId
          ? { ...conv, isBlocked: true }
          : conv
      ));
    } catch (err: any) {
      console.error('Error blocking conversation:', err);
      setError(err.message || 'Failed to block conversation');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const customerName = `${conv.customer.firstName} ${conv.customer.lastName}`;
    return customerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = conversations.find(c => c.id === selectedChat);
  const otherParticipant = selectedConversation?.customer;

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <FullScreenHandshakeLoader title={t('common.loading')} subtitle={t('dashboard.nav.messages')} />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.nav.messages')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('messages.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 h-[600px] flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('messages.searchConversations')}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {conversations.length === 0 ? t('messages.noConversations') : t('messages.noMatchingConversations')}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const customerName = `${conversation.customer.firstName} ${conversation.customer.lastName}`;
                const lastMessageTime = conversation.lastMessageAt ? formatConversationTime(conversation.lastMessageAt) : '';
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedChat(conversation.id)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedChat === conversation.id ? 'bg-primary-50 dark:bg-primary-900' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {conversation.customer.avatar ? (
                          <img 
                            src={conversation.customer.avatar} 
                            alt={customerName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {customerName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                        {conversation.isBlocked && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium truncate ${
                            conversation.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {customerName}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {lastMessageTime}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${
                          conversation.unreadCount > 0 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {conversation.lastMessage?.content || t('messages.noMessages')}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && otherParticipant ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {otherParticipant.avatar ? (
                      <img 
                        src={otherParticipant.avatar} 
                        alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {`${otherParticipant.firstName} ${otherParticipant.lastName}`.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedConversation.isBlocked ? t('messages.blocked') : t('messages.customer')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleArchiveConversation(selectedConversation.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={t('messages.archive')}
                  >
                    <ArchiveBoxIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleBlockConversation(selectedConversation.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={t('messages.block')}
                    disabled={selectedConversation.isBlocked}
                  >
                    <NoSymbolIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">{t('messages.noMessages')}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isFromSpecialist = message.senderId !== otherParticipant.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromSpecialist ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isFromSpecialist
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${
                              isFromSpecialist
                                ? 'text-blue-100 opacity-90'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatMessageTime(message.createdAt)}
                            </p>
                            {isFromSpecialist && message.readAt && (
                              <CheckIcon className="w-3 h-3 text-blue-100 opacity-90" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {!selectedConversation.isBlocked && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('messages.typeMessage')}
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {conversations.length === 0 ? t('messages.noConversations') : t('messages.selectConversation')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {conversations.length === 0 
                    ? t('messages.noConversationsDescription')
                    : t('messages.selectConversationDescription')
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecialistMessages;
