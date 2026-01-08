// Wallet Screen - Specialist wallet and earnings (matching web version)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { walletService, WalletSummary, WalletTransaction } from '../../services/wallet.service';
import { specialistService } from '../../services/specialist.service';
import { referralService } from '../../services/referral.service';
import { format } from 'date-fns';

export const SpecialistWalletScreen: React.FC = () => {
  const { colors } = useTheme();
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
      
      const earnings = history.transactions.filter(t =>
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
      .filter(t => t.reason === 'REFERRAL_REWARD')
      .reduce((sum, t) => sum + t.amount, 0);

    const loyaltyEarnings = earningsTransactions
      .filter(t => t.reason === 'LOYALTY_POINTS_CONVERTED')
      .reduce((sum, t) => sum + t.amount, 0);

    const forfeitureEarnings = earningsTransactions
      .filter(t => t.reason === 'FORFEITURE_SPLIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEarnings = referralEarnings + loyaltyEarnings + forfeitureEarnings;

    return { totalEarnings, referralEarnings, loyaltyEarnings, forfeitureEarnings };
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
        return '#10B981';
      case 'DEBIT':
        return '#EF4444';
      case 'REFUND':
        return '#3B82F6';
      default:
        return colors.textSecondary;
    }
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
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 2,
      borderBottomColor: colors.border,
      marginBottom: 24,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      marginBottom: -2,
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
    },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    balanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 16,
    },
    balanceLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    balanceValue: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
    },
    balanceHidden: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.textSecondary,
      letterSpacing: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    earningsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    earningsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    earningsIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    transactionItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    transactionContent: {
      flex: 1,
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    transactionType: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    transactionDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    transactionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 40,
    },
  });

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const earnings = calculateEarnings();

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
          <Text style={styles.title}>Wallet & Earnings</Text>
          <Text style={styles.subtitle}>
            Manage your earnings and withdrawals
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'overview' && styles.tabTextActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'transactions' && styles.tabTextActive,
              ]}
            >
              Transactions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'earnings' && styles.tabActive]}
            onPress={() => setActiveTab('earnings')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'earnings' && styles.tabTextActive,
              ]}
            >
              Earnings
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' && summary && (
          <>
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                  <Text style={{ fontSize: 20 }}>
                    {showBalance ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {showBalance ? (
                <Text style={styles.balanceValue}>
                  {formatPrice(summary.balance)}
                </Text>
              ) : (
                <Text style={styles.balanceHidden}>••••••</Text>
              )}
              {summary.pendingBalance > 0 && (
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  Pending: {formatPrice(summary.pendingBalance)}
                </Text>
              )}
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatPrice(summary.totalEarned)}
                </Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatPrice(summary.totalWithdrawn || 0)}
                </Text>
                <Text style={styles.statLabel}>Total Withdrawn</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'transactions' && (
          <View>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>No transactions yet</Text>
            ) : (
              transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <Text style={styles.transactionIcon}>
                    {getTransactionIcon(transaction.type)}
                  </Text>
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.transactionType}>
                        {transaction.reason || transaction.type}
                      </Text>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: getTransactionColor(transaction.type) },
                        ]}
                      >
                        {transaction.type === 'CREDIT' ? '+' : '-'}
                        {formatPrice(Math.abs(transaction.amount))}
                      </Text>
                    </View>
                    <Text style={styles.transactionDate}>
                      {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                    </Text>
                    {transaction.description && (
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'earnings' && (
          <>
            <View style={styles.earningsGrid}>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsIcon}>💰</Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
                <Text style={styles.statValue}>
                  {formatPrice(earnings.totalEarnings)}
                </Text>
              </View>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsIcon}>👥</Text>
                <Text style={styles.statLabel}>Referral Earnings</Text>
                <Text style={styles.statValue}>
                  {formatPrice(earnings.referralEarnings)}
                </Text>
                {referralAnalytics && (
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {referralAnalytics.overview.completedReferrals} completed referrals
                  </Text>
                )}
              </View>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsIcon}>🎁</Text>
                <Text style={styles.statLabel}>Reward Earnings</Text>
                <Text style={styles.statValue}>
                  {formatPrice(earnings.loyaltyEarnings + earnings.forfeitureEarnings)}
                </Text>
              </View>
            </View>

            {earningsTransactions.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 12,
                  }}
                >
                  Recent Earnings
                </Text>
                {earningsTransactions.slice(0, 10).map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <Text style={styles.transactionIcon}>
                      {getTransactionIcon(transaction.type)}
                    </Text>
                    <View style={styles.transactionContent}>
                      <View style={styles.transactionHeader}>
                        <Text style={styles.transactionType}>
                          {transaction.reason || transaction.type}
                        </Text>
                        <Text
                          style={[
                            styles.transactionAmount,
                            { color: getTransactionColor(transaction.type) },
                          ]}
                        >
                          +{formatPrice(transaction.amount)}
                        </Text>
                      </View>
                      <Text style={styles.transactionDate}>
                        {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
