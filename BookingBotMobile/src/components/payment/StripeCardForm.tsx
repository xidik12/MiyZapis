/**
 * StripeCardForm Component for React Native
 * Card payment input using Stripe's CardField
 * Based on Panhaha design system
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRIMARY_COLORS,
  SUCCESS_COLOR,
  ERROR_COLOR,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
} from '../../utils/design';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface StripeCardFormProps {
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  amount: number;
  currency?: string;
  disabled?: boolean;
  formatPrice: (amount: number) => string;
}

export const StripeCardForm: React.FC<StripeCardFormProps> = ({
  onPaymentSuccess,
  onPaymentError,
  amount,
  currency = 'USD',
  disabled = false,
  formatPrice,
}) => {
  const { colors, isDark } = useTheme();
  const { confirmPayment } = useStripe();

  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please enter complete card details');
      return;
    }

    try {
      setProcessing(true);

      // In a real implementation, you would:
      // 1. Create a payment intent on your backend
      // 2. Get the client secret
      // 3. Confirm the payment with Stripe

      // Example (simplified):
      // const response = await fetch('/api/create-payment-intent', {
      //   method: 'POST',
      //   body: JSON.stringify({ amount, currency }),
      // });
      // const { clientSecret } = await response.json();

      // const { error, paymentIntent } = await confirmPayment(clientSecret, {
      //   paymentMethodType: 'Card',
      // });

      // if (error) {
      //   onPaymentError(error.message);
      // } else if (paymentIntent) {
      //   onPaymentSuccess(paymentIntent.id);
      // }

      // For demo purposes (this would be replaced with actual Stripe integration):
      setTimeout(() => {
        onPaymentSuccess('demo_payment_intent_id');
        setProcessing(false);
      }, 2000);

    } catch (error: any) {
      onPaymentError(error.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card} borderVariant="subtle">
        <Text style={[styles.title, { color: colors.text }]}>
          Card Details
        </Text>

        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242',
            expiration: 'MM/YY',
            cvc: 'CVC',
            postalCode: 'ZIP',
          }}
          cardStyle={{
            backgroundColor: colors.surface,
            textColor: colors.text,
            placeholderColor: colors.textSecondary,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: BORDER_RADIUS.md,
          }}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
          disabled={disabled || processing}
        />

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your payment information is encrypted and secure
          </Text>
        </View>
      </Card>

      {/* Payment Summary */}
      <Card style={styles.summaryCard} borderVariant="accent">
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.text }]}>
            Total Amount
          </Text>
          <Text style={[styles.summaryAmount, { color: PRIMARY_COLORS[500] }]}>
            {formatPrice(amount)}
          </Text>
        </View>
      </Card>

      {/* Pay Button */}
      <Button
        variant="primary"
        size="lg"
        onPress={handlePayment}
        disabled={!cardComplete || disabled || processing}
        loading={processing}
      >
        {processing ? 'Processing...' : `Pay ${formatPrice(amount)}`}
      </Button>

      {/* Test Card Info (for development) */}
      {__DEV__ && (
        <View style={[styles.testInfo, { backgroundColor: isDark ? SUCCESS_COLOR + '20' : SUCCESS_COLOR + '10' }]}>
          <Text style={[styles.testInfoText, { color: SUCCESS_COLOR }]}>
            Test card: 4242 4242 4242 4242 | Any future date | Any CVC
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  card: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  cardField: {
    height: 50,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  lockIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: FONT_SIZES.xs,
    flex: 1,
  },
  summaryCard: {
    padding: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
  },
  summaryAmount: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
  },
  testInfo: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  testInfoText: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
});

export default StripeCardForm;
