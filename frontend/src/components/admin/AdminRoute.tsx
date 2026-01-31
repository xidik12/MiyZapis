import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Admin Route Protection Component
 * 
 * This component provides additional security for admin routes by:
 * 1. Requiring authentication
 * 2. Requiring ADMIN user type
 * 3. Preventing unauthorized access even with direct URLs
 * 4. Not exposing admin routes to search engines or casual browsing
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // First check: Must be authenticated
  if (!isAuthenticated) {
    // Don't reveal the existence of admin routes to unauthenticated users
    // Redirect to login without specifying the return URL for admin routes
    return <Navigate to="/auth/login" replace />;
  }

  // Second check: Must be an admin user
  if (user?.userType !== 'admin') {
    // Don't reveal admin route existence to non-admin users
    // Redirect to their appropriate dashboard or 404
    const redirectTo = user?.userType === 'specialist' 
      ? '/specialist/dashboard' 
      : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  // Third check: Additional validation could be added here
  // For example, checking specific admin permissions or roles
  // if (user && !user.hasAdminPermissions) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  // All checks passed - render admin content
  return <>{children}</>;
};

export default AdminRoute;