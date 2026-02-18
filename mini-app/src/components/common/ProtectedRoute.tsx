import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RootState } from '@/store';
import { useLocale, t } from '@/hooks/useLocale';
import { commonStrings } from '@/utils/translations';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'customer' | 'specialist' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRole
}) => {
  const locale = useLocale();
  const { isAuthenticated: tgAuth, isLoading: tgLoading, user: tgUser } = useTelegram();
  const { isAuthenticated: reduxAuth, isLoading: reduxLoading, user: reduxUser } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();

  const isAuthenticated = tgAuth || reduxAuth;
  const isLoading = tgLoading || reduxLoading;

  // Get user role from either source, normalize to lowercase
  const user = tgUser || reduxUser;
  const userRole = (user?.role || (user as any)?.userType || '').toLowerCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4 mx-auto" />
          <p className="text-text-secondary">{t(commonStrings, 'loading', locale)}</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Role-based access control
  if (requiredRole && userRole && userRole !== requiredRole && userRole !== 'admin') {
    // Redirect to appropriate home based on actual role
    const redirectPath = userRole === 'specialist' ? '/specialist-dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
