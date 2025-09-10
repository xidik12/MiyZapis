import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import BookingFlow from '../../pages/booking/BookingFlow';

const BookingRouter: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // Allow customers, specialists, and guests to access the booking flow.
  // The BookingFlow component will handle preventing specialists from self-booking.
  return <BookingFlow />;
};

export default BookingRouter;
