// Verify Email Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch } from '../../store/hooks';
import { verifyEmail, resendVerificationEmail } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';

export const VerifyEmailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const token = (route.params as any)?.token || '';
  const email = (route.params as any)?.email || '';

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  const handleVerify = async (verifyToken: string) => {
    try {
      setIsLoading(true);
      await dispatch(verifyEmail(verifyToken)).unwrap();
      Alert.alert(
        'Email Verified',
        'Your email has been verified successfully.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
      );
    } catch (error: any) {
      Alert.alert('Verification Failed', error || 'Invalid or expired verification token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      await dispatch(resendVerificationEmail()).unwrap();
      Alert.alert('Email Sent', 'Verification email has been resent. Please check your inbox.');
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
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
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
    },
    email: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 32,
    },
    button: {
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 24,
      marginBottom: 16,
      minWidth: 200,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    resendButton: {
      height: 50,
      backgroundColor: colors.surface,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 24,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 200,
    },
    resendButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subtitle, { marginTop: 16 }]}>Verifying email...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to{'\n'}
          {email && <Text style={styles.email}>{email}</Text>}
          {!email && 'your email address'}
        </Text>
        <Text style={styles.subtitle}>
          Please check your inbox and click the verification link to activate your account.
        </Text>

        {email && (
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={isResending}
          >
            {isResending && (
              <ActivityIndicator color={colors.text} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.resendButtonText}>
              {isResending ? 'Resending...' : 'Resend Verification Email'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

