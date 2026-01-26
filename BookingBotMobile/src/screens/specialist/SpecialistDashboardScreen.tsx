/**
 * SpecialistDashboardScreen - Redesigned with Panhaha design system
 * Comprehensive dashboard with stats, upcoming bookings, and quick actions
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { bookingService } from '../../services/booking.service';
import { specialistService } from '../../services/specialist.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Divider } from '../../components/ui/Divider';
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
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
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

      const [bookingsRes, statsRes] = await Promise.allSettled([
        bookingService.getBookings({ limit: 10 }, 'specialist'),
        bookingService.getBookingStats('month'),
      ]);

      const bookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value.bookings : [];
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

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const getStatusBadgeVariant = (status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'secondary';
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
          <Text style={styles.heroGreeting}>{t('dashboard.welcome')}</Text>
          <Text style={styles.heroName}>
            {user?.firstName || user?.email?.split('@')[0] || t('dashboard.specialist')}
          </Text>
          <Text style={styles.heroSubtitle}>{t('dashboard.specialistSubtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStatsGrid = () => {
    if (!stats) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('dashboard.statistics')}
        </Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>📊</Text>
            <Text style={[styles.statValue, { color: SECONDARY_COLORS[500] }]}>
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
              {formatPrice(stats.totalRevenue)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('dashboard.revenue')}
            </Text>
          </Card>
          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={[styles.statValue, { color: ACCENT_COLORS[600] }]}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('dashboard.rating')}
            </Text>
          </Card>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('dashboard.quickActions')}
      </Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity onPress={() => navigation.navigate('SpecialistCalendar' as never)}>
          <Card style={styles.actionCard} borderVariant="subtle">
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>
              {t('dashboard.calendar')}
            </Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('MyServices' as never)}>
          <Card style={styles.actionCard} borderVariant="subtle">
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>
              {t('dashboard.services')}
            </Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SpecialistAnalytics' as never)}>
          <Card style={styles.actionCard} borderVariant="subtle">
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>
              {t('dashboard.analytics')}
            </Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SpecialistEarnings' as never)}>
          <Card style={styles.actionCard} borderVariant="subtle">
            <Text style={styles.actionIcon}>💵</Text>
            <Text style={[styles.actionText, { color: colors.text }]}>
              {t('dashboard.earnings')}
            </Text>
          </Card>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBookingCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: item.id } as never)}
    >
      <Card style={styles.bookingCard} borderVariant="subtle" elevation="sm">
        <View style={styles.bookingHeader}>
          <Text style={[styles.bookingTitle, { color: colors.text }]} numberOfLines={1}>
            {item.service?.name || item.serviceName}
          </Text>
          <Badge
            label={item.status}
            variant={getStatusBadgeVariant(item.status)}
            size="sm"
          />
        </View>
        <View style={styles.bookingDetails}>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingIcon}>👤</Text>
            <Text style={[styles.bookingText, { color: colors.textSecondary }]}>
              {item.customer?.firstName || item.customerName || t('common.unknown')}
            </Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingIcon}>📅</Text>
            <Text style={[styles.bookingText, { color: colors.textSecondary }]}>
              {new Date(item.scheduledAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingIcon}>⏰</Text>
            <Text style={[styles.bookingText, { color: colors.textSecondary }]}>
              {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingIcon}>💵</Text>
            <Text style={[styles.bookingAmount, { color: ACCENT_COLORS[500] }]}>
              {formatPrice(item.totalAmount || 0)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Skeleton variant="text" width="40%" height={24} style={{ marginBottom: SPACING.md }} />
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" width="48%" height={100} />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Skeleton variant="text" width="50%" height={24} style={{ marginBottom: SPACING.md }} />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={120} style={{ marginBottom: SPACING.md }} />
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
        {renderStatsGrid()}
        {renderQuickActions()}

        {upcomingBookings.length > 0 && (
          <>
            <Divider spacing={SPACING.lg} />
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('dashboard.upcomingBookings')}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SpecialistBookings' as never)}>
                  <Text style={[styles.viewAllText, { color: SECONDARY_COLORS[500] }]}>
                    {t('common.viewAll')} ›
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={upcomingBookings.slice(0, 5)}
                renderItem={renderBookingCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
              />
            </View>
          </>
        )}

        {recentBookings.length > 0 && (
          <>
            <Divider spacing={SPACING.lg} />
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('dashboard.recentCompleted')}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SpecialistBookings' as never)}>
                  <Text style={[styles.viewAllText, { color: SECONDARY_COLORS[500] }]}>
                    {t('common.viewAll')} ›
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentBookings}
                renderItem={renderBookingCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
              />
            </View>
          </>
        )}

        {!upcomingBookings.length && !recentBookings.length && (
          <EmptyState
            emoji="📅"
            title={t('dashboard.noBookings')}
            description={t('dashboard.noBookingsDesc')}
            actionLabel={t('dashboard.createService')}
            onAction={() => navigation.navigate('MyServices' as never)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 180,
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
    top: -40,
    right: -40,
    opacity: 0.3,
  },
  orb2: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -30,
    opacity: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroGreeting: {
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  heroName: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    fontWeight: TYPOGRAPHY.h1.fontWeight as any,
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  viewAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    width: (SPACING.lg * 2 + SPACING.md) * 2.2,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  bookingCard: {
    padding: SPACING.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bookingTitle: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    marginRight: SPACING.sm,
  },
  bookingDetails: {
    gap: SPACING.sm,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  bookingIcon: {
    fontSize: 16,
    width: 24,
  },
  bookingText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
  bookingAmount: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
