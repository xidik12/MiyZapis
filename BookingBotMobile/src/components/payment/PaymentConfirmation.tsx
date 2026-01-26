/**
 * PaymentConfirmation Component for React Native
 * Displays payment result (success or failure) with transaction details
 * Based on Panhaha design system
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRIMARY_COLORS,
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

type PaymentStatus = 'success' | 'failed' | 'pending';

interface PaymentConfirmationProps {
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
  paymentMethod?: string;
  timestamp?: string;
  errorMessage?: string;
  onDone?: () => void;
  onRetry?: () => void;
  formatPrice: (amount: number) => string;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  status,
  amount,
  transactionId,
  paymentMethod = 'Card',
  timestamp,
  errorMessage,
  onDone,
  onRetry,
  formatPrice,
}) => {
  const { colors, isDark } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: '✅',
          title: 'Payment Successful!',
          subtitle: 'Your payment has been processed successfully',
          color: SUCCESS_COLOR,
          bgColor: isDark ? SUCCESS_COLOR + '20' : SUCCESS_COLOR + '10',
        };
      case 'failed':
        return {
          icon: '❌',
          title: 'Payment Failed',
          subtitle: errorMessage || 'There was an issue processing your payment',
          color: ERROR_COLOR,
          bgColor: isDark ? ERROR_COLOR + '20' : ERROR_COLOR + '10',
        };
      case 'pending':
        return {
          icon: '⏳',
          title: 'Payment Pending',
          subtitle: 'Your payment is being processed',
          color: ACCENT_COLORS[500],
          bgColor: isDark ? ACCENT_COLORS[900] + '33' : ACCENT_COLORS[50],
        };
    }
  };

  const config = getStatusConfig();

  const formatDate = (dateString?: string): string => {
    if (!dateString) return new Date().toLocaleString();
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Status Card */}
      <Card style={[styles.statusCard, { backgroundColor: config.bgColor }]} borderVariant="none">
        <Text style={styles.statusIcon}>{config.icon}</Text>
        <Text style={[styles.statusTitle, { color: config.color }]}>
          {config.title}
        </Text>
        <Text style={[styles.statusSubtitle, { color: colors.text }]}>
          {config.subtitle}
        </Text>
      </Card>

      {/* Transaction Details */}
      {status !== 'failed' && (
        <Card style={styles.detailsCard} borderVariant="subtle">
          <Text style={[styles.detailsTitle, { color: colors.text }]}>
            Transaction Details
          </Text>

          <Divider spacing={SPACING.md} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Amount
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatPrice(amount)}
            </Text>
          </View>

          {transactionId && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Transaction ID
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                {transactionId}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Payment Method
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {paymentMethod}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Date & Time
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDate(timestamp)}
            </Text>
          </View>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {status === 'success' && onDone && (
          <Button variant="primary" size="lg" onPress={onDone}>
            Done
          </Button>
        )}

        {status === 'failed' && (
          <>
            {onRetry && (
              <Button variant="primary" size="lg" onPress={onRetry}>
                Try Again
              </Button>
            )}
            {onDone && (
              <Button variant="ghost" size="lg" onPress={onDone}>
                Cancel
              </Button>
            )}
          </>
        )}

        {status === 'pending' && onDone && (
          <Button variant="secondary" size="lg" onPress={onDone}>
            Close
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xl,
  },
  statusCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusIcon: {
    fontSize: 64,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  detailsCard: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  detailsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: SPACING.md,
  },
});

export default PaymentConfirmation;
