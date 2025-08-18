import React from 'react';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import { MainLayout } from './MainLayout';
import CustomerLayout from './CustomerLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // If user is authenticated and is a customer, use CustomerLayout (with sidebar)
  if (isAuthenticated && user?.userType === 'customer') {
    return <CustomerLayout>{children}</CustomerLayout>;
  }

  // Otherwise, use MainLayout (without sidebar)
  return <MainLayout>{children}</MainLayout>;
};