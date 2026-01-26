/**
 * WalletBalance Component for React Native
 * Displays wallet balance, total credits/debits, and summary stats
 * Based on web WalletBalance with Panhaha design system
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  SUCCESS_COLOR,
  ERROR_COLOR,
  ACCENT_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
} from '../../utils/design';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Divider } from '../ui/Divider';

interface WalletSummary {
  balance: number;
  totalCredits: number;
  totalDebits: number;
  pendingTransactions: number;
  lastTransactionAt?: string;
}

interface WalletBalanceProps {
  summary: WalletSummary | null;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onViewTransactions?: () => void;
  formatPrice: (amount: number) => string;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
  summary,
  loading = false,
  refreshing = false,
  onRefresh,
  onViewTransactions,
  formatPrice,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [showBalance, setShowBalance] = useState(true);

  if (loading) {
    return (
      <Card style={styles.card} elevation="md">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLORS[500]} />
        </View>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card style={styles.card} elevation="md">
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('wallet.loadEmpty')}
          </Text>
        </View>
      </Card>
    );
  }

  const netFlow = summary.totalCredits - summary.totalDebits;
  const isPositiveFlow = netFlow >= 0;

  return (
    <Card style={styles.card} elevation="md">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.walletIcon}>💰</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('wallet.balanceTitle')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowBalance(!showBalance)}
            style={[styles.iconButton, { backgroundColor: isDark ? colors.surface : colors.border }]}
          >
            <Text style={styles.icon}>{showBalance ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={refreshing}
            style={[styles.iconButton, { backgroundColor: isDark ? colors.surface : colors.border }]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.icon}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Balance */}
      <View style={styles.mainBalance}>
        <Text style={[styles.balanceAmount, { color: colors.text }]}>
          {showBalance ? formatPrice(summary.balance) : '•••••'}
        </Text>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          {t('wallet.availableBalance')}
        </Text>
      </View>

      {/* Net Flow Indicator */}
      {(summary.totalCredits > 0 || summary.totalDebits > 0) && (
        <View style={styles.flowIndicator}>
          <Text style={styles.flowIcon}>
            {isPositiveFlow ? '📈' : '📉'}
          </Text>
          <Text
            style={[
              styles.flowText,
              { color: isPositiveFlow ? SUCCESS_COLOR : ERROR_COLOR },
            ]}
          >
            {isPositiveFlow ? '+' : ''}{formatPrice(netFlow)} {t('wallet.netFlow')}
          </Text>
        </View>
      )}

      {/* Divider */}
      <Divider spacing={SPACING.md} />

      {/* Summary Stats */}
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: SUCCESS_COLOR }]}>
            {showBalance ? formatPrice(summary.totalCredits) : '•••••'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('wallet.totalReceived')}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: ERROR_COLOR }]}>
            {showBalance ? formatPrice(summary.totalDebits) : '•••••'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('wallet.totalSpent')}
          </Text>
        </View>
      </View>

      {/* Pending Transactions */}
      {summary.pendingTransactions > 0 && (
        <View
          style={[
            styles.pendingBanner,
            { backgroundColor: isDark ? ACCENT_COLORS[900] + '33' : ACCENT_COLORS[50] },
          ]}
        >
          <Text
            style={[
              styles.pendingText,
              { color: isDark ? ACCENT_COLORS[300] : ACCENT_COLORS[800] },
            ]}
          >
            {summary.pendingTransactions === 1
              ? t('wallet.pendingTransactionSingle').replace('{count}', String(summary.pendingTransactions))
              : t('wallet.pendingTransactionMultiple').replace('{count}', String(summary.pendingTransactions))}
          </Text>
        </View>
      )}

      {/* Last Transaction */}
      {summary.lastTransactionAt && (
        <Text style={[styles.lastTransaction, { color: colors.textSecondary }]}>
          {t('wallet.lastTransaction')
            .replace('{date}', new Date(summary.lastTransactionAt).toLocaleDateString())}
        </Text>
      )}

      {/* View Transactions Button */}
      {onViewTransactions && (
        <Button
          variant="secondary"
          size="md"
          onPress={onViewTransactions}
          style={styles.viewButton}
        >
          {t('wallet.viewHistory')}
        </Button>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  walletIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
  },
  mainBalance: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  balanceAmount: {
    fontSize: TYPOGRAPHY.displaySm.fontSize,
    fontWeight: TYPOGRAPHY.displaySm.fontWeight,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  flowIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  flowIcon: {
    fontSize: 16,
  },
  flowText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  summaryStats: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statValue: {
    fontSize: TYPOGRAPHY.h4.fontSize,
    fontWeight: TYPOGRAPHY.h4.fontWeight,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  pendingBanner: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  pendingText: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  lastTransaction: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  viewButton: {
    marginTop: SPACING.md,
  },
});

export default WalletBalance;
