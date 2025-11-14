// Register Screen - Full implementation matching web version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register as registerUser, selectIsAuthenticated, selectAuthError, selectIsLoading, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { RegisterRequest, UserType } from '../../types';

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
  const { colors } = useTheme();
  
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
  const watchUserType = watch('userType');

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
        userType: data.userType,
      };

      const result = await dispatch(registerUser(registerData)).unwrap();
      
      if (result.requiresVerification) {
        Alert.alert(
          'Verification Required',
          result.message || 'Please check your email to verify your account.',
          [{ text: 'OK', onPress: () => navigation.navigate('VerifyEmail' as never) }]
        );
      }
    } catch (error) {
      console.error('Registration failed:', error);
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
      paddingTop: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    link: {
      color: colors.primary,
      fontWeight: '600',
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordInput: {
      paddingRight: 50,
    },
    eyeButton: {
      position: 'absolute',
      right: 12,
      top: 12,
      padding: 4,
    },
    eyeText: {
      fontSize: 20,
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    userTypeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    userTypeButton: {
      flex: 1,
      minWidth: '30%',
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
    },
    userTypeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    userTypeButtonInactive: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    userTypeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    userTypeTextActive: {
      color: colors.primary,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      fontSize: 14,
      color: colors.text,
    },
    submitButton: {
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      opacity: isLoading ? 0.6 : 1,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: colors.error + '20',
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    errorTextContainer: {
      fontSize: 14,
      color: colors.error,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Already have an account?{' '}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Login' as never)}
            >
              Sign in here
            </Text>
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTextContainer}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.userTypeContainer}>
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.userTypeButton,
                        value === 'CUSTOMER' ? styles.userTypeButtonActive : styles.userTypeButtonInactive,
                      ]}
                      onPress={() => onChange('CUSTOMER')}
                    >
                      <Text
                        style={[
                          styles.userTypeText,
                          value === 'CUSTOMER' && styles.userTypeTextActive,
                        ]}
                      >
                        Customer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.userTypeButton,
                        value === 'SPECIALIST' ? styles.userTypeButtonActive : styles.userTypeButtonInactive,
                      ]}
                      onPress={() => onChange('SPECIALIST')}
                    >
                      <Text
                        style={[
                          styles.userTypeText,
                          value === 'SPECIALIST' && styles.userTypeTextActive,
                        ]}
                      >
                        Specialist
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.userTypeButton,
                        value === 'BUSINESS' ? styles.userTypeButtonActive : styles.userTypeButtonInactive,
                      ]}
                      onPress={() => onChange('BUSINESS')}
                    >
                      <Text
                        style={[
                          styles.userTypeText,
                          value === 'BUSINESS' && styles.userTypeTextActive,
                        ]}
                      >
                        Business
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                name="userType"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <Controller
                  control={control}
                  rules={{ required: 'First name is required' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="First name"
                      placeholderTextColor={colors.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                    />
                  )}
                  name="firstName"
                />
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName.message}</Text>
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <Controller
                  control={control}
                  rules={{ required: 'Last name is required' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      placeholderTextColor={colors.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                    />
                  )}
                  name="lastName"
                />
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName.message}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                )}
                name="email"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <Controller
                  control={control}
                  rules={{
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                  )}
                  name="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <Controller
                  control={control}
                  rules={{
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === watchPassword || 'Passwords do not match',
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                  )}
                  name="confirmPassword"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>

            <View style={styles.checkboxRow}>
              <Controller
                control={control}
                rules={{
                  validate: (value) => value || 'You must agree to the terms',
                }}
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    style={[styles.checkbox, value && styles.checkboxChecked]}
                    onPress={() => onChange(!value)}
                  >
                    {value && <Text style={{ color: '#FFF' }}>✓</Text>}
                  </TouchableOpacity>
                )}
                name="agreeToTerms"
              />
              <Text style={styles.checkboxText}>
                I agree to the Terms and Conditions
              </Text>
            </View>
            {errors.agreeToTerms && (
              <Text style={styles.errorText}>{errors.agreeToTerms.message}</Text>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading && (
                <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

