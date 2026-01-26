/**
 * RegisterScreen - Redesigned with Panhaha design system
 * Matches web version with gradient hero, glassmorphism, and full i18n
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register as registerUser, selectIsAuthenticated, selectAuthError, selectIsLoading, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { RegisterRequest, UserType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  userType: 'CUSTOMER' | 'SPECIALIST' | 'BUSINESS';
  agreeToTerms: boolean;
}

export const RegisterScreen: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectIsLoading);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      userType: 'CUSTOMER' as UserType,
      agreeToTerms: false,
    },
  });

  const watchPassword = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      // Navigation handled by AppNavigator
    }
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const registerData: RegisterRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber || undefined,
        userType: data.userType.toLowerCase() as UserType,
      };

      const result = await dispatch(registerUser(registerData)).unwrap();

      if (result.requiresVerification) {
        Alert.alert(
          t('auth.register.verificationRequired'),
          result.message || t('auth.register.verificationMessage'),
          [{ text: t('common.ok'), onPress: () => navigation.navigate('VerifyEmail' as never) }]
        );
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section with Gradient */}
          <View style={styles.heroContainer}>
            <LinearGradient
              colors={[SECONDARY_COLORS[500], SECONDARY_COLORS[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              {/* Decorative orbs */}
              <View style={styles.decorativeOrbs}>
                <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
                <View style={[styles.orb, styles.orb2, { backgroundColor: ACCENT_COLORS[500] + '15' }]} />
              </View>

              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{t('auth.register.title')}</Text>
                <Text style={styles.heroSubtitle}>{t('auth.register.subtitle2')}</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.content}>
            {/* Sign in prompt */}
            <Text style={[styles.signupPrompt, { color: colors.textSecondary }]}>
              {t('auth.register.alreadyHaveAccount')}{' '}
              <Text
                style={[styles.signupLink, { color: PRIMARY_COLORS[500] }]}
                onPress={() => navigation.navigate('Login' as never)}
              >
                {t('auth.register.signIn')}
              </Text>
            </Text>

            {/* Error Message */}
            {error && (
              <Card
                style={[styles.messageCard, { backgroundColor: isDark ? ERROR_COLOR + '20' : ERROR_COLOR + '10', borderColor: ERROR_COLOR + '50' }]}
                borderVariant="none"
              >
                <Text style={[styles.messageText, { color: ERROR_COLOR }]}>{error}</Text>
              </Card>
            )}

            {/* Form Card */}
            <Card style={styles.formCard} borderVariant="subtle" elevation="sm">
              {/* User Type Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('auth.register.accountType')}
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.userTypeContainer}>
                      <TouchableOpacity
                        style={[
                          styles.userTypeButton,
                          { borderColor: value === 'CUSTOMER' ? PRIMARY_COLORS[500] : colors.border },
                          value === 'CUSTOMER' && { backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : PRIMARY_COLORS[50] },
                        ]}
                        onPress={() => onChange('CUSTOMER')}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.userTypeEmoji,
                          { opacity: value === 'CUSTOMER' ? 1 : 0.5 }
                        ]}>
                          👤
                        </Text>
                        <Text
                          style={[
                            styles.userTypeText,
                            { color: value === 'CUSTOMER' ? PRIMARY_COLORS[500] : colors.text },
                          ]}
                        >
                          {t('auth.register.customer')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.userTypeButton,
                          { borderColor: value === 'SPECIALIST' ? PRIMARY_COLORS[500] : colors.border },
                          value === 'SPECIALIST' && { backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : PRIMARY_COLORS[50] },
                        ]}
                        onPress={() => onChange('SPECIALIST')}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.userTypeEmoji,
                          { opacity: value === 'SPECIALIST' ? 1 : 0.5 }
                        ]}>
                          👨‍💼
                        </Text>
                        <Text
                          style={[
                            styles.userTypeText,
                            { color: value === 'SPECIALIST' ? PRIMARY_COLORS[500] : colors.text },
                          ]}
                        >
                          {t('auth.register.specialist')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.userTypeButton,
                          { borderColor: value === 'BUSINESS' ? PRIMARY_COLORS[500] : colors.border },
                          value === 'BUSINESS' && { backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : PRIMARY_COLORS[50] },
                        ]}
                        onPress={() => onChange('BUSINESS')}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.userTypeEmoji,
                          { opacity: value === 'BUSINESS' ? 1 : 0.5 }
                        ]}>
                          🏢
                        </Text>
                        <Text
                          style={[
                            styles.userTypeText,
                            { color: value === 'BUSINESS' ? PRIMARY_COLORS[500] : colors.text },
                          ]}
                        >
                          {t('auth.register.business')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  name="userType"
                />
              </View>

              {/* Name Row */}
              <View style={styles.nameRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t('auth.register.firstNameLabel')}
                  </Text>
                  <Controller
                    control={control}
                    rules={{ required: t('auth.error.firstNameRequired') }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder={t('auth.register.firstNamePlaceholder')}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.firstName?.message}
                        autoCapitalize="words"
                      />
                    )}
                    name="firstName"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t('auth.register.lastNameLabel')}
                  </Text>
                  <Controller
                    control={control}
                    rules={{ required: t('auth.error.lastNameRequired') }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder={t('auth.register.lastNamePlaceholder')}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.lastName?.message}
                        autoCapitalize="words"
                      />
                    )}
                    name="lastName"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('auth.register.emailLabel')}
                </Text>
                <Controller
                  control={control}
                  rules={{
                    required: t('auth.error.emailRequired'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('auth.error.emailInvalid'),
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder={t('auth.register.emailPlaceholder')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  )}
                  name="email"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('auth.register.passwordLabel')}
                </Text>
                <Controller
                  control={control}
                  rules={{
                    required: t('auth.error.passwordRequired'),
                    minLength: {
                      value: 6,
                      message: t('auth.error.passwordMinLength'),
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder={t('auth.register.passwordPlaceholder')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                      }
                    />
                  )}
                  name="password"
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('auth.register.confirmPasswordLabel')}
                </Text>
                <Controller
                  control={control}
                  rules={{
                    required: t('auth.error.confirmPasswordRequired'),
                    validate: (value) =>
                      value === watchPassword || t('auth.error.passwordsMismatch'),
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder={t('auth.register.confirmPasswordPlaceholder')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                      }
                    />
                  )}
                  name="confirmPassword"
                />
              </View>

              {/* Terms Agreement */}
              <Controller
                control={control}
                rules={{
                  validate: (value) => value || t('auth.error.termsRequired'),
                }}
                render={({ field: { onChange, value } }) => (
                  <View>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => onChange(!value)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: colors.border },
                        value && { backgroundColor: PRIMARY_COLORS[500], borderColor: PRIMARY_COLORS[500] }
                      ]}>
                        {value && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                        {t('auth.register.agreeToTerms')}
                      </Text>
                    </TouchableOpacity>
                    {errors.agreeToTerms && (
                      <Text style={[styles.errorText, { color: ERROR_COLOR, marginTop: SPACING.xs }]}>
                        {errors.agreeToTerms.message}
                      </Text>
                    )}
                  </View>
                )}
                name="agreeToTerms"
              />

              {/* Create Account Button */}
              <Button
                variant="primary"
                size="lg"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                style={{ marginTop: SPACING.sm }}
              >
                {isLoading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
              </Button>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    height: 180,
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
    width: 180,
    height: 180,
    top: -40,
    right: -40,
    opacity: 0.3,
  },
  orb2: {
    width: 130,
    height: 130,
    bottom: -20,
    left: -20,
    opacity: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    fontWeight: TYPOGRAPHY.h1.fontWeight as any,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.body.fontSize,
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  signupPrompt: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  signupLink: {
    fontWeight: FONT_WEIGHTS.semibold,
  },
  messageCard: {
    padding: SPACING.md,
    borderWidth: 1,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
  formCard: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  userTypeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  userTypeButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  userTypeEmoji: {
    fontSize: 24,
  },
  userTypeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  eyeIcon: {
    fontSize: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.bold,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
  },
});
