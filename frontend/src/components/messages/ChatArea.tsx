import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { ArrowLeftIcon, PhoneIcon, VideoCameraIcon, EllipsisVerticalIcon } from '@/components/icons';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { useLanguage } from '@/contexts/LanguageContext';

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
}

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onBack?: () => void;
  isTyping?: boolean;
  userRole?: 'customer' | 'specialist';
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  currentUserId,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onBack,
  isTyping = false,
  userRole = 'customer'
}) => {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return t('messages.today');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  const shouldShowDateDivider = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    return currentDate !== previousDate;
  };

  const shouldShowAvatar = (currentMessage: Message, nextMessage?: Message) => {
    if (!nextMessage) return true;
    if (currentMessage.senderId !== nextMessage.senderId) return true;
    const timeDiff = new Date(nextMessage.createdAt).getTime() - new Date(currentMessage.createdAt).getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutes
  };

  const getOtherParty = () => {
    if (!conversation) return null;
    if (userRole === 'customer') {
      return {
        name: `${conversation.specialist?.firstName} ${conversation.specialist?.lastName}`,
        subtitle: conversation.specialist?.businessName || 'Specialist',
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

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('messages.selectConversation')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('messages.noMessages')}
          </p>
        </div>
      </div>
    );
  }

  const otherParty = getOtherParty();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Back button (mobile) */}
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}

          {/* Avatar */}
          {otherParty?.avatar ? (
            <img
              src={getAbsoluteImageUrl(otherParty.avatar)}
              alt={otherParty.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
              {otherParty?.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name and status */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {otherParty?.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {otherParty?.subtitle}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
            <VideoCameraIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => {
            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const isOwnMessage = message.senderId === currentUserId;
            const showDateDivider = shouldShowDateDivider(message, previousMessage);
            const showAvatar = !isOwnMessage && shouldShowAvatar(message, nextMessage);

            return (
              <div key={message.id}>
                {/* Date Divider */}
                {showDateDivider && (
                  <div className="flex items-center justify-center my-6">
                    <div className="px-4 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                      {formatDateDivider(message.createdAt)}
                    </div>
                  </div>
                )}

                {/* Message */}
                <MessageBubble
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showAvatar={showAvatar}
                  avatarUrl={!isOwnMessage ? otherParty?.avatar : undefined}
                  senderName={!isOwnMessage ? otherParty?.name : undefined}
                />
              </div>
            );
          })}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && <TypingIndicator senderName={otherParty?.name} />}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput
        value={newMessage}
        onChange={onNewMessageChange}
        onSubmit={onSendMessage}
        placeholder={t('messages.typeMessage')}
      />
    </div>
  );
};
