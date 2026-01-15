import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { MessageInterface } from '@/components/messages/MessageInterface';

const SpecialistMessages: React.FC = () => {
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);

  if (!user) {
    return null;
  }

  return (
    <MessageInterface
      currentUserId={user.id}
      userRole="specialist"
      title={t('dashboard.nav.messages') || 'Messages'}
      emptyTitle={t('messages.empty.title') || 'No conversations'}
      emptyDescription={t('messages.empty.description') || 'Your conversations with customers will appear here'}
    />
  );
};

export default SpecialistMessages;
