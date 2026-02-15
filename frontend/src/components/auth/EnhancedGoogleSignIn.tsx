import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { googleLogin } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import UserTypeSelectionModal from './UserTypeSelectionModal';
import { environment } from '@/config/environment';
import { authService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedGoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
    Telegram?: { WebApp?: any };
  }
}

// Detect if running inside Telegram's WebView (GSI popup doesn't work there)
const isTelegramWebView = () => {
  return !!(window.Telegram?.WebApp) || /Telegram/i.test(navigator.userAgent);
};

const EnhancedGoogleSignIn: React.FC<EnhancedGoogleSignInProps> = ({
  onSuccess,
  onError,
  disabled = false
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const clientId = environment.GOOGLE_CLIENT_ID;
  const inTelegram = isTelegramWebView();

  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectLoading, setRedirectLoading] = useState(false);

  // Don't render if Google OAuth is not configured
  if (!clientId) {
    return null;
  }

  useEffect(() => {
    // Skip loading GSI script in Telegram WebView — popup mode doesn't work there
    if (inTelegram) return;

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      // Cleanup script
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Use a more flexible button configuration
      const buttonContainer = document.getElementById('enhanced-google-signin-button');
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 400,
        });

        // Force full width with !important via style injection
        const style = document.createElement('style');
        style.textContent = `
          #enhanced-google-signin-button > div {
            width: 100% !important;
          }
          #enhanced-google-signin-button iframe {
            width: 100% !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Dispatch Google login action without userType first
      const result = await dispatch(googleLogin({ credential: response.credential })).unwrap();
      
      // Type guard: Check if user type selection is required
      if ('requiresUserTypeSelection' in result && result.requiresUserTypeSelection) {
        setPendingGoogleData({
          credential: response.credential,
          userData: result.googleData
        });
        setShowUserTypeModal(true);
        return;
      }

      // If we get here, user already exists and is logged in
      // Type guard: Check if result has user property
      if ('user' in result && result.user) {
        if (onSuccess) {
          onSuccess();
        }

        // Navigate based on user type
        if (result.user.userType === 'specialist' || result.user.userType === 'business') {
          navigate('/specialist/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
      
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Google Sign-In failed';
      
      if (error.message?.includes('CORS') || error.message?.includes('Cross-Origin')) {
        errorMessage = 'Google Sign-In is temporarily unavailable. Please try again later.';
      } else if (error.message?.includes('popup_blocked')) {
        errorMessage = 'Please allow popups for Google Sign-In to work.';
      } else if (error.message?.includes('access_denied')) {
        errorMessage = 'Google Sign-In was cancelled.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleUserTypeSelection = async (userType: 'customer' | 'specialist' | 'business') => {
    try {
      if (!pendingGoogleData) {
        throw new Error('No pending Google data');
      }

      // Dispatch Google login with selected user type
      // Note: googleLogin only accepts 'customer' | 'specialist', so map 'business' to 'specialist'
      const mappedUserType = userType === 'business' ? 'specialist' : userType;
      await dispatch(googleLogin({
        credential: pendingGoogleData.credential,
        userType: mappedUserType
      })).unwrap();

      setShowUserTypeModal(false);
      setPendingGoogleData(null);

      if (onSuccess) {
        onSuccess();
      }

      // Navigate based on user type
      if (userType === 'specialist' || userType === 'business') {
        navigate('/specialist/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error: any) {
      console.error('User type selection error:', error);
      setShowUserTypeModal(false);
      setPendingGoogleData(null);

      if (onError) {
        onError(error.message || 'Registration failed');
      }
    }
  };

  const handleRedirectUserTypeSelection = async (userType: 'customer' | 'specialist' | 'business') => {
    try {
      setRedirectLoading(true);
      const mappedUserType = userType === 'business' ? 'specialist' : userType;
      sessionStorage.setItem('redirectAfterAuth', `${window.location.pathname}${window.location.search}`);
      const url = await authService.getGoogleAuthUrl(mappedUserType);
      window.location.assign(url);
    } catch (error: any) {
      console.error('Google redirect login error:', error);
      setRedirectLoading(false);
      setShowRedirectModal(false);
      if (onError) {
        onError(error.message || 'Google redirect failed');
      }
    }
  };

  const handleCloseModal = () => {
    setShowUserTypeModal(false);
    setPendingGoogleData(null);
    setShowRedirectModal(false);
  };

  const handleSelectUserType = async (userType: 'customer' | 'specialist' | 'business') => {
    if (showRedirectModal) {
      await handleRedirectUserTypeSelection(userType);
      return;
    }
    await handleUserTypeSelection(userType);
  };

  return (
    <>
      {inTelegram ? (
        /* In Telegram WebView: show a redirect-based Google button (GSI popup doesn't work) */
        <div className="w-full flex justify-center">
          <button
            type="button"
            onClick={() => setShowRedirectModal(true)}
            disabled={disabled || redirectLoading}
            className="w-full max-w-md flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {redirectLoading ? (t('auth.google.redirectLoading') || 'Redirecting...') : (t('auth.google.signInWith') || 'Sign in with Google')}
          </button>
        </div>
      ) : (
        /* On regular web: use the GSI popup button */
        <>
          <div className="w-full flex justify-center">
            <div
              id="enhanced-google-signin-button"
              className={`w-full max-w-md ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            />
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowRedirectModal(true)}
              disabled={disabled || redirectLoading}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
            >
              {redirectLoading ? (t('auth.google.redirectLoading') || 'Redirecting...') : (t('auth.google.redirectLabel') || 'Continue with Google (full page)')}
            </button>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('auth.google.redirectHint') || 'If popups are blocked, use the full page sign-in.'}
            </p>
          </div>
        </>
      )}

      <UserTypeSelectionModal
        isOpen={showUserTypeModal || showRedirectModal}
        onClose={handleCloseModal}
        onSelectUserType={handleSelectUserType}
        userEmail={showUserTypeModal ? pendingGoogleData?.userData?.email : undefined}
        userName={showUserTypeModal ? pendingGoogleData?.userData?.name : undefined}
      />
    </>
  );
};

export default EnhancedGoogleSignIn;
