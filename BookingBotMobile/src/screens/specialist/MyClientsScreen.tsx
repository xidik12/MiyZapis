/**
 * MyClientsScreen - Redesigned with Panhaha design system
 * Client relationship management with stats and history
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../../store/hooks';
import { fetchBookings } from '../../store/slices/bookingSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { bookingService } from '../../services/booking.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
import { formatDistanceToNow } from 'date-fns';

interface Client {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bookingCount: number;
  totalSpent: number;
  lastBooking: string;
}

export const MyClientsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const result = await bookingService.getBookings({}, 'specialist');

      // Extract unique clients from bookings
      const clientMap = new Map();
      result.bookings.forEach((booking: any) => {
        const customer = booking.customer;
        if (customer && !clientMap.has(customer.id)) {
          clientMap.set(customer.id, {
            ...customer,
            bookingCount: 1,
            totalSpent: booking.totalAmount || 0,
            lastBooking: booking.scheduledAt,
          });
        } else if (customer) {
          const existing = clientMap.get(customer.id);
          existing.bookingCount += 1;
          existing.totalSpent += booking.totalAmount || 0;
          if (new Date(booking.scheduledAt) > new Date(existing.lastBooking)) {
            existing.lastBooking = booking.scheduledAt;
          }
        }
      });

      setClients(Array.from(clientMap.values()));
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true;
    const name = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
    const email = (client.email || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  const getClientTier = (bookingCount: number): { label: string; variant: 'primary' | 'secondary' | 'accent' } => {
    if (bookingCount >= 20) return { label: t('clients.vip'), variant: 'accent' };
    if (bookingCount >= 10) return { label: t('clients.regular'), variant: 'secondary' };
    return { label: t('clients.new'), variant: 'primary' };
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
          <Text style={styles.heroIcon}>👥</Text>
          <Text style={styles.heroTitle}>{t('clients.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('clients.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStatsCard = () => {
    const totalClients = clients.length;
    const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0);
    const avgSpent = totalClients > 0 ? totalRevenue / totalClients : 0;
    const vipClients = clients.filter((c) => c.bookingCount >= 20).length;

    return (
      <Card style={styles.statsCard} borderVariant="subtle" elevation="md">
        <LinearGradient
          colors={
            isDark
              ? [SECONDARY_COLORS[900] + '40', SECONDARY_COLORS[800] + '20']
              : [SECONDARY_COLORS[50], SECONDARY_COLORS[100]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGradient}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: SECONDARY_COLORS[600] }]}>{totalClients}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('clients.totalClients')}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: SUCCESS_COLOR }]}>${totalRevenue.toFixed(0)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('clients.totalRevenue')}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: ACCENT_COLORS[600] }]}>{vipClients}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('clients.vipClients')}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Card>
    );
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={[
          styles.searchInput,
          { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
        ]}
        placeholder={t('clients.searchPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  const renderClientCard = ({ item }: { item: Client }) => {
    const tier = getClientTier(item.bookingCount);
    const lastBookingText = formatDistanceToNow(new Date(item.lastBooking), { addSuffix: true });

    return (
      <Card style={styles.clientCard} borderVariant="subtle" elevation="sm">
        <TouchableOpacity
          style={styles.clientContent}
          onPress={() => navigation.navigate('ClientDetail' as never, { clientId: item.id } as never)}
        >
          {/* Avatar */}
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50] },
              ]}
            >
              <Text style={[styles.avatarText, { color: SECONDARY_COLORS[500] }]}>
                {item.firstName?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || 'C'}
              </Text>
            </View>
          )}

          {/* Client Info */}
          <View style={styles.clientInfo}>
            <View style={styles.clientHeader}>
              <Text style={[styles.clientName, { color: colors.text }]}>
                {item.firstName} {item.lastName}
              </Text>
              <Badge label={tier.label} variant={tier.variant} size="sm" />
            </View>
            <Text style={[styles.clientEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.email}
            </Text>
            <View style={styles.clientStats}>
              <View style={styles.statBadge}>
                <Text style={[styles.statBadgeEmoji]}>📅</Text>
                <Text style={[styles.statBadgeText, { color: colors.textSecondary }]}>
                  {item.bookingCount} {t('clients.bookings')}
                </Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={[styles.statBadgeEmoji]}>💰</Text>
                <Text style={[styles.statBadgeText, { color: SUCCESS_COLOR }]}>
                  ${item.totalSpent.toFixed(2)}
                </Text>
              </View>
            </View>
            <Text style={[styles.lastBooking, { color: colors.textSecondary }]}>
              {t('clients.lastBooking')}: {lastBookingText}
            </Text>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={120} style={{ marginBottom: SPACING.lg }} />
          <Skeleton variant="rectangular" width="100%" height={50} style={{ marginBottom: SPACING.lg }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height={140}
              style={{ marginBottom: SPACING.md }}
            />
          ))}
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
        {renderStatsCard()}
        {renderSearchBar()}

        {filteredClients.length === 0 ? (
          <EmptyState
            emoji="👥"
            title={searchQuery ? t('clients.noResults') : t('clients.noClients')}
            description={searchQuery ? t('clients.noResultsDesc') : t('clients.noClientsDesc')}
          />
        ) : (
          <FlatList
            data={filteredClients}
            renderItem={renderClientCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
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
  statsCard: {
    marginBottom: SPACING.lg,
  },
  statsGradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchContainer: {
    marginBottom: SPACING.lg,
  },
  searchInput: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.base,
    borderWidth: 1,
  },
  clientCard: {
    padding: SPACING.md,
  },
  clientContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
  },
  clientInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  clientName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
  },
  clientEmail: {
    fontSize: FONT_SIZES.sm,
  },
  clientStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statBadgeEmoji: {
    fontSize: 14,
  },
  statBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  lastBooking: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
});
