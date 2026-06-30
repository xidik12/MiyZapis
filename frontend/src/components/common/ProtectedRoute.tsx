import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import { UserType } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: UserType;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredUserType,
  redirectTo,
}) => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo || `/auth/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Compare case-insensitively: the Telegram webapp auth returns an UPPERCASE
  // userType ('SPECIALIST') while web login returns lowercase. A case-sensitive
  // check bounced mini-app specialists off /specialist/dashboard into an infinite
  // redirect loop (stuck on "Redirecting to your dashboard…").
  const role = (user?.userType || '').toLowerCase();

  // If user type is required and doesn't match, redirect appropriately
  if (requiredUserType && role !== String(requiredUserType).toLowerCase()) {
    // Redirect to appropriate dashboard based on user type
    let defaultRedirect = '/dashboard';

    switch (role) {
      case 'specialist':
        defaultRedirect = '/specialist/dashboard';
        break;
      case 'admin':
        defaultRedirect = '/admin/dashboard';
        break;
      case 'customer':
      default:
        defaultRedirect = '/dashboard';
        break;
    }

    return <Navigate to={defaultRedirect} replace />;
  }

  // Force specialists who haven't completed onboarding to the onboarding page
  if (
    role === 'specialist' &&
    user?.profileComplete === false &&
    location.pathname !== '/specialist/onboarding'
  ) {
    return <Navigate to="/specialist/onboarding" replace />;
  }

  // Force already-onboarded specialists who are missing the search-gate fields
  // (business name + contact + location) through a lightweight completion step,
  // so existing incomplete profiles become discoverable on next login.
  if (
    role === 'specialist' &&
    (user as { requiresProfileCompletion?: boolean })?.requiresProfileCompletion === true &&
    location.pathname !== '/specialist/complete-profile' &&
    location.pathname !== '/specialist/onboarding'
  ) {
    return <Navigate to="/specialist/complete-profile" replace />;
  }

  return <>{children}</>;
};