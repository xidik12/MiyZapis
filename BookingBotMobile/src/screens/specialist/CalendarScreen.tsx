/**
 * CalendarScreen - Redesigned with Panhaha design system
 * Week view calendar with booking visualization and navigation
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { bookingService } from '../../services/booking.service';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  WARNING_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return WARNING_COLOR;
      case 'CONFIRMED':
        return PRIMARY_COLORS[500];
      case 'IN_PROGRESS':
        return SECONDARY_COLORS[500];
      case 'COMPLETED':
        return SUCCESS_COLOR;
      default:
        return colors.textSecondary;
    }
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[SECONDARY_COLORS[500], SECONDARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: ACCENT_COLORS[500] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>📅</Text>
          <Text style={styles.heroTitle}>{t('calendar.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('calendar.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderWeekNavigation = () => (
    <View style={styles.weekNavigation}>
      <TouchableOpacity
        onPress={() => {
          const prevWeek = new Date(selectedDate);
          prevWeek.setDate(prevWeek.getDate() - 7);
          setSelectedDate(prevWeek);
        }}
        style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.navButtonText, { color: SECONDARY_COLORS[500] }]}>‹</Text>
      </TouchableOpacity>

      <View style={styles.weekRangeContainer}>
        <Text style={[styles.weekRangeText, { color: colors.text }]}>
          {format(startOfWeek(selectedDate), 'MMM dd')} - {format(endOfWeek(selectedDate), 'MMM dd, yyyy')}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          const nextWeek = new Date(selectedDate);
          nextWeek.setDate(nextWeek.getDate() + 7);
          setSelectedDate(nextWeek);
        }}
        style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.navButtonText, { color: SECONDARY_COLORS[500] }]}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeekView = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekScrollContainer}>
      <View style={styles.daysContainer}>
        {weekDays.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const dayIsToday = isToday(day);

          return (
            <View key={day.toISOString()} style={styles.dayColumn}>
              {/* Day Header */}
              <TouchableOpacity
                style={[
                  styles.dayHeader,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { backgroundColor: SECONDARY_COLORS[500], borderColor: SECONDARY_COLORS[500] },
                  dayIsToday && !isSelected && { borderColor: SECONDARY_COLORS[500], borderWidth: 2 },
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dayName,
                    { color: colors.textSecondary },
                    isSelected && { color: '#FFFFFF' },
                  ]}
                >
                  {format(day, 'EEE')}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    { color: colors.text },
                    isSelected && { color: '#FFFFFF' },
                    dayIsToday && !isSelected && { color: SECONDARY_COLORS[500] },
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {dayBookings.length > 0 && (
                  <View style={[styles.bookingCount, { backgroundColor: isSelected ? '#FFFFFF' : ACCENT_COLORS[500] }]}>
                    <Text style={[styles.bookingCountText, { color: isSelected ? SECONDARY_COLORS[500] : '#FFFFFF' }]}>
                      {dayBookings.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Day Bookings */}
              <View style={styles.dayBookingsContainer}>
                {dayBookings.length > 0 ? (
                  dayBookings.map((booking) => (
                    <TouchableOpacity
                      key={booking.id}
                      onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: booking.id } as never)}
                    >
                      <Card style={[styles.bookingItem, { borderLeftColor: getStatusColor(booking.status), borderLeftWidth: 3 }]} borderVariant="subtle" elevation="sm">
                        <Text style={[styles.bookingTime, { color: SECONDARY_COLORS[600] }]}>
                          {format(new Date(booking.scheduledAt), 'hh:mm a')}
                        </Text>
                        <Text style={[styles.bookingService, { color: colors.text }]} numberOfLines={1}>
                          {booking.service?.name || booking.serviceName}
                        </Text>
                        <Text style={[styles.bookingCustomer, { color: colors.textSecondary }]} numberOfLines={1}>
                          👤 {booking.customer?.firstName || booking.customerName}
                        </Text>
                      </Card>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyDay}>
                    <Text style={[styles.emptyDayText, { color: colors.textSecondary }]}>
                      {t('calendar.noBookings')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={60} style={{ marginBottom: SPACING.lg }} />
          <View style={styles.daysContainer}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View key={i} style={styles.dayColumn}>
                <Skeleton variant="rectangular" width={100} height={80} style={{ marginBottom: SPACING.md }} />
                <Skeleton variant="rectangular" width={100} height={60} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SECONDARY_COLORS[500]}
            colors={[SECONDARY_COLORS[500]]}
          />
        }
      >
        {renderWeekNavigation()}
        {renderWeekView()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 160,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  decorativeOrbs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 140,
    height: 140,
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  orb2: {
    width: 110,
    height: 110,
    bottom: -20,
    left: -20,
    opacity: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
  },
  weekRangeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekRangeText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  weekScrollContainer: {
    paddingRight: SPACING.lg,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dayColumn: {
    width: 100,
  },
  dayHeader: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    position: 'relative',
  },
  dayName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  dayNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  bookingCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCountText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  dayBookingsContainer: {
    gap: SPACING.sm,
  },
  bookingItem: {
    padding: SPACING.sm,
  },
  bookingTime: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 2,
  },
  bookingService: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: 2,
  },
  bookingCustomer: {
    fontSize: FONT_SIZES.xs,
  },
  emptyDay: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
});
