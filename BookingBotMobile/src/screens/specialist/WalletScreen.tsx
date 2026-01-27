/**
 * SpecialistWalletScreen - Redesigned with Panhaha design system
 * Wallet and earnings management with transaction history
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { walletService, WalletSummary, WalletTransaction } from '../../services/wallet.service';
import { referralService } from '../../services/referral.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  ACCENT_COLORS,
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  SUCCESS_COLOR,
  ERROR_COLOR,
  INFO_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';
import { format } from 'date-fns';

export const SpecialistWalletScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'earnings'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [earningsTransactions, setEarningsTransactions] = useState<WalletTransaction[]>([]);
  const [referralAnalytics, setReferralAnalytics] = useState<any>(null);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    } else if (activeTab === 'earnings') {
      loadEarningsData();
    }
  }, [activeTab]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const walletSummary = await walletService.getWalletSummary();
      setSummary(walletSummary);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const history = await walletService.getTransactionHistory({ limit: 50 });
      setTransactions(history.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadEarningsData = async () => {
    try {
      const [history, analytics] = await Promise.all([
        walletService.getTransactionHistory({ limit: 100 }),
        referralService.getAnalytics().catch(() => null),
      ]);

      const earnings = history.transactions.filter((t) =>
        t.type === 'CREDIT' &&
        ['REFERRAL_REWARD', 'LOYALTY_POINTS_CONVERTED', 'FORFEITURE_SPLIT'].includes(t.reason)
      );

      setEarningsTransactions(earnings);
      setReferralAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load earnings data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    if (activeTab === 'transactions') {
      await loadTransactions();
    } else if (activeTab === 'earnings') {
      await loadEarningsData();
    }
    setRefreshing(false);
  };

  const calculateEarnings = () => {
    const referralEarnings = earningsTransactions
      .filter((t) => t.reason === 'REFERRAL_REWARD')
      .reduce((sum, t) => sum + t.amount, 0);

    const loyaltyEarnings = earningsTransactions
      .filter((t) => t.reason === 'LOYALTY_POINTS_CONVERTED')
      .reduce((sum, t) => sum + t.amount, 0);

    const forfeitureEarnings = earningsTransactions
      .filter((t) => t.reason === 'FORFEITURE_SPLIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEarnings = referralEarnings + loyaltyEarnings + forfeitureEarnings;

    return { totalEarnings, referralEarnings, loyaltyEarnings, forfeitureEarnings };
  };

  const getTransactionIcon = (type: WalletTransaction['type']): string => {
    switch (type) {
      case 'CREDIT':
        return '⬆️';
      case 'DEBIT':
        return '⬇️';
      case 'REFUND':
        return '↩️';
      default:
        return '💰';
    }
  };

  const getTransactionColor = (type: WalletTransaction['type']): string => {
    switch (type) {
      case 'CREDIT':
        return SUCCESS_COLOR;
      case 'DEBIT':
        return ERROR_COLOR;
      case 'REFUND':
        return INFO_COLOR;
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
          <View style={[styles.orb, styles.orb2, { backgroundColor: SECONDARY_COLORS[500] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>💰</Text>
          <Text style={styles.heroTitle}>{t('wallet.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('wallet.specialistSubtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
        onPress={() => setActiveTab('overview')}
      >
        <Text
          style={[
            styles.tabText,
            { color: colors.textSecondary },
            activeTab === 'overview' && [styles.tabTextActive, { color: ACCENT_COLORS[600] }],
          ]}
        >
          {t('wallet.overview')}
        </Text>
        {activeTab === 'overview' && (
          <View style={[styles.tabIndicator, { backgroundColor: ACCENT_COLORS[600] }]} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
        onPress={() => setActiveTab('transactions')}
      >
        <Text
          style={[
            styles.tabText,
            { color: colors.textSecondary },
            activeTab === 'transactions' && [styles.tabTextActive, { color: ACCENT_COLORS[600] }],
          ]}
        >
          {t('wallet.transactions')}
        </Text>
        {activeTab === 'transactions' && (
          <View style={[styles.tabIndicator, { backgroundColor: ACCENT_COLORS[600] }]} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'earnings' && styles.tabActive]}
        onPress={() => setActiveTab('earnings')}
      >
        <Text
          style={[
            styles.tabText,
            { color: colors.textSecondary },
            activeTab === 'earnings' && [styles.tabTextActive, { color: ACCENT_COLORS[600] }],
          ]}
        >
          {t('wallet.earnings')}
        </Text>
        {activeTab === 'earnings' && (
          <View style={[styles.tabIndicator, { backgroundColor: ACCENT_COLORS[600] }]} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderBalanceCard = () => {
    if (!summary) return null;

    return (
      <Card style={styles.balanceCard} borderVariant="accent" elevation="lg">
        <LinearGradient
          colors={
            isDark
              ? [ACCENT_COLORS[900] + '40', ACCENT_COLORS[800] + '20']
              : [ACCENT_COLORS[50], ACCENT_COLORS[100]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceGradient}
        >
          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              {t('wallet.availableBalance')}
            </Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Text style={styles.toggleBalanceIcon}>{showBalance ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {showBalance ? (
            <Text style={[styles.balanceValue, { color: ACCENT_COLORS[700] }]}>
              {formatPrice(summary.balance)}
            </Text>
          ) : (
            <Text style={[styles.balanceHidden, { color: colors.textSecondary }]}>••••••</Text>
          )}

          {summary.pendingBalance > 0 && (
            <View style={styles.pendingBalance}>
              <Text style={[styles.pendingLabel, { color: colors.textSecondary }]}>
                {t('wallet.pending')}: {formatPrice(summary.pendingBalance)}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Card>
    );
  };

  const renderStatsGrid = () => {
    if (!summary) return null;

    return (
      <View style={styles.statsGrid}>
        <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
          <LinearGradient
            colors={
              isDark
                ? [SUCCESS_COLOR + '20', SUCCESS_COLOR + '10']
                : [SUCCESS_COLOR + '10', SUCCESS_COLOR + '05']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <Text style={[styles.statValue, { color: SUCCESS_COLOR }]}>
              {formatPrice(summary.totalEarned)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('wallet.totalEarned')}
            </Text>
          </LinearGradient>
        </Card>

        <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
          <LinearGradient
            colors={
              isDark
                ? [INFO_COLOR + '20', INFO_COLOR + '10']
                : [INFO_COLOR + '10', INFO_COLOR + '05']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <Text style={[styles.statValue, { color: INFO_COLOR }]}>
              {formatPrice(summary.totalWithdrawn || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('wallet.totalWithdrawn')}
            </Text>
          </LinearGradient>
        </Card>
      </View>
    );
  };

  const renderEarningsGrid = () => {
    const earnings = calculateEarnings();

    return (
      <View style={styles.earningsGrid}>
        <Card style={styles.earningCard} borderVariant="subtle" elevation="sm">
          <Text style={styles.earningIcon}>💰</Text>
          <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>
            {t('wallet.totalEarnings')}
          </Text>
          <Text style={[styles.earningValue, { color: ACCENT_COLORS[700] }]}>
            {formatPrice(earnings.totalEarnings)}
          </Text>
        </Card>

        <Card style={styles.earningCard} borderVariant="subtle" elevation="sm">
          <Text style={styles.earningIcon}>👥</Text>
          <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>
            {t('wallet.referralEarnings')}
          </Text>
          <Text style={[styles.earningValue, { color: SUCCESS_COLOR }]}>
            {formatPrice(earnings.referralEarnings)}
          </Text>
          {referralAnalytics && (
            <Text style={[styles.earningSubtext, { color: colors.textSecondary }]}>
              {referralAnalytics.overview.completedReferrals} {t('wallet.completedReferrals')}
            </Text>
          )}
        </Card>

        <Card style={styles.earningCard} borderVariant="subtle" elevation="sm">
          <Text style={styles.earningIcon}>🎁</Text>
          <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>
            {t('wallet.rewardEarnings')}
          </Text>
          <Text style={[styles.earningValue, { color: PRIMARY_COLORS[600] }]}>
            {formatPrice(earnings.loyaltyEarnings + earnings.forfeitureEarnings)}
          </Text>
        </Card>
      </View>
    );
  };

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => (
    <Card style={styles.transactionCard} borderVariant="subtle" elevation="sm">
      <View style={styles.transactionContent}>
        <Text style={styles.transactionIcon}>{getTransactionIcon(item.type)}</Text>

        <View style={styles.transactionInfo}>
          <View style={styles.transactionHeader}>
            <Text style={[styles.transactionType, { color: colors.text }]} numberOfLines={1}>
              {item.reason || item.type}
            </Text>
            <Text
              style={[
                styles.transactionAmount,
                { color: getTransactionColor(item.type) },
              ]}
            >
              {item.type === 'CREDIT' ? '+' : '-'}
              {formatPrice(Math.abs(item.amount))}
            </Text>
          </View>

          <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
            {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
          </Text>

          {item.description && (
            <Text style={[styles.transactionDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );

  const renderOverviewTab = () => (
    <>
      {renderBalanceCard()}
      {renderStatsGrid()}
    </>
  );

  const renderTransactionsTab = () => (
    <>
      {transactions.length === 0 ? (
        <EmptyState
          emoji="📝"
          title={t('wallet.noTransactions')}
          description={t('wallet.noTransactionsDesc')}
        />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        />
      )}
    </>
  );

  const renderEarningsTab = () => (
    <>
      {renderEarningsGrid()}

      {earningsTransactions.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('wallet.recentEarnings')}
          </Text>
          <FlatList
            data={earningsTransactions.slice(0, 10)}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          />
        </>
      )}

      {earningsTransactions.length === 0 && (
        <EmptyState
          emoji="💰"
          title={t('wallet.noEarnings')}
          description={t('wallet.noEarningsDesc')}
        />
      )}
    </>
  );

  if (loading && !summary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <View style={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={50} style={{ marginBottom: SPACING.lg }} />
          <Skeleton variant="rectangular" width="100%" height={180} style={{ marginBottom: SPACING.lg }} />
          <View style={styles.statsGrid}>
            <Skeleton variant="rectangular" width="48%" height={100} />
            <Skeleton variant="rectangular" width="48%" height={100} />
          </View>
        </View>
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
        {renderTabs()}

        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'transactions' && renderTransactionsTab()}
        {activeTab === 'earnings' && renderEarningsTab()}
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
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  tabTextActive: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  balanceCard: {
    marginBottom: SPACING.lg,
  },
  balanceGradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  toggleBalanceIcon: {
    fontSize: 20,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  balanceHidden: {
    fontSize: 48,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 4,
  },
  pendingBalance: {
    marginTop: SPACING.sm,
  },
  pendingLabel: {
    fontSize: FONT_SIZES.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
  },
  statGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
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
  earningsGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  earningCard: {
    padding: SPACING.md,
  },
  earningIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  earningLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  earningValue: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
  },
  earningSubtext: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  transactionCard: {
    padding: SPACING.md,
  },
  transactionContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  transactionIcon: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.sm,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.sm,
  },
});
