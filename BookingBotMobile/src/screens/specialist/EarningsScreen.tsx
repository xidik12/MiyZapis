/**
 * EarningsScreen - Redesigned with Panhaha design system
 * Revenue tracking with period selector, stats, and transaction history
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { specialistService } from '../../services/specialist.service';
import { format } from 'date-fns';
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
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

const { width } = Dimensions.get('window');

interface EarningsData {
  thisMonth: number;
  lastMonth: number;
  total: number;
  growth?: number;
}

interface Transaction {
  id: string;
  amount: number;
  description?: string;
  type: 'CREDIT' | 'DEBIT';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
  bookingId?: string;
}

export const EarningsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadEarnings();
  }, [period]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const earningsData = await specialistService.getRevenue(period);
      setEarnings(earningsData);
      // TODO: Load transactions from API
      setTransactions([]);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const getTransactionStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'COMPLETED':
        return SUCCESS_COLOR;
      case 'PENDING':
        return ACCENT_COLORS[500];
      case 'FAILED':
        return ERROR_COLOR;
      default:
        return colors.textSecondary;
    }
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[ACCENT_COLORS[500], ACCENT_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: SECONDARY_COLORS[300] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>💰</Text>
          <Text style={styles.heroTitle}>{t('earnings.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('earnings.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: isDark ? colors.surface : colors.border }]}>
      {(['week', 'month', 'year'] as const).map((p) => (
        <TouchableOpacity
          key={p}
          style={[
            styles.periodButton,
            period === p && [styles.periodButtonActive, { backgroundColor: colors.background }],
          ]}
          onPress={() => setPeriod(p)}
        >
          <Text
            style={[
              styles.periodButtonText,
              { color: colors.textSecondary },
              period === p && [styles.periodButtonTextActive, { color: ACCENT_COLORS[500] }],
            ]}
          >
            {t(`earnings.period.${p}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEarningsCard = () => {
    if (!earnings) return null;

    const growthIsPositive = (earnings.growth || 0) > 0;

    return (
      <Card style={styles.earningsCard} borderVariant="accent" elevation="lg">
        <LinearGradient
          colors={
            isDark
              ? [ACCENT_COLORS[900] + '40', ACCENT_COLORS[800] + '20']
              : [ACCENT_COLORS[50], ACCENT_COLORS[100]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earningsGradient}
        >
          <View style={styles.earningsHeader}>
            <Text style={[styles.earningsLabel, { color: colors.textSecondary }]}>
              {t('earnings.currentPeriod', { period: t(`earnings.period.${period}`) })}
            </Text>
            {earnings.growth !== undefined && (
              <View style={[styles.growthBadge, { backgroundColor: growthIsPositive ? SUCCESS_COLOR + '20' : ERROR_COLOR + '20' }]}>
                <Text style={[styles.growthText, { color: growthIsPositive ? SUCCESS_COLOR : ERROR_COLOR }]}>
                  {growthIsPositive ? '↑' : '↓'} {Math.abs(earnings.growth).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.earningsValue, { color: ACCENT_COLORS[700] }]}>
            {formatPrice(earnings.thisMonth || 0)}
          </Text>

          <Divider spacing={SPACING.md} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('earnings.lastPeriod', { period: t(`earnings.period.${period}`) })}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatPrice(earnings.lastMonth || 0)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('earnings.total')}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatPrice(earnings.total || 0)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Card>
    );
  };

  const renderTransactionCard = ({ item }: { item: Transaction }) => (
    <TouchableOpacity>
      <Card style={styles.transactionCard} borderVariant="subtle" elevation="sm">
        <View style={styles.transactionContent}>
          <View style={styles.transactionLeft}>
            <View style={[styles.transactionIcon, { backgroundColor: item.type === 'CREDIT' ? SUCCESS_COLOR + '20' : ERROR_COLOR + '20' }]}>
              <Text style={styles.transactionEmoji}>{item.type === 'CREDIT' ? '💵' : '💸'}</Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={[styles.transactionDescription, { color: colors.text }]} numberOfLines={1}>
                {item.description || t('earnings.bookingPayment')}
              </Text>
              <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                {format(new Date(item.createdAt), 'MMM dd, yyyy • hh:mm a')}
              </Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                { color: item.type === 'CREDIT' ? SUCCESS_COLOR : ERROR_COLOR },
              ]}
            >
              {item.type === 'CREDIT' ? '+' : '-'}{formatPrice(item.amount)}
            </Text>
            <Badge
              label={t(`earnings.status.${item.status.toLowerCase()}`)}
              variant={item.status === 'COMPLETED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'error'}
              size="sm"
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderTransactions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('earnings.recentTransactions')}
      </Text>
      {transactions.length === 0 ? (
        <EmptyState
          emoji="💳"
          title={t('earnings.noTransactions')}
          description={t('earnings.noTransactionsDesc')}
        />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={50} style={{ marginBottom: SPACING.lg }} />
          <Skeleton variant="rectangular" width="100%" height={200} style={{ marginBottom: SPACING.lg }} />
          <Skeleton variant="text" width="40%" height={24} style={{ marginBottom: SPACING.md }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={80} style={{ marginBottom: SPACING.md }} />
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
            tintColor={ACCENT_COLORS[500]}
            colors={[ACCENT_COLORS[500]]}
          />
        }
      >
        {renderPeriodSelector()}
        {renderEarningsCard()}
        {renderTransactions()}
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
  periodSelector: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  periodButtonActive: {},
  periodButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  periodButtonTextActive: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  earningsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  earningsGradient: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  earningsLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  growthBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  growthText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  earningsValue: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    fontWeight: TYPOGRAPHY.h1.fontWeight as any,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  statItem: {
    flex: 1,
    gap: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  transactionCard: {
    padding: SPACING.md,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionEmoji: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
