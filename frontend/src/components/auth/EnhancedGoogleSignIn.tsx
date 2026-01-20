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
  }
}

const EnhancedGoogleSignIn: React.FC<EnhancedGoogleSignInProps> = ({ 
  onSuccess, 
  onError, 
  disabled = false 
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const clientId = environment.GOOGLE_CLIENT_ID;
  
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectLoading, setRedirectLoading] = useState(false);

  // Don't render if Google OAuth is not configured
  if (!clientId) {
    return null;
  }

  useEffect(() => {
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
