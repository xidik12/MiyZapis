import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import SearchPage from '../../pages/SearchPage';

const SearchPageRouter: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // If user is authenticated and is a customer, redirect to dashboard
  // They can navigate to search from the customer layout menu
  if (isAuthenticated && user?.userType === 'customer') {
    return <Navigate to="/dashboard" replace />;
  }

  // For non-authenticated users or specialists, show the public search page
  return <SearchPage />;
};

export default SearchPageRouter;