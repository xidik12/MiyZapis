/**
 * PasswordStrengthIndicator component matching web design
 * Adapted for React Native
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  checkPasswordRequirements,
  getPasswordStrengthProgress,
  getPasswordStrengthColor,
} from '../../utils/passwordValidation';
import { FONT_SIZES, FONT_WEIGHTS } from '../../utils/design';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  style?: any;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  style,
}) => {
  const { colors } = useTheme();
  const requirements = checkPasswordRequirements(password);
  const progress = getPasswordStrengthProgress(password);

  if (!password) return null;

  const strengthText = progress < 50 ? 'Weak' : progress < 83 ? 'Medium' : 'Strong';
  const strengthColor = getPasswordStrengthColor(progress);
  const progressBarColor = strengthColor;

  const requirementsList = [
    { key: 'minLength', label: 'At least 8 characters', met: requirements.minLength },
    { key: 'hasUppercase', label: 'One uppercase letter (A-Z)', met: requirements.hasUppercase },
    { key: 'hasLowercase', label: 'One lowercase letter (a-z)', met: requirements.hasLowercase },
    { key: 'hasNumber', label: 'One number (0-9)', met: requirements.hasNumber },
    { key: 'hasSymbol', label: 'One symbol (!@#$%^&*)', met: requirements.hasSymbol },
    { key: 'isEnglishOnly', label: 'English characters only', met: requirements.isEnglishOnly },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Strength indicator */}
      <View style={styles.strengthContainer}>
        <View style={styles.strengthHeader}>
          <Text style={[styles.strengthLabel, { color: colors.text }]}>
            Password Strength
          </Text>
          <Text style={[styles.strengthText, { color: strengthColor }]}>
            {strengthText}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: progressBarColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Requirements checklist */}
      {showRequirements && (
        <View style={styles.requirementsContainer}>
          <Text style={[styles.requirementsLabel, { color: colors.text }]}>
            Password Requirements:
          </Text>
          <View style={styles.requirementsList}>
            {requirementsList.map((req) => (
              <View key={req.key} style={styles.requirementItem}>
                <Text style={[styles.checkmark, { color: req.met ? '#16A34A' : colors.textSecondary }]}>
                  {req.met ? '✓' : '○'}
                </Text>
                <Text
                  style={[
                    styles.requirementText,
                    {
                      color: req.met ? '#16A34A' : colors.textSecondary,
                    },
                  ]}
                >
                  {req.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  strengthContainer: {
    gap: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  strengthText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  requirementsContainer: {
    gap: 8,
  },
  requirementsLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  requirementsList: {
    gap: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontSize: 16,
    width: 16,
  },
  requirementText: {
    fontSize: FONT_SIZES.xs,
    flex: 1,
  },
});

export default PasswordStrengthIndicator;

