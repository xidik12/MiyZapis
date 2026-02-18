import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { MagnifyingGlassIcon, InboxIcon } from '@/components/icons';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  userRole?: 'customer' | 'specialist';
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  title,
  emptyTitle,
  emptyDescription,
  userRole = 'customer'
}) => {
  const { t } = useLanguage();
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParty = (conversation: Conversation) => {
    if (userRole === 'customer') {
      return {
        name: `${conversation.specialist?.firstName} ${conversation.specialist?.lastName}`,
        subtitle: conversation.specialist?.businessName,
        avatar: conversation.specialist?.avatar
      };
    } else {
      return {
        name: `${conversation.customer?.firstName} ${conversation.customer?.lastName}`,
        subtitle: 'Customer',
        avatar: conversation.customer?.avatar
      };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('messages.searchConversations')}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl border border-transparent focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <InboxIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {emptyTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {emptyDescription}
              </p>
            </motion.div>
          </div>
        ) : (
          <div>
            {conversations.map((conversation, index) => {
              const otherParty = getOtherParty(conversation);
              const isSelected = selectedConversationId === conversation.id;
              const hasUnread = conversation.unreadCount > 0;

              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {otherParty.avatar ? (
                        <img
                          src={getAbsoluteImageUrl(otherParty.avatar)}
                          alt={otherParty.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                          {otherParty.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Online indicator (placeholder) */}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-semibold truncate ${
                          hasUnread
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {otherParty.name}
                        </h3>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      {otherParty.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                          {otherParty.subtitle}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          hasUnread
                            ? 'text-gray-900 dark:text-white font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {conversation.lastMessage?.content || t('messages.noConversations')}
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
