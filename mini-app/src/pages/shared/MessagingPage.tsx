import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConversationList } from '@/components/messages/ConversationList';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { fetchConversationsAsync } from '@/store/slices/messagesSlice';
import { useLocale, t } from '@/hooks/useLocale';
import { messagingStrings, commonStrings } from '@/utils/translations';

export const MessagingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();

  const { user } = useSelector((state: RootState) => state.auth);
  const { conversations, isLoading, error } = useSelector((state: RootState) => state.messages);

  const s = (key: string) => t(messagingStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  useEffect(() => {
    dispatch(fetchConversationsAsync());
  }, [dispatch]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / 3600000;

    if (diffHrs < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHrs < 48) {
      return locale === 'uk' ? 'Вчора' : locale === 'ru' ? 'Вчера' : 'Yesterday';
    }
    return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 pt-4 page-stagger">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-accent-red">{c('error')}</p>
              <p className="text-sm text-text-muted mt-2">{error}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary mb-2">{s('noConversations')}</p>
              <p className="text-sm text-text-muted">{s('startMessaging')}</p>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              currentUserId={user?.id}
              onSelect={(conv) => {
                hapticFeedback.impactLight();
                navigate(`/messages/${conv.id}`);
              }}
              formatTime={formatTime}
            />
          )}
        </div>
      </div>
    </div>
  );
};
