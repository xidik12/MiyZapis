import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import BookingFlow from '../../pages/booking/BookingFlow';

const BookingRouter: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // Allow customers and guests to access the booking flow.
  // Redirect specialists to their dashboard to avoid self-booking via UI.
  if (isAuthenticated && user?.userType === 'specialist') {
    return <Navigate to="/specialist/dashboard" replace />;
  }
  return <BookingFlow />;
};

export default BookingRouter;
