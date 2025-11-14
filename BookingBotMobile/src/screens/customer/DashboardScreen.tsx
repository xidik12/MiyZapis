// Customer Dashboard Screen - Full implementation matching web version
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
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { fetchBookings } from '../../store/slices/bookingSlice';
import { useAppDispatch } from '../../store/hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingService } from '../../services/booking.service';
import { favoritesService } from '../../services/favorites.service';
import { loyaltyService } from '../../services/loyalty.service';

interface CustomerStats {
  totalSpent: number;
  loyaltyPoints: number;
  completedBookings: number;
  totalBookings: number;
  averageRating: number;
}

export const CustomerDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const user = useAppSelector(selectUser);
  
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [favoriteSpecialists, setFavoriteSpecialists] = useState<any[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [upcomingRes, completedRes, favoritesRes, loyaltyRes] = await Promise.allSettled([
        bookingService.getBookings({ limit: 10, status: 'CONFIRMED,PENDING,IN_PROGRESS' }, 'customer'),
        bookingService.getBookings({ limit: 5, status: 'COMPLETED' }, 'customer'),
        favoritesService.getFavorites().catch(() => ({ services: [], specialists: [] })),
        loyaltyService.getAccount().catch(() => null),
      ]);

      const upcoming = upcomingRes.status === 'fulfilled' ? upcomingRes.value.bookings : [];
      const completed = completedRes.status === 'fulfilled' ? completedRes.value.bookings : [];
      const favorites = favoritesRes.status === 'fulfilled' ? favoritesRes.value : { services: [], specialists: [] };
      const loyalty = loyaltyRes.status === 'fulfilled' ? loyaltyRes.value : null;

      // Next appointment
      const sorted = [...upcoming].sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      setNextAppointment(sorted[0] || null);

      // Recent bookings
      setRecentBookings(completed.slice(0, 5));

      // Stats
      const totalSpent = completed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      setStats({
        totalSpent,
        loyaltyPoints: loyalty?.currentPoints || 0,
        completedBookings: completed.length,
        totalBookings: upcoming.length + completed.length,
        averageRating: 0,
      });

      // Favorites
      setFavoriteSpecialists(favorites.specialists.slice(0, 6));
      setLoyaltyData(loyalty);
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
    appointmentCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    appointmentTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    appointmentText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    bookingCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    bookingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    bookingText: {
      fontSize: 14,
      color: colors.textSecondary,
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
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
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
          <Text style={styles.title}>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!</Text>
          <Text style={styles.subtitle}>Here's your booking overview</Text>
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
                <Text style={styles.statValue}>${stats.totalSpent.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.loyaltyPoints}</Text>
                <Text style={styles.statLabel}>Loyalty Points</Text>
              </View>
            </View>
          </View>
        )}

        {nextAppointment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Appointment</Text>
            <TouchableOpacity
              style={styles.appointmentCard}
              onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: nextAppointment.id })}
            >
              <Text style={styles.appointmentTitle}>
                {nextAppointment.service?.name || nextAppointment.serviceName}
              </Text>
              <Text style={styles.appointmentText}>
                Specialist: {nextAppointment.specialist?.firstName || nextAppointment.specialistName}
              </Text>
              <Text style={styles.appointmentText}>
                Date: {new Date(nextAppointment.scheduledAt).toLocaleDateString()}
              </Text>
              <Text style={styles.appointmentText}>
                Time: {new Date(nextAppointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Bookings' as never)}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: booking.id })}
              >
                <Text style={styles.bookingTitle}>
                  {booking.service?.name || booking.serviceName}
                </Text>
                <Text style={styles.bookingText}>
                  {new Date(booking.scheduledAt).toLocaleDateString()} • ${booking.totalAmount?.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {favoriteSpecialists.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Favorite Specialists</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Favorites' as never)}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {favoriteSpecialists.map((fav) => {
                const specialist = fav.specialist || fav;
                return (
                  <TouchableOpacity
                    key={specialist.id}
                    style={[styles.bookingCard, { width: 200, marginRight: 12 }]}
                    onPress={() => navigation.navigate('SpecialistProfile' as never, { specialistId: specialist.id })}
                  >
                    <Text style={styles.bookingTitle}>
                      {specialist.firstName} {specialist.lastName}
                    </Text>
                    <Text style={styles.bookingText}>
                      Rating: {specialist.rating || 'N/A'} ⭐
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {!nextAppointment && recentBookings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Search' as never)}
            >
              <Text style={styles.buttonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

