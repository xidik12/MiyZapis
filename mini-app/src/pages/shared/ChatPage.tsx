import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, User } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useWebSocket } from '@/components/common/WebSocketProvider';
import { RootState, AppDispatch } from '@/store';
import {
  fetchConversationAsync,
  sendMessageAsync,
  markMessagesReadAsync,
  addMessage,
  clearMessages,
} from '@/store/slices/messagesSlice';
import { useLocale, t } from '@/hooks/useLocale';
import { messagingStrings } from '@/utils/translations';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();
  const { subscribe, unsubscribe } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const { activeConversation, messages, isLoadingMessages, isSending } = useSelector(
    (state: RootState) => state.messages
  );

  const s = (key: string) => t(messagingStrings, key, locale);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchConversationAsync(conversationId));
      dispatch(markMessagesReadAsync(conversationId));
    }
    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch, conversationId]);

  // Subscribe to real-time messages
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversationId) {
        dispatch(addMessage(data));
        if (conversationId) {
          dispatch(markMessagesReadAsync(conversationId));
        }
      }
    };

    subscribe('new_message', handleNewMessage);
    return () => unsubscribe('new_message', handleNewMessage);
  }, [conversationId, subscribe, unsubscribe, dispatch]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherParticipant = activeConversation
    ? (activeConversation.customer?.id === user?.id ? activeConversation.specialist : activeConversation.customer)
    : undefined;

  const handleSend = (content: string) => {
    if (conversationId) {
      dispatch(sendMessageAsync({ conversationId, content }));
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg-secondary/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => { hapticFeedback.impactLight(); navigate('/messages'); }}
          className="text-text-secondary"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="w-9 h-9 rounded-full overflow-hidden bg-bg-hover flex-shrink-0">
          {otherParticipant?.avatar ? (
            <img src={otherParticipant.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={16} className="text-text-secondary" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {otherParticipant
              ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
              : s('title')}
          </p>
          <p className="text-xs text-text-muted">{s('online')}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
        {isLoadingMessages ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">{s('startMessaging')}</p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
                formatTime={formatTime}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        isSending={isSending}
        placeholder={s('typeMessage')}
      />
    </div>
  );
};
