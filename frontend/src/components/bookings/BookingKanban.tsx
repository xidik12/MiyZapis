import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { BookingCard, BookingData } from './BookingCard';
import { SortableBookingCard } from './SortableBookingCard';

interface BookingKanbanProps {
  bookings: BookingData[];
  userRole: 'customer' | 'specialist';
  onBookingClick?: (booking: BookingData) => void;
  onStatusChange?: (bookingId: string, newStatus: string) => void;
  onQuickAction?: (bookingId: string, action: string) => void;
}

const COLUMNS = [
  { id: 'PENDING', title: 'Pending', color: 'yellow' },
  { id: 'CONFIRMED', title: 'Confirmed', color: 'blue' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'purple' },
  { id: 'COMPLETED', title: 'Completed', color: 'green' },
  { id: 'CANCELLED', title: 'Cancelled', color: 'red' }
];

const columnColors = {
  yellow: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800',
  blue: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
  purple: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800',
  green: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
  red: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
};

const columnHeaderColors = {
  yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
  blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
  green: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  red: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
};

export const BookingKanban: React.FC<BookingKanbanProps> = ({
  bookings,
  userRole,
  onBookingClick,
  onStatusChange,
  onQuickAction
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Require 8px movement before drag starts
      }
    }),
    useSensor(KeyboardSensor)
  );

  const getBookingsByStatus = (status: string) => {
    return bookings.filter((booking) => booking.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeBooking = bookings.find((b) => b.id === active.id);
    const overColumnId = over.id as string;

    if (activeBooking && activeBooking.status !== overColumnId) {
      if (onStatusChange) {
        onStatusChange(activeBooking.id, overColumnId);
      }
    }

    setActiveId(null);
  };

  const activeBooking = activeId ? bookings.find((b) => b.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {COLUMNS.map((column) => {
          const columnBookings = getBookingsByStatus(column.id);
          const color = column.color as keyof typeof columnColors;

          return (
            <div
              key={column.id}
              className={`rounded-2xl border-2 ${columnColors[color]} overflow-hidden`}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 ${columnHeaderColors[color]}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-wide">
                    {column.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded-full text-xs font-bold">
                    {columnBookings.length}
                  </span>
                </div>
              </div>

              {/* Column Content - Droppable Area */}
              <SortableContext
                id={column.id}
                items={columnBookings.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {columnBookings.map((booking) => (
                      <SortableBookingCard
                        key={booking.id}
                        booking={booking}
                        userRole={userRole}
                        onClick={() => onBookingClick && onBookingClick(booking)}
                        onQuickAction={(action) => onQuickAction && onQuickAction(booking.id, action)}
                      />
                    ))}
                  </AnimatePresence>
                  {columnBookings.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm"
                    >
                      Drop bookings here
                    </motion.div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeBooking ? (
          <BookingCard
            booking={activeBooking}
            userRole={userRole}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
