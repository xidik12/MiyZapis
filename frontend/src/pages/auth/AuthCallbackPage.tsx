import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';
import { setAuthTokens } from '@/services/auth.service';
import { toast } from 'react-toastify';

/**
 * AuthCallbackPage - Handles OAuth callback redirects
 * 
 * This page handles the redirect after OAuth authentication (Google, etc.)
 * and processes the authentication tokens returned from the backend.
 */
const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        if (error) {
          // Handle authentication error
          let errorMessage = 'Authentication failed';
          
          switch (error) {
            case 'google_auth_failed':
              errorMessage = 'Google authentication failed. Please try again.';
              break;
            case 'access_denied':
              errorMessage = 'Access denied. Please grant the required permissions.';
              break;
            default:
              errorMessage = 'Authentication failed. Please try again.';
          }

          toast.error(errorMessage);
          navigate('/auth/login');
          return;
        }

        if (token && refreshToken) {
          // Set authentication tokens
          setAuthTokens({
            accessToken: token,
            refreshToken: refreshToken,
          });

          toast.success('Successfully signed in!');
          
          // Redirect to appropriate page
          const redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/';
          sessionStorage.removeItem('redirectAfterAuth');
          navigate(redirectTo);
        } else {
          // Missing tokens
          toast.error('Authentication failed - missing tokens');
          navigate('/auth/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/auth/login');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
