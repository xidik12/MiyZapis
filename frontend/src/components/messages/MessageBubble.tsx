import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { CheckIcon } from '@/components/icons';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    readAt?: string;
  };
  isOwnMessage: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
  senderName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = false,
  avatarUrl,
  senderName
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
    >
      {/* Avatar (for received messages) */}
      {!isOwnMessage && showAvatar && (
        <div className="flex-shrink-0 mb-1">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
              {senderName?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Placeholder for alignment when avatar is hidden */}
      {!isOwnMessage && !showAvatar && <div className="w-8" />}

      {/* Message Bubble */}
      <div
        className={`max-w-[70%] sm:max-w-[60%] px-3 py-2 rounded-2xl shadow-sm ${
          isOwnMessage
            ? 'bg-primary-500 text-white rounded-br-md'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-600'
        }`}
      >
        {/* Message Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Time and Read Status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
          <span
            className={`text-xs ${
              isOwnMessage
                ? 'text-white/80'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {formatTime(message.createdAt)}
          </span>

          {/* Read Status (for own messages) */}
          {isOwnMessage && (
            <div className="flex-shrink-0">
              {message.readAt ? (
                // Double check (read)
                <CheckCheck className="w-4 h-4 text-blue-300" />
              ) : (
                // Double check (delivered but not read)
                <CheckCheck className="w-4 h-4 text-white/60" />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
