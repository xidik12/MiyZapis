// Google Sign-In Button Component for React Native
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAppDispatch } from '../../store/hooks';
import { googleLogin } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { environment } from '../../config/environment';

// Complete the auth session when the browser closes
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [request, setRequest] = useState<AuthSession.AuthRequest | null>(null);

  // Don't render if Google OAuth is not configured
  if (!environment.GOOGLE_AUTH_ENABLED || !environment.GOOGLE_CLIENT_ID) {
    return null;
  }

  useEffect(() => {
    // Configure Google OAuth discovery
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    // Create redirect URI
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'panhaha',
      path: 'oauth',
    });

    // Create auth request
    const authRequest = new AuthSession.AuthRequest({
      clientId: environment.GOOGLE_CLIENT_ID!,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri,
      usePKCE: false, // Google OAuth doesn't require PKCE for ID token flow
      additionalParameters: {},
    });

    setRequest(authRequest);
  }, []);

  const handleGoogleSignIn = async () => {
    if (disabled || isLoading || !request) return;

    try {
      setIsLoading(true);

      // Google OAuth discovery endpoints
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      // Prompt for authentication
      const result = await request.promptAsync(discovery, {
        useProxy: false, // Don't use Expo proxy for production
      });

      if (result.type === 'success') {
        // Extract ID token from Google OAuth flow
        const { id_token } = result.params;
        
        if (!id_token) {
          throw new Error('No ID token received from Google');
        }

        // Send the credential (ID token) to backend API endpoint /auth-enhanced/google
        // This matches the web version exactly - pure API call with the Google ID token
        try {
          const response = await dispatch(googleLogin({ credential: id_token })).unwrap();
          
          // Check if user type selection is required
          if ('requiresUserTypeSelection' in response && response.requiresUserTypeSelection) {
            // For now, show an alert - you can implement a modal later
            Alert.alert(
              'Select Account Type',
              'Please select your account type',
              [
                {
                  text: 'Customer',
                  onPress: async () => {
                    try {
                      await dispatch(googleLogin({ credential: id_token, userType: 'customer' })).unwrap();
                      if (onSuccess) onSuccess();
                    } catch (error: any) {
                      if (onError) onError(error.message || 'Failed to complete sign-in');
                    }
                  },
                },
                {
                  text: 'Specialist',
                  onPress: async () => {
                    try {
                      await dispatch(googleLogin({ credential: id_token, userType: 'specialist' })).unwrap();
                      if (onSuccess) onSuccess();
                    } catch (error: any) {
                      if (onError) onError(error.message || 'Failed to complete sign-in');
                    }
                  },
                },
                {
                  text: 'Business',
                  onPress: async () => {
                    try {
                      await dispatch(googleLogin({ credential: id_token, userType: 'business' })).unwrap();
                      if (onSuccess) onSuccess();
                    } catch (error: any) {
                      if (onError) onError(error.message || 'Failed to complete sign-in');
                    }
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          } else {
            // Successfully logged in
            if (onSuccess) onSuccess();
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Google authentication failed';
          if (onError) {
            onError(errorMessage);
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      } else if (result.type === 'cancel') {
        // User cancelled
        if (onError) {
          onError('Sign-in cancelled');
        }
      } else if (result.type === 'error') {
        // Error occurred
        const errorMessage = result.error?.message || 'Google sign-in failed';
        if (onError) {
          onError(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Google sign-in failed';
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    button: {
      height: 50,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 16,
      opacity: disabled || isLoading ? 0.6 : 1,
    },
    buttonText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    icon: {
      fontSize: 20,
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGoogleSignIn}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#000000" />
      ) : (
        <>
          <Text style={styles.icon}>🔍</Text>
          <Text style={styles.buttonText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

