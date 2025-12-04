import { useState, useMemo } from 'react';
import { Booking } from '../types';

interface FilterState {
  status: string;
  dateRange: string;
  serviceType: string;
  searchTerm: string;
}

export const useBookingFilters = (bookings: Booking[], itemsPerPage: number = 10) => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: 'all',
    serviceType: 'all',
    searchTerm: ''
  });

  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesStatus = filters.status === 'all' || booking.status === filters.status;

      const specialistName = booking.specialist
        ? `${booking.specialist.firstName || ''} ${booking.specialist.lastName || ''}`.trim()
        : (booking.specialistName || '');

      const serviceName = booking.service?.name || booking.serviceName || '';

      const matchesSearch = !filters.searchTerm ||
        specialistName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        serviceName.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const bookingDate = booking.scheduledAt
        ? new Date(booking.scheduledAt)
        : (booking.date ? new Date(booking.date) : null);

      const matchesDateRange = filters.dateRange === 'all' || (
        bookingDate && filters.dateRange === 'today' &&
        bookingDate.toDateString() === new Date().toDateString()
      ) || (
        bookingDate && filters.dateRange === 'week' &&
        bookingDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      return matchesStatus && matchesSearch && matchesDateRange;
    });

    // Sort bookings
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'date':
          aVal = new Date(a.scheduledAt);
          bVal = new Date(b.scheduledAt);
          break;
        case 'amount':
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [bookings, filters, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage);
  const paginatedBookings = filteredAndSortedBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return {
    filters,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    filteredAndSortedBookings,
    paginatedBookings,
    updateFilters,
    setSortBy,
    toggleSortOrder,
    setCurrentPage
  };
};