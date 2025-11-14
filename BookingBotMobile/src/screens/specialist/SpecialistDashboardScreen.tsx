// Specialist Dashboard Screen - Full implementation matching web version
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
import { selectUser } from '../../store/slices/authSlice';
import { fetchBookings } from '../../store/slices/bookingSlice';
import { fetchSpecialistAnalytics } from '../../store/slices/specialistSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingService } from '../../services/booking.service';
import { specialistService } from '../../services/specialist.service';

interface SpecialistStats {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
}

export const SpecialistDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const user = useAppSelector(selectUser);
  
  const [stats, setStats] = useState<SpecialistStats | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [bookingsRes, analyticsRes, statsRes] = await Promise.allSettled([
        bookingService.getBookings({ limit: 10 }, 'specialist'),
        specialistService.getAnalytics('month'),
        bookingService.getBookingStats('month'),
      ]);

      const bookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value.bookings : [];
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;
      const bookingStats = statsRes.status === 'fulfilled' ? statsRes.value : null;

      setUpcomingBookings(bookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)));
      setRecentBookings(bookings.filter(b => b.status === 'COMPLETED').slice(0, 5));

      if (bookingStats) {
        setStats({
          totalBookings: bookingStats.totalBookings || 0,
          completedBookings: bookingStats.completedBookings || 0,
          pendingBookings: bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length,
          totalRevenue: bookingStats.totalRevenue || 0,
          averageRating: bookingStats.averageRating || 0,
          completionRate: bookingStats.completionRate || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    bookingCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    bookingTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    bookingStatus: {
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
    },
    actionButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
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
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!</Text>
        </View>

        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalBookings}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.completedBookings}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            </View>
          </View>
        )}

        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Bookings' as never)}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>View All</Text>
              </TouchableOpacity>
            </View>
            {upcomingBookings.slice(0, 5).map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: booking.id } as never)}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTitle}>
                    {booking.service?.name || booking.serviceName}
                  </Text>
                  <View style={[styles.bookingStatus, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={{ color: colors.primary, fontSize: 12 }}>
                      {booking.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingInfo}>
                  <View style={styles.bookingInfoRow}>
                    <Text style={styles.bookingInfoLabel}>Customer:</Text>
                    <Text style={styles.bookingInfoValue}>
                      {booking.customer?.firstName || booking.customerName || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.bookingInfoRow}>
                    <Text style={styles.bookingInfoLabel}>Date:</Text>
                    <Text style={styles.bookingInfoValue}>
                      {new Date(booking.scheduledAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.bookingInfoRow}>
                    <Text style={styles.bookingInfoLabel}>Time:</Text>
                    <Text style={styles.bookingInfoValue}>
                      {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.bookingInfoRow}>
                    <Text style={styles.bookingInfoLabel}>Amount:</Text>
                    <Text style={styles.bookingInfoValue}>
                      ${booking.totalAmount?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Recent Completed</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Bookings' as never)}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: booking.id } as never)}
              >
                <Text style={styles.bookingTitle}>
                  {booking.service?.name || booking.serviceName}
                </Text>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingInfoValue}>
                    {new Date(booking.scheduledAt).toLocaleDateString()} • ${booking.totalAmount?.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!upcomingBookings.length && !recentBookings.length && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: 16,
                borderRadius: 12,
                marginTop: 16,
              }}
              onPress={() => navigation.navigate('MyServices' as never)}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
                Create Your First Service
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
