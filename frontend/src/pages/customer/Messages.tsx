import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessagesService, Conversation, Message } from '@/services/messages.service';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { toast } from 'react-toastify';
import {
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  InboxIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, CheckCheckIcon } from 'lucide-react';

const CustomerMessages: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesService = new MessagesService();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const response = await messagesService.getConversationMessages(conversationId);
      setMessages(response.messages || []);
      
      // Mark messages as read
      await messagesService.markMessagesAsRead(conversationId);
      
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

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const specialistName = `${conv.specialist.firstName} ${conv.specialist.lastName}`;
      const businessName = conv.specialist.businessName || '';
      const lastMessage = conv.lastMessage?.content || '';
      
      return (
        specialistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    
    setFilteredConversations(filtered);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 flex">
      {/* Conversations Sidebar */}
      <div className={`${selectedConversation ? 'hidden lg:flex w-1/3' : 'w-full lg:w-1/3'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {t('customer.nav.messages')}
            </h1>
            {selectedConversation && (
              <button
                onClick={() => setSelectedConversation(null)}
                className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ←
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 h-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <InboxIcon className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start a conversation with a specialist by booking a service
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const specialist = conversation.specialist;
              const isSelected = selectedConversation?.id === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : ''
                  }`}
                >
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {specialist.avatar ? (
                        <img
                          src={getAbsoluteImageUrl(specialist.avatar)}
                          alt={`${specialist.firstName} ${specialist.lastName}`}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                            {specialist.firstName} {specialist.lastName}
                          </p>
                          {specialist.businessName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {specialist.businessName}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          {conversation.lastMessageAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          )}
                          {conversation.unreadCount > 0 && (
                            <span className="mt-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-xs font-medium text-white">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={`${selectedConversation ? 'flex w-full lg:flex-1' : 'hidden lg:flex lg:flex-1'} flex-col`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-1 -ml-1 mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ←
                  </button>
                  {selectedConversation.specialist.avatar ? (
                    <img
                      src={getAbsoluteImageUrl(selectedConversation.specialist.avatar)}
                      alt={`${selectedConversation.specialist.firstName} ${selectedConversation.specialist.lastName}`}
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                  )}
                  <div>
                    <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.specialist.firstName} {selectedConversation.specialist.lastName}
                    </h2>
                    {selectedConversation.specialist.businessName && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {selectedConversation.specialist.businessName}
                      </p>
                    )}
                  </div>
                </div>
                
                <button className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <EllipsisVerticalIcon className="h-4 h-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 sm:p-4">
              <div className="space-y-2 sm:space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId !== selectedConversation.specialist.id;
                  
                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                        isOwn 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}>
                        <p className="text-xs sm:text-sm break-words">{message.content}</p>
                        <div className={`flex items-center justify-between mt-1 ${
                          isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {new Date(message.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {isOwn && (
                            <div className="ml-2">
                              {message.readAt ? (
                                <CheckCheckIcon className="h-3 w-3" />
                              ) : (
                                <CheckIcon className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 sm:p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-1 sm:space-x-2">
                <button
                  type="button"
                  className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <PaperClipIcon className="h-4 h-4 sm:h-5 sm:w-5" />
                </button>
                
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                    disabled={sendingMessage}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="h-4 h-4 sm:h-5 sm:w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          // Empty state when no conversation is selected
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <ChatBubbleLeftEllipsisIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMessages;

