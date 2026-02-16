import React from 'react';
import { User } from 'lucide-react';
import type { Conversation } from '@/store/slices/messagesSlice';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId?: string;
  onSelect: (conversation: Conversation) => void;
  formatTime: (date: string) => string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  onSelect,
  formatTime,
}) => {
  const getOtherParticipant = (conv: Conversation) => {
    if (conv.customer?.id === currentUserId) return conv.specialist;
    return conv.customer;
  };

  return (
    <div className="space-y-1">
      {conversations.map(conv => {
        const other = getOtherParticipant(conv);
        const hasUnread = conv.unreadCount > 0;

        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              hasUnread
                ? 'bg-bg-card/80 border border-accent-primary/10'
                : 'bg-bg-card/40 border border-white/5 hover:bg-bg-hover/50'
            }`}
          >
            <div className="w-11 h-11 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
              {other?.avatar ? (
                <img src={other.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={18} className="text-text-secondary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium truncate ${
                  hasUnread ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {other ? `${other.firstName} ${other.lastName}` : 'Unknown'}
                </p>
                <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
                  {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={`text-xs truncate ${
                  hasUnread ? 'text-text-primary font-medium' : 'text-text-muted'
                }`}>
                  {conv.lastMessage?.content || '...'}
                </p>
                {hasUnread && (
                  <span className="ml-2 bg-accent-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
