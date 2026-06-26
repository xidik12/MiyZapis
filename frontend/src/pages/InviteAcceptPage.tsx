// /invite/:token
// For logged-in users: POSTs to /businesses/invites/:token/accept then redirects to /specialist/businesses.
// For logged-out users: redirects to /auth/register?invite=<token>.
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { apiClient } from '@/services/api';
import { PageLoader } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';

const InviteAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    if (!isAuthenticated) {
      navigate(`/auth/register?invite=${encodeURIComponent(token)}`, { replace: true });
      return;
    }

    // Logged-in user: accept and redirect.
    apiClient
      .post<{ joined: boolean; businessId: string }>(`/businesses/invites/${encodeURIComponent(token)}/accept`)
      .then(() => {
        navigate('/specialist/businesses', { replace: true });
      })
      .catch((err: any) => {
        const code: string = err?.response?.data?.error ?? err?.message ?? 'UNKNOWN';
        if (code === 'ALREADY_MEMBER') {
          // Already a member — just send them to their businesses page.
          navigate('/specialist/businesses', { replace: true });
          return;
        }
        if (code === 'INVITE_ALREADY_USED') {
          setError(t('invite.alreadyUsed'));
          return;
        }
        if (code === 'INVITE_EXPIRED') {
          setError(t('invite.expired'));
          return;
        }
        setError(t('invite.error'));
      });
  }, [token, isAuthenticated, navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('invite.errorTitle')}</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <a href="/" className="text-primary-600 hover:underline">{t('invite.goHome')}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <PageLoader />
    </div>
  );
};

export default InviteAcceptPage;
