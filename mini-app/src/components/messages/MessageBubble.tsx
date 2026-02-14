import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '@/store/slices/messagesSlice';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  formatTime: (date: string) => string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, formatTime }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl ${
          isOwn
            ? 'bg-accent-primary text-white rounded-br-md'
            : 'bg-bg-card/80 border border-white/5 text-text-primary rounded-bl-md'
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${
          isOwn ? 'text-white/60' : 'text-text-muted'
        }`}>
          <span className="text-[10px]">{formatTime(message.createdAt)}</span>
          {isOwn && (
            message.isRead
              ? <CheckCheck size={12} />
              : <Check size={12} />
          )}
        </div>
      </div>
    </div>
  );
};
