/**
 * PaymentMethodSelector Component for React Native
 * Allows users to select payment method (card, bank, wallet, etc.)
 * Based on Panhaha design system
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
} from '../../utils/design';
import { Card } from '../ui/Card';

type PaymentMethod = 'card' | 'bank' | 'wallet' | 'cash';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  availableMethods?: PaymentMethod[];
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: '💳',
    description: 'Visa, Mastercard, Amex',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: '🏦',
    description: 'Direct bank transfer',
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    icon: '💰',
    description: 'Apple Pay, Google Pay',
  },
  {
    id: 'cash',
    name: 'Cash',
    icon: '💵',
    description: 'Pay on delivery',
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  availableMethods = ['card', 'bank', 'wallet', 'cash'],
}) => {
  const { colors, isDark } = useTheme();

  const filteredMethods = PAYMENT_METHODS.filter((method) =>
    availableMethods.includes(method.id)
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Select Payment Method
      </Text>

      <View style={styles.methodsList}>
        {filteredMethods.map((method) => {
          const isSelected = selectedMethod === method.id;

          return (
            <TouchableOpacity
              key={method.id}
              onPress={() => onSelectMethod(method.id)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.methodCard,
                  isSelected && {
                    borderColor: PRIMARY_COLORS[500],
                    borderWidth: 2,
                  },
                ]}
                borderVariant={isSelected ? 'none' : 'subtle'}
              >
                <View style={styles.methodContent}>
                  <View style={styles.methodLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: isSelected
                            ? PRIMARY_COLORS[500] + '20'
                            : (isDark ? colors.surface : colors.border),
                        },
                      ]}
                    >
                      <Text style={styles.icon}>{method.icon}</Text>
                    </View>
                    <View style={styles.methodInfo}>
                      <Text
                        style={[
                          styles.methodName,
                          {
                            color: colors.text,
                            fontWeight: isSelected
                              ? FONT_WEIGHTS.semibold
                              : FONT_WEIGHTS.medium,
                          },
                        ]}
                      >
                        {method.name}
                      </Text>
                      <Text
                        style={[
                          styles.methodDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {method.description}
                      </Text>
                    </View>
                  </View>

                  {/* Selection Indicator */}
                  <View
                    style={[
                      styles.selectionIndicator,
                      {
                        borderColor: isSelected ? PRIMARY_COLORS[500] : colors.border,
                        backgroundColor: isSelected ? PRIMARY_COLORS[500] : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  methodsList: {
    gap: SPACING.md,
  },
  methodCard: {
    padding: SPACING.lg,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  methodName: {
    fontSize: FONT_SIZES.base,
  },
  methodDescription: {
    fontSize: FONT_SIZES.sm,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

export default PaymentMethodSelector;
