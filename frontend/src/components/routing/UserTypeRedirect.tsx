import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import HomePage from '../../pages/HomePage';
import { PageLoader } from '@/components/ui';
import { isTelegram } from '@/lib/telegram';

// Compare case-insensitively — the Telegram webapp auth endpoint returns an
// uppercase userType, while web login is lowercase.
const roleOf = (t?: string) => (t || '').toLowerCase();

export const UserTypeRedirect: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const inTelegram = isTelegram();
  const role = roleOf(user?.userType);
  // In the Telegram mini app, customers stay on home/search; on the web they
  // go to their dashboard.
  const customerStaysHome = role === 'customer' && inTelegram;

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (role === 'specialist') navigate('/specialist/dashboard', { replace: true });
    else if (role === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (role === 'customer' && !inTelegram) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, user, role, inTelegram, navigate]);

  // Render the homepage when not authenticated, or for a customer who should
  // stay on home (mini app). Otherwise show a brief loader while redirecting.
  if (!isAuthenticated || customerStaysHome) return <HomePage />;
  return <PageLoader text="Redirecting to your dashboard..." />;
};