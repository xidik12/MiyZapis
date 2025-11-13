import React from 'react';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import { MainLayout } from './MainLayout';
import CustomerLayout from './CustomerLayout';
import SpecialistLayout from './SpecialistLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // If user is authenticated, use the appropriate layout based on user type
  if (isAuthenticated && user?.userType === 'customer') {
    return <CustomerLayout>{children}</CustomerLayout>;
  }
  
  if (isAuthenticated && (user?.userType === 'specialist' || user?.userType === 'business')) {
    return <SpecialistLayout>{children}</SpecialistLayout>;
  }

  // For non-authenticated users or other user types, use MainLayout
  return <MainLayout>{children}</MainLayout>;
};