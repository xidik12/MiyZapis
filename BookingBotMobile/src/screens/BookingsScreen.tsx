// Bookings Screen - Full implementation matching web version
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBookings, cancelBooking, selectBookings, selectBookingLoading, selectBookingError } from '../store/slices/bookingSlice';
import { useTheme } from '../contexts/ThemeContext';
import { Booking, BookingStatus } from '../types';
import { format } from 'date-fns';

interface FilterState {
  status: string;
  dateRange: string;
  searchTerm: string;
}

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  const bookings = useAppSelector(selectBookings);
  const isLoading = useAppSelector(selectBookingLoading);
  const error = useAppSelector(selectBookingError);
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: 'all',
    searchTerm: '',
  });
  
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const statusFilter = filters.status !== 'all' ? filters.status : undefined;
      await dispatch(fetchBookings({ filters: { status: statusFilter }, userType: 'customer' })).unwrap();
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

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
      
      const bookingDate = booking.scheduledAt ? new Date(booking.scheduledAt) : null;
      const matchesDateRange = filters.dateRange === 'all' || (
        bookingDate && filters.dateRange === 'today' && bookingDate.toDateString() === new Date().toDateString()
      ) || (
        bookingDate && filters.dateRange === 'week' && 
        bookingDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      return matchesStatus && matchesSearch && matchesDateRange;
    });
    
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.scheduledAt).getTime();
          bVal = new Date(b.scheduledAt).getTime();
          break;
        case 'amount':
          aVal = a.totalAmount || 0;
          bVal = b.totalAmount || 0;
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

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelBooking({ bookingId, reason: 'Customer requested cancellation' })).unwrap();
              Alert.alert('Success', 'Booking cancelled successfully');
              loadBookings();
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'CANCELLED':
        return colors.error;
      case 'COMPLETED':
        return colors.success;
      case 'IN_PROGRESS':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    filtersContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    filterGroup: {
      flex: 1,
      minWidth: '45%',
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    filterInput: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.background,
    },
    searchInput: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.background,
      marginTop: 8,
    },
    bookingCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    bookingTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      fontSize: 12,
      fontWeight: '600',
    },
    bookingInfo: {
      marginBottom: 8,
    },
    bookingInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    bookingInfoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      width: 100,
    },
    bookingInfoValue: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    bookingActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
    },
    actionButtonDanger: {
      backgroundColor: colors.error,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    closeButton: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.primary,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      gap: 8,
    },
    pageButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pageButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pageButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    pageButtonTextActive: {
      color: '#FFFFFF',
    },
  });

  if (isLoading && bookings.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
            Failed to load bookings
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={loadBookings}
          >
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>View and manage your appointments</Text>
        </View>

        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
                <TextInput
                  style={styles.filterInput}
                  value={filters.status}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, status: text }))}
                  placeholder="All"
                />
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
                <TextInput
                  style={styles.filterInput}
                  value={filters.dateRange}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, dateRange: text }))}
                  placeholder="All Time"
                />
              </View>
            </View>
          </View>
          <View>
            <Text style={styles.filterLabel}>Search</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by service or specialist..."
              placeholderTextColor={colors.textSecondary}
              value={filters.searchTerm}
              onChangeText={(text) => setFilters(prev => ({ ...prev, searchTerm: text }))}
            />
          </View>
        </View>

        {paginatedBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bookings found</Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => navigation.navigate('Search' as never)}
            >
              <Text style={styles.actionButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {paginatedBookings.map((booking) => {
              const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : new Date();
              const specialistName = booking.specialist
                ? `${booking.specialist.firstName || ''} ${booking.specialist.lastName || ''}`.trim()
                : booking.specialistName || 'Unknown Specialist';
              const serviceName = booking.service?.name || booking.serviceName || 'Unknown Service';

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => {
                    setSelectedBooking(booking);
                    setShowDetailModal(true);
                  }}
                >
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingTitle}>{serviceName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                      <Text style={{ color: getStatusColor(booking.status), fontSize: 12 }}>
                        {booking.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingInfo}>
                    <View style={styles.bookingInfoRow}>
                      <Text style={styles.bookingInfoLabel}>Specialist:</Text>
                      <Text style={styles.bookingInfoValue}>{specialistName}</Text>
                    </View>
                    <View style={styles.bookingInfoRow}>
                      <Text style={styles.bookingInfoLabel}>Date:</Text>
                      <Text style={styles.bookingInfoValue}>
                        {format(scheduledDate, 'MMM dd, yyyy')}
                      </Text>
                    </View>
                    <View style={styles.bookingInfoRow}>
                      <Text style={styles.bookingInfoLabel}>Time:</Text>
                      <Text style={styles.bookingInfoValue}>
                        {format(scheduledDate, 'hh:mm a')}
                      </Text>
                    </View>
                    <View style={styles.bookingInfoRow}>
                      <Text style={styles.bookingInfoLabel}>Amount:</Text>
                      <Text style={styles.bookingInfoValue}>
                        ${booking.totalAmount?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>

                  {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
                    <View style={styles.bookingActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={() => handleCancelBooking(booking.id)}
                      >
                        <Text style={styles.actionButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={styles.pageButton}
                  onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <Text style={styles.pageButtonText}>Previous</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.text, marginHorizontal: 16 }}>
                  Page {currentPage} of {totalPages}
                </Text>
                <TouchableOpacity
                  style={styles.pageButton}
                  onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Text style={styles.pageButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Booking Details</Text>
              {selectedBooking && (
                <>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    Service: {selectedBooking.service?.name || selectedBooking.serviceName}
                  </Text>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    Status: {selectedBooking.status}
                  </Text>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    Amount: ${selectedBooking.totalAmount?.toFixed(2) || '0.00'}
                  </Text>
                  {selectedBooking.scheduledAt && (
                    <Text style={{ color: colors.text, marginBottom: 8 }}>
                      Scheduled: {format(new Date(selectedBooking.scheduledAt), 'PPpp')}
                    </Text>
                  )}
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
