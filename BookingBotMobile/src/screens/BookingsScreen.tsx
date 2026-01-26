/**
 * BookingsScreen - Redesigned with Panhaha design system
 * Booking list with status filters, search, and booking management
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBookings, cancelBooking, selectBookings, selectBookingLoading } from '../store/slices/bookingSlice';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Booking, BookingStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  WARNING_COLOR,
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../utils/design';

const STATUS_FILTERS = ['all', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const bookings = useAppSelector(selectBookings);
  const isLoading = useAppSelector(selectBookingLoading);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const statusFilter = selectedStatus !== 'all' ? selectedStatus : undefined;
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

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
      const specialistName = booking.specialist
        ? `${booking.specialist.firstName || ''} ${booking.specialist.lastName || ''}`.trim()
        : (booking.specialistName || '');
      const serviceName = booking.service?.name || booking.serviceName || '';
      const matchesSearch = !searchQuery ||
        specialistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        serviceName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [bookings, selectedStatus, searchQuery]);

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      t('bookings.cancelTitle'),
      t('bookings.cancelConfirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelBooking({ bookingId, reason: 'Customer requested cancellation' })).unwrap();
              Alert.alert(t('common.success'), t('bookings.cancelSuccess'));
              loadBookings();
            } catch (error: any) {
              Alert.alert(t('common.error'), error || t('bookings.cancelError'));
            }
          },
        },
      ]
    );
  };

  const getStatusBadgeVariant = (status: BookingStatus): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
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
        return 'primary';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[SECONDARY_COLORS[500], SECONDARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: ACCENT_COLORS[500] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>📅</Text>
          <Text style={styles.heroTitle}>{t('bookings.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('bookings.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Search */}
      <Input
        placeholder={t('bookings.searchPlaceholder')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Text style={styles.searchIcon}>🔍</Text>}
        rightIcon={
          searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFilters}
      >
        {STATUS_FILTERS.map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setSelectedStatus(status)}
            style={[
              styles.filterChip,
              selectedStatus === status && { backgroundColor: PRIMARY_COLORS[500], borderColor: PRIMARY_COLORS[500] },
              selectedStatus !== status && { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedStatus === status ? '#FFFFFF' : colors.text },
              ]}
            >
              {status === 'all' ? t('bookings.all') : t(`bookings.status.${status.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
        {filteredBookings.length} {t('bookings.results')}
      </Text>
    </View>
  );

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: item.id } as never)}
    >
      <Card style={styles.bookingCard} borderVariant="subtle" elevation="sm">
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
              {item.service?.name || item.serviceName}
            </Text>
            <Text style={[styles.specialistName, { color: colors.textSecondary }]}>
              {item.specialist
                ? `${item.specialist.firstName} ${item.specialist.lastName}`
                : item.specialistName}
            </Text>
          </View>
          <Badge
            label={item.status}
            variant={getStatusBadgeVariant(item.status)}
            size="sm"
          />
        </View>

        {/* Details */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {formatDate(item.scheduledAt)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {formatTime(item.scheduledAt)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <Text style={[styles.detailText, { color: ACCENT_COLORS[500], fontWeight: FONT_WEIGHTS.semibold }]}>
              {formatPrice(item.totalAmount || 0)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
          <View style={styles.cardActions}>
            <Button
              variant="destructive"
              size="sm"
              onPress={() => handleCancelBooking(item.id)}
              style={{ flex: 1 }}
            >
              {t('bookings.cancel')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('BookingDetail' as never, { bookingId: item.id } as never)}
              style={{ flex: 1 }}
            >
              {t('bookings.viewDetails')}
            </Button>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <View style={styles.content}>
          {renderFilters()}
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={180} style={{ marginBottom: SPACING.md }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderFilters()}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLORS[500]}
            colors={[PRIMARY_COLORS[500]]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📅"
            title={t('bookings.noBookings')}
            description={t('bookings.noBookingsDesc')}
            actionLabel={t('bookings.browseServices')}
            onAction={() => navigation.navigate('Search' as never)}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
  content: {
    padding: SPACING.lg,
  },
  filtersContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchIcon: {
    fontSize: 20,
  },
  clearIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  statusFilters: {
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  resultsCount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  bookingCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  serviceName: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  specialistName: {
    fontSize: FONT_SIZES.sm,
  },
  cardDetails: {
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
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
});
