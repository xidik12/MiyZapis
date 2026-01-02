import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookingCard, BookingData } from './BookingCard';

interface SortableBookingCardProps {
  booking: BookingData;
  userRole: 'customer' | 'specialist';
  onClick?: () => void;
  onQuickAction?: (action: string) => void;
}

export const SortableBookingCard: React.FC<SortableBookingCardProps> = ({
  booking,
  userRole,
  onClick,
  onQuickAction
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: booking.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <BookingCard
        booking={booking}
        userRole={userRole}
        onClick={onClick}
        onQuickAction={onQuickAction}
        isDragging={isDragging}
      />
    </div>
  );
};
