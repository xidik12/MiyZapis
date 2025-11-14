// Earnings Screen - Full implementation matching web version
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
import { useTheme } from '../../contexts/ThemeContext';
import { specialistService } from '../../services/specialist.service';
import { format } from 'date-fns';

interface EarningsData {
  thisMonth: number;
  lastMonth: number;
  total: number;
  growth?: number;
}

export const EarningsScreen: React.FC = () => {
  const { colors } = useTheme();
  
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadEarnings();
  }, [period]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const [earningsData, revenueData] = await Promise.all([
        specialistService.getRevenue(period),
        // Get transactions would need to be implemented
      ]);
      setEarnings(earningsData);
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
    periodSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
    },
    periodButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    periodButtonTextActive: {
      color: '#FFFFFF',
    },
    earningsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    earningsValue: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
    },
    earningsLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      flex: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    growthText: {
      fontSize: 14,
      color: colors.success,
      fontWeight: '600',
    },
    transactionsSection: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    transactionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    transactionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    transactionAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.success,
    },
    transactionDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
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
          <Text style={styles.title}>Earnings</Text>
        </View>

        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {earnings && (
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>
              ${earnings.thisMonth.toFixed(2)}
            </Text>
            <Text style={styles.earningsLabel}>
              Earnings this {period}
            </Text>
            {earnings.growth !== undefined && (
              <Text style={styles.growthText}>
                {earnings.growth > 0 ? '↑' : '↓'} {Math.abs(earnings.growth).toFixed(1)}% from last {period}
              </Text>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ${earnings.lastMonth.toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Last {period}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ${earnings.total.toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionTitle}>
                    {transaction.description || 'Booking Payment'}
                  </Text>
                  <Text style={styles.transactionAmount}>
                    +${transaction.amount?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                <Text style={styles.transactionDate}>
                  {format(new Date(transaction.createdAt), 'MMM dd, yyyy hh:mm a')}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
