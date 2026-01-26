/**
 * WalletScreen - Redesigned with Panhaha design system
 * Customer wallet management with balance overview, statistics, and transaction history
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { walletService, WalletSummary, WalletTransaction } from '../../services/wallet.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
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
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';
import { format } from 'date-fns';

export const CustomerWalletScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const walletSummary = await walletService.getWalletSummary();
      setSummary(walletSummary);
      // Load recent transactions for overview tab
      const history = await walletService.getTransactionHistory({ limit: 5 });
      setTransactions(history.transactions || []);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    if (activeTab === 'transactions') {
      await loadTransactions();
    }
    setRefreshing(false);
  };

  const getTransactionIcon = (type: WalletTransaction['type']) => {
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

  const getTransactionColor = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'CREDIT':
        return SUCCESS_COLOR;
      case 'DEBIT':
        return ERROR_COLOR;
      case 'REFUND':
        return SECONDARY_COLORS[500];
      default:
        return colors.textSecondary;
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'secondary';
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
          <Text style={styles.heroTitle}>{t('wallet.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('wallet.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'overview' && [styles.tabActive, { borderBottomColor: ACCENT_COLORS[500] }],
        ]}
        onPress={() => setActiveTab('overview')}
      >
        <Text
          style={[
            styles.tabText,
            { color: colors.textSecondary },
            activeTab === 'overview' && [styles.tabTextActive, { color: ACCENT_COLORS[500] }],
          ]}
        >
          {t('wallet.overview')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'transactions' && [styles.tabActive, { borderBottomColor: ACCENT_COLORS[500] }],
        ]}
        onPress={() => setActiveTab('transactions')}
      >
        <Text
          style={[
            styles.tabText,
            { color: colors.textSecondary },
            activeTab === 'transactions' && [styles.tabTextActive, { color: ACCENT_COLORS[500] }],
          ]}
        >
          {t('wallet.transactions')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBalanceCard = () => {
    if (!summary) return null;

    return (
      <Card style={styles.balanceCard} borderVariant="accent" elevation="md">
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
              <Text style={styles.balanceToggle}>{showBalance ? '👁️' : '👁️‍🗨️'}</Text>
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
            <Text style={[styles.pendingBalance, { color: colors.textSecondary }]}>
              {t('wallet.pending')}: {formatPrice(summary.pendingBalance)}
            </Text>
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
          <Text style={styles.statIcon}>💵</Text>
          <Text style={[styles.statValue, { color: SUCCESS_COLOR }]}>
            {formatPrice(summary.totalEarned)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('wallet.totalEarned')}
          </Text>
        </Card>
        <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
          <Text style={styles.statIcon}>💸</Text>
          <Text style={[styles.statValue, { color: ERROR_COLOR }]}>
            {formatPrice(summary.totalSpent)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('wallet.totalSpent')}
          </Text>
        </Card>
      </View>
    );
  };

  const renderActionsGrid = () => (
    <View style={styles.actionsGrid}>
      <TouchableOpacity>
        <Card style={styles.actionCard} borderVariant="subtle">
          <Text style={styles.actionIcon}>💳</Text>
          <Text style={[styles.actionText, { color: colors.text }]}>
            {t('wallet.addFunds')}
          </Text>
        </Card>
      </TouchableOpacity>
      <TouchableOpacity>
        <Card style={styles.actionCard} borderVariant="subtle">
          <Text style={styles.actionIcon}>🎁</Text>
          <Text style={[styles.actionText, { color: colors.text }]}>
            {t('wallet.redeem')}
          </Text>
        </Card>
      </TouchableOpacity>
    </View>
  );

  const renderTransactionCard = ({ item }: { item: WalletTransaction }) => (
    <Card style={styles.transactionCard} borderVariant="subtle" elevation="sm">
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIconContainer}>
          <Text style={styles.transactionIcon}>{getTransactionIcon(item.type)}</Text>
        </View>
        <View style={styles.transactionContent}>
          <View style={styles.transactionRow}>
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
            <Text style={[styles.transactionDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          )}
          <View style={styles.transactionFooter}>
            <Text style={[styles.balanceAfter, { color: colors.textSecondary }]}>
              {t('wallet.balance')}: {formatPrice(item.balanceAfter)}
            </Text>
            <Badge
              label={item.status}
              variant={getStatusBadgeVariant(item.status)}
              size="sm"
            />
          </View>
        </View>
      </View>
    </Card>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {renderBalanceCard()}
      {renderStatsGrid()}
      {renderActionsGrid()}

      {transactions.length > 0 && (
        <>
          <Divider spacing={SPACING.lg} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('wallet.recentActivity')}
          </Text>
          {transactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id}>
              {renderTransactionCard({ item: transaction })}
            </View>
          ))}
          <Button
            variant="outline"
            size="lg"
            onPress={() => setActiveTab('transactions')}
            style={styles.viewAllButton}
          >
            {t('wallet.viewAllTransactions')}
          </Button>
        </>
      )}
    </View>
  );

  const renderTransactionsTab = () => (
    <View style={styles.tabContent}>
      {transactions.length === 0 ? (
        <EmptyState
          emoji="💰"
          title={t('wallet.noTransactions')}
          description={t('wallet.noTransactionsDesc')}
          actionLabel={t('wallet.addFunds')}
          onAction={() => {
            // Navigate to add funds
          }}
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

  if (loading && !summary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        {renderTabBar()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={180} style={{ marginBottom: SPACING.lg }} />
          <View style={styles.statsGrid}>
            <Skeleton variant="rectangular" width="48%" height={100} />
            <Skeleton variant="rectangular" width="48%" height={100} />
          </View>
          <View style={styles.actionsGrid}>
            <Skeleton variant="rectangular" width="48%" height={80} />
            <Skeleton variant="rectangular" width="48%" height={80} />
          </View>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={100} style={{ marginBottom: SPACING.md }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      {renderTabBar()}
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
        {activeTab === 'overview' ? renderOverviewTab() : renderTransactionsTab()}
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  tabTextActive: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  tabContent: {
    gap: SPACING.lg,
  },
  balanceCard: {
    overflow: 'hidden',
  },
  balanceGradient: {
    padding: SPACING.xl,
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
  balanceToggle: {
    fontSize: 24,
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
    fontSize: FONT_SIZES.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  transactionCard: {
    padding: SPACING.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionType: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    marginRight: SPACING.sm,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  balanceAfter: {
    fontSize: FONT_SIZES.xs,
  },
  viewAllButton: {
    marginTop: SPACING.md,
  },
});
