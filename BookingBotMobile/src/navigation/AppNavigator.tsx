// App Navigator - Complete navigation setup with all screens
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { DrawerNavigator } from './DrawerNavigator';
import { useTheme } from '../contexts/ThemeContext';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';

// Public screens
import { ServiceDetailScreen } from '../screens/ServiceDetailScreen';
import { SpecialistProfileScreen } from '../screens/SpecialistProfileScreen';
import { BookingFlowScreen } from '../screens/BookingFlowScreen';

// Customer screens
import { CustomerDashboardScreen } from '../screens/customer/DashboardScreen';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.secondary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="Main"
              component={DrawerNavigator}
              options={{ headerShown: false }}
            />
            {/* Public screens accessible when authenticated */}
            <Stack.Screen
              name="ServiceDetail"
              component={ServiceDetailScreen}
              options={{ title: 'Service Details' }}
            />
            <Stack.Screen
              name="SpecialistProfile"
              component={SpecialistProfileScreen}
              options={{ title: 'Specialist Profile' }}
            />
            <Stack.Screen
              name="BookingFlow"
              component={BookingFlowScreen}
              options={{ title: 'Book Service' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Create Account' }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: 'Forgot Password' }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Reset Password' }}
            />
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              options={{ title: 'Verify Email' }}
            />
            {/* Public screens accessible when not authenticated */}
            <Stack.Screen
              name="ServiceDetail"
              component={ServiceDetailScreen}
              options={{ title: 'Service Details' }}
            />
            <Stack.Screen
              name="SpecialistProfile"
              component={SpecialistProfileScreen}
              options={{ title: 'Specialist Profile' }}
            />
            <Stack.Screen
              name="BookingFlow"
              component={BookingFlowScreen}
              options={{ title: 'Book Service' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

