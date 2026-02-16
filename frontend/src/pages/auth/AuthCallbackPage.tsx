import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';
import { useTheme } from '@/contexts/ThemeContext';
import { setAuthTokens } from '@/services';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageLoader } from '@/components/ui';

/**
 * AuthCallbackPage - Handles OAuth callback redirects
 * 
 * This page handles the redirect after OAuth authentication (Google, etc.)
 * and processes the authentication tokens returned from the backend.
 */
const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        if (error) {
          // Handle authentication error
          let errorMessage = t('auth.failed') || 'Authentication failed';
          
          switch (error) {
            case 'google_auth_failed':
              errorMessage = t('auth.googleFailed') || 'Google authentication failed. Please try again.';
              break;
            case 'access_denied':
              errorMessage = t('auth.accessDenied') || 'Access denied. Please grant the required permissions.';
              break;
            default:
              errorMessage = t('auth.failedTryAgain') || 'Authentication failed. Please try again.';
          }

          toast.error(errorMessage);
          navigate('/auth/login');
          return;
        }

        if (token) {
          // Set authentication tokens (refreshToken may be absent for bot-based login)
          setAuthTokens({
            accessToken: token,
            refreshToken: refreshToken || token,
          });

          toast.success(t('auth.signedIn') || 'Successfully signed in!');

          // Redirect to appropriate page
          const redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/';
          sessionStorage.removeItem('redirectAfterAuth');
          navigate(redirectTo);
        } else {
          // Missing tokens
          toast.error(t('auth.missingTokens') || 'Authentication failed - missing tokens');
          navigate('/auth/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error(t('auth.failedTryAgain') || 'Authentication failed. Please try again.');
        navigate('/auth/login');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, dispatch]);

  return <PageLoader text={t('auth.completingSignIn') || 'Completing sign in...'} />;
};

export default AuthCallbackPage;
