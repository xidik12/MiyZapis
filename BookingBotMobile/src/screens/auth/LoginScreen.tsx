/**
 * LoginScreen - Redesigned with Panhaha design system
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
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, selectIsAuthenticated, selectAuthError, selectIsLoading, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoginRequest } from '../../types';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  ERROR_COLOR,
  SUCCESS_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const LoginScreen: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
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
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Navigation will be handled by AppNavigator
    }
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const loginData: LoginRequest = {
        email: data.email,
        password: data.password,
        platform: 'mobile',
      };

      await dispatch(login(loginData)).unwrap();
    } catch (error) {
      console.error('Login failed:', error);
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
              colors={[PRIMARY_COLORS[500], PRIMARY_COLORS[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              {/* Decorative orbs */}
              <View style={styles.decorativeOrbs}>
                <View style={[styles.orb, styles.orb1, { backgroundColor: ACCENT_COLORS[500] + '20' }]} />
                <View style={[styles.orb, styles.orb2, { backgroundColor: SECONDARY_COLORS[300] + '15' }]} />
              </View>

              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{t('auth.login.title')}</Text>
                <Text style={styles.heroSubtitle}>{t('auth.login.welcomeBack')}</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.content}>
            {/* Sign up prompt */}
            <Text style={[styles.signupPrompt, { color: colors.textSecondary }]}>
              {t('auth.login.subtitle')}{' '}
              <Text
                style={[styles.signupLink, { color: PRIMARY_COLORS[500] }]}
                onPress={() => navigation.navigate('Register' as never)}
              >
                {t('auth.login.createAccount')}
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
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('auth.login.emailLabel')}
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
                      placeholder={t('auth.login.emailPlaceholder')}
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
                  {t('auth.login.passwordLabel')}
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
                      placeholder={t('auth.login.passwordPlaceholder')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
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

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <Controller
                  control={control}
                  render={({ field: { onChange, value } }) => (
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
                        {t('auth.login.rememberMe')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  name="rememberMe"
                />

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword' as never)}>
                  <Text style={[styles.forgotPassword, { color: PRIMARY_COLORS[500] }]}>
                    {t('auth.login.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <Button
                variant="primary"
                size="lg"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
              </Button>
            </Card>

            {/* Social Login Section */}
            <View style={styles.socialSection}>
              <Divider text={t('auth.login.orContinueWith')} spacing={SPACING.lg} />

              <GoogleSignInButton
                disabled={isLoading}
                onSuccess={() => {
                  // Navigation will be handled by AppNavigator
                }}
                onError={(error) => {
                  Alert.alert(t('auth.error.googleSignInError'), error);
                }}
              />
            </View>
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
    height: 200,
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
    width: 200,
    height: 200,
    top: -50,
    right: -50,
    opacity: 0.3,
  },
  orb2: {
    width: 150,
    height: 150,
    bottom: -30,
    left: -30,
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
    fontSize: TYPOGRAPHY.bodyLg.fontSize,
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
  eyeIcon: {
    fontSize: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -SPACING.xs,
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
  },
  forgotPassword: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  socialSection: {
    gap: SPACING.md,
  },
});
