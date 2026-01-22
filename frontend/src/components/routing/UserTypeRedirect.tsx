import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import HomePage from '../../pages/HomePage';
import { useLanguage } from '@/contexts/LanguageContext';

export const UserTypeRedirect: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect authenticated users to their appropriate dashboard
      if (user.userType === 'specialist') {
        navigate('/specialist/dashboard', { replace: true });
        return;
      }
      if (user.userType === 'customer') {
        navigate('/dashboard', { replace: true });
        return;
      }
      if (user.userType === 'admin') {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
    }
  }, [isAuthenticated, user, navigate]);

  // If not authenticated or no redirect needed, show the homepage
  if (!isAuthenticated) {
    return <HomePage />;
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('navigation.redirectingDashboard')}</p>
      </div>
    </div>
  );
};
