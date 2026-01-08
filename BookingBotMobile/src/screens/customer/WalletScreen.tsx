// Wallet Screen - Customer wallet management (matching web version)
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
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';

export const CustomerWalletScreen: React.FC = () => {
  const { colors } = useTheme();
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
    actionsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
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
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>
            Manage your balance and view transaction history
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
                  {formatPrice(summary.totalSpent)}
                </Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>💳</Text>
                <Text style={styles.actionText}>Add Funds</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>🎁</Text>
                <Text style={styles.actionText}>Redeem</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Transactions Preview */}
            {transactions.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 12,
                  }}
                >
                  Recent Activity
                </Text>
                {transactions.slice(0, 5).map((transaction) => (
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
                    </View>
                  </View>
                ))}
                <Button
                  variant="secondary"
                  onPress={() => setActiveTab('transactions')}
                  style={{ marginTop: 12 }}
                >
                  View All Transactions
                </Button>
              </View>
            )}
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
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        Balance: {formatPrice(transaction.balanceAfter)}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor:
                            transaction.status === 'COMPLETED'
                              ? '#10B981'
                              : transaction.status === 'PENDING'
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: '#FFF',
                            fontWeight: '600',
                          }}
                        >
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
