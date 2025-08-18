import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import BookingFlow from '../../pages/booking/BookingFlow';

const BookingRouter: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // If user is authenticated and is a customer, redirect to login to access protected booking
  // Non-authenticated users can see the public booking page but will need to login to proceed
  if (isAuthenticated && user?.userType === 'customer') {
    return <Navigate to="/dashboard" replace />;
  }

  // For non-authenticated users or specialists, show the public booking page
  return <BookingFlow />;
};

export default BookingRouter;