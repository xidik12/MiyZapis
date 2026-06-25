import React from 'react';
import BookingFlow from '../../pages/booking/BookingFlow';

const BookingRouter: React.FC = () => {
  // Booking route is public in App.tsx (no ProtectedRoute wrapper).
  // BookingFlow handles specialist self-booking prevention internally.
  return <BookingFlow />;
};

export default BookingRouter;
