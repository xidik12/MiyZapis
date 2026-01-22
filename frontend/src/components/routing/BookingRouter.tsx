import React from 'react';
import BookingFlow from '../../pages/booking/BookingFlow';

const BookingRouter: React.FC = () => {
  // Authentication is handled by ProtectedRoute wrapper in App.tsx
  // The BookingFlow component will handle preventing specialists from self-booking.
  return <BookingFlow />;
};

export default BookingRouter;
