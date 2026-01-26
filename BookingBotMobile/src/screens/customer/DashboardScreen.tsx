/**
 * CustomerDashboardScreen - Redesigned with Panhaha design system
 * Full dashboard with stats, upcoming appointments, recent bookings, and favorites
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { bookingService } from '../../services/booking.service';
import { favoritesService } from '../../services/favorites.service';
import { loyaltyService } from '../../services/loyalty.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;

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
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
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

  const formatPrice = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[PRIMARY_COLORS[500], PRIMARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: ACCENT_COLORS[500] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: SECONDARY_COLORS[300] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            {t('dashboard.welcome')}{user?.firstName ? `, ${user.firstName}` : ''}!
          </Text>
          <Text style={styles.heroSubtitle}>{t('dashboard.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <View style={styles.quickActionsGrid}>
        <Button
          variant="primary"
          size="md"
          onPress={() => navigation.navigate('Search' as never)}
          style={{ flex: 1 }}
        >
          🔍 {t('dashboard.browseServices')}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onPress={() => navigation.navigate('Bookings' as never)}
          style={{ flex: 1 }}
        >
          📅 {t('dashboard.myBookings')}
        </Button>
      </View>
    </View>
  );

  const renderStats = () => {
    if (loading) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('dashboard.statistics')}
          </Text>
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ width: STAT_CARD_WIDTH }}>
                <Skeleton variant="rectangular" width={STAT_CARD_WIDTH} height={100} />
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (!stats) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('dashboard.statistics')}
        </Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>📊</Text>
            <Text style={[styles.statValue, { color: PRIMARY_COLORS[500] }]}>
              {stats.totalBookings}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('dashboard.totalBookings')}
            </Text>
          </Card>

          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>✅</Text>
            <Text style={[styles.statValue, { color: SUCCESS_COLOR }]}>
              {stats.completedBookings}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('dashboard.completed')}
            </Text>
          </Card>

          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: ACCENT_COLORS[500] }]}>
              {formatPrice(stats.totalSpent)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('dashboard.totalSpent')}
            </Text>
          </Card>

          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={[styles.statValue, { color: SECONDARY_COLORS[500] }]}>
              {stats.loyaltyPoints}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('dashboard.loyaltyPoints')}
            </Text>
          </Card>
        </View>
      </View>
    );
  };

  const renderNextAppointment = () => {
    if (loading) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('dashboard.nextAppointment')}
          </Text>
          <Skeleton variant="rectangular" width="100%" height={140} />
        </View>
      );
    }

    if (!nextAppointment) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('dashboard.nextAppointment')}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: nextAppointment.id })}
        >
          <Card style={styles.appointmentCard} borderVariant="accent" elevation="md">
            <View style={styles.appointmentHeader}>
              <Text style={[styles.appointmentTitle, { color: colors.text }]}>
                {nextAppointment.service?.name || nextAppointment.serviceName}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : PRIMARY_COLORS[50] }]}>
                <Text style={[styles.statusText, { color: PRIMARY_COLORS[500] }]}>
                  {nextAppointment.status}
                </Text>
              </View>
            </View>

            <View style={styles.appointmentDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>👨‍💼</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {nextAppointment.specialist?.firstName || nextAppointment.specialistName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {formatDate(nextAppointment.scheduledAt)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>⏰</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {formatTime(nextAppointment.scheduledAt)}
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecentBookings = () => {
    if (loading) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('dashboard.recentBookings')}
          </Text>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={80} style={{ marginBottom: SPACING.md }} />
          ))}
        </View>
      );
    }

    if (recentBookings.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('dashboard.recentBookings')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings' as never)}>
            <Text style={[styles.viewAllText, { color: PRIMARY_COLORS[500] }]}>
              {t('common.viewAll')}
            </Text>
          </TouchableOpacity>
        </View>
        {recentBookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: booking.id })}
          >
            <Card style={styles.bookingCard} borderVariant="subtle" elevation="sm">
              <Text style={[styles.bookingTitle, { color: colors.text }]}>
                {booking.service?.name || booking.serviceName}
              </Text>
              <Text style={[styles.bookingSubtitle, { color: colors.textSecondary }]}>
                {formatDate(booking.scheduledAt)} • {formatPrice(booking.totalAmount || 0)}
              </Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFavorites = () => {
    if (loading || favoriteSpecialists.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('dashboard.favoriteSpecialists')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Favorites' as never)}>
            <Text style={[styles.viewAllText, { color: PRIMARY_COLORS[500] }]}>
              {t('common.viewAll')}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
          {favoriteSpecialists.map((fav) => {
            const specialist = fav.specialist || fav;
            return (
              <TouchableOpacity
                key={specialist.id}
                onPress={() => navigation.navigate('SpecialistProfile' as never, { specialistId: specialist.id })}
              >
                <Card style={styles.favoriteCard} borderVariant="subtle" elevation="sm">
                  <Text style={styles.favoriteEmoji}>👨‍💼</Text>
                  <Text style={[styles.favoriteTitle, { color: colors.text }]} numberOfLines={1}>
                    {specialist.firstName} {specialist.lastName}
                  </Text>
                  <Text style={[styles.favoriteRating, { color: ACCENT_COLORS[500] }]}>
                    ⭐ {specialist.rating || 'N/A'}
                  </Text>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading || nextAppointment || recentBookings.length > 0) return null;

    return (
      <EmptyState
        emoji="📅"
        title={t('dashboard.noBookings')}
        description={t('dashboard.noBookingsDesc')}
        actionLabel={t('dashboard.browseServices')}
        onAction={() => navigation.navigate('Search' as never)}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLORS[500]}
            colors={[PRIMARY_COLORS[500]]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderQuickActions()}
        {renderStats()}
        {renderNextAppointment()}
        {renderRecentBookings()}
        {renderFavorites()}
        {renderEmptyState()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 140,
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
    width: 150,
    height: 150,
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  orb2: {
    width: 120,
    height: 120,
    bottom: -20,
    left: -20,
    opacity: 0.2,
  },
  heroContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.body.fontSize,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  viewAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statIcon: {
    fontSize: 28,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontWeight: TYPOGRAPHY.h3.fontWeight as any,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  appointmentCard: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  appointmentTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: 'uppercase',
  },
  appointmentDetails: {
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
  },
  bookingCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  bookingTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  bookingSubtitle: {
    fontSize: FONT_SIZES.sm,
  },
  favoriteCard: {
    width: 140,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  favoriteEmoji: {
    fontSize: 32,
  },
  favoriteTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  favoriteRating: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
