// Calendar Screen - Full implementation matching web version
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchBookings } from '../../store/slices/bookingSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingService } from '../../services/booking.service';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const startDate = startOfWeek(selectedDate);
      const endDate = endOfWeek(selectedDate);
      
      const result = await bookingService.getBookings({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }, 'specialist');
      
      setBookings(result.bookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduledAt);
      return isSameDay(bookingDate, date);
    });
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
    weekView: {
      marginBottom: 24,
    },
    weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    weekNavButton: {
      padding: 8,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    weekNavText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    weekDateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    daysContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    dayColumn: {
      flex: 1,
    },
    dayHeader: {
      padding: 8,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayHeaderSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    dayNameSelected: {
      color: '#FFFFFF',
    },
    dayNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    dayNumberSelected: {
      color: '#FFFFFF',
    },
    bookingItem: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingTime: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    bookingService: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    bookingCustomer: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emptyDay: {
      padding: 8,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.title}>Calendar</Text>
        </View>

        <View style={styles.weekView}>
          <View style={styles.weekHeader}>
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => {
                const prevWeek = new Date(selectedDate);
                prevWeek.setDate(prevWeek.getDate() - 7);
                setSelectedDate(prevWeek);
              }}
            >
              <Text style={styles.weekNavText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.weekDateText}>
              {format(startOfWeek(selectedDate), 'MMM dd')} - {format(endOfWeek(selectedDate), 'MMM dd, yyyy')}
            </Text>
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => {
                const nextWeek = new Date(selectedDate);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setSelectedDate(nextWeek);
              }}
            >
              <Text style={styles.weekNavText}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daysContainer}>
            {weekDays.map((day) => {
              const dayBookings = getBookingsForDate(day);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <View key={day.toISOString()} style={styles.dayColumn}>
                  <TouchableOpacity
                    style={[styles.dayHeader, isSelected && styles.dayHeaderSelected]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                      {format(day, 'EEE')}
                    </Text>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                  {dayBookings.length > 0 ? (
                    dayBookings.map((booking) => (
                      <TouchableOpacity
                        key={booking.id}
                        style={styles.bookingItem}
                        onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: booking.id } as never)}
                      >
                        <Text style={styles.bookingTime}>
                          {format(new Date(booking.scheduledAt), 'hh:mm a')}
                        </Text>
                        <Text style={styles.bookingService} numberOfLines={1}>
                          {booking.service?.name || booking.serviceName}
                        </Text>
                        <Text style={styles.bookingCustomer} numberOfLines={1}>
                          {booking.customer?.firstName || booking.customerName}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyDay}>
                      <Text style={styles.emptyText}>No bookings</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
