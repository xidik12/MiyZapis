/**
 * WalletTransactionHistory Component for React Native
 * Displays list of wallet transactions with type indicators
 * Based on web WalletTransactionHistory with Panhaha design system
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
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
} from '../../utils/design';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Divider } from '../ui/Divider';

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'FORFEITURE_SPLIT';
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

interface WalletTransactionHistoryProps {
  transactions: WalletTransaction[];
  loading?: boolean;
  onLoadMore?: () => void;
  formatPrice: (amount: number) => string;
}

export const WalletTransactionHistory: React.FC<WalletTransactionHistoryProps> = ({
  transactions,
  loading = false,
  onLoadMore,
  formatPrice,
}) => {
  const { colors, isDark } = useTheme();

  const getTransactionIcon = (type: WalletTransaction['type']): string => {
    switch (type) {
      case 'CREDIT':
        return '⬆️';
      case 'DEBIT':
        return '⬇️';
      case 'REFUND':
        return '↩️';
      case 'FORFEITURE_SPLIT':
        return '💰';
      default:
        return '💳';
    }
  };

  const getTransactionColor = (type: WalletTransaction['type']): string => {
    switch (type) {
      case 'CREDIT':
        return SUCCESS_COLOR;
      case 'DEBIT':
        return ERROR_COLOR;
      case 'REFUND':
        return SECONDARY_COLORS[500];
      case 'FORFEITURE_SPLIT':
        return ACCENT_COLORS[500];
      default:
        return colors.textSecondary;
    }
  };

  const formatTransactionType = (type: WalletTransaction['type']): string => {
    switch (type) {
      case 'CREDIT':
        return 'Received';
      case 'DEBIT':
        return 'Spent';
      case 'REFUND':
        return 'Refund';
      case 'FORFEITURE_SPLIT':
        return 'Bonus';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const transactionColor = getTransactionColor(item.type);
    const isCredit = item.type === 'CREDIT' || item.type === 'REFUND' || item.type === 'FORFEITURE_SPLIT';

    return (
      <View>
        <View style={styles.transactionItem}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: transactionColor + '20' },
            ]}
          >
            <Text style={styles.icon}>{getTransactionIcon(item.type)}</Text>
          </View>

          {/* Details */}
          <View style={styles.transactionDetails}>
            <Text style={[styles.transactionReason, { color: colors.text }]}>
              {item.reason}
            </Text>
            <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
              {formatDate(item.createdAt)} • {formatTransactionType(item.type)}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amount,
                { color: isCredit ? SUCCESS_COLOR : ERROR_COLOR },
              ]}
            >
              {isCredit ? '+' : '-'}{formatPrice(Math.abs(item.amount))}
            </Text>
            <Text style={[styles.balanceAfter, { color: colors.textSecondary }]}>
              {formatPrice(item.balanceAfter)}
            </Text>
          </View>
        </View>
        <Divider spacing={0} />
      </View>
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <Card style={styles.card} elevation="md">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLORS[500]} />
        </View>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card style={styles.card} elevation="md">
        <EmptyState
          emoji="💸"
          title="No transactions yet"
          description="Your transaction history will appear here"
        />
      </Card>
    );
  }

  return (
    <Card style={styles.card} elevation="md">
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Transaction History ({transactions.length})
        </Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Disable scroll if inside another ScrollView
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  transactionReason: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: SPACING.xs / 2,
  },
  amount: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
  },
  balanceAfter: {
    fontSize: FONT_SIZES.xs,
  },
});

export default WalletTransactionHistory;
