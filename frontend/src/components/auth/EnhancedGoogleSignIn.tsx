import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { googleLogin } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import UserTypeSelectionModal from './UserTypeSelectionModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedGoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: Record<string, unknown>;
  }
}

const EnhancedGoogleSignIn: React.FC<EnhancedGoogleSignInProps> = ({ 
  onSuccess, 
  onError, 
  disabled = false 
}) => {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const clientId = (import.meta.env as any).VITE_GOOGLE_CLIENT_ID;

  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);

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
        });
        
        // Apply custom styling to make it full width
        const googleButton = buttonContainer.querySelector('div[role="button"]') as HTMLElement | null;
        if (googleButton) {
          googleButton.style.width = '100%';
          googleButton.style.justifyContent = 'center';
        }
      }
    }
  };

  const handleCredentialResponse = async (response: Record<string, unknown>) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Dispatch Google login action without userType first
      const result = await dispatch(googleLogin({ credential: response.credential })).unwrap();

      // Check if user type selection is required
      if ('requiresUserTypeSelection' in result && result.requiresUserTypeSelection) {
        setPendingGoogleData({
          credential: response.credential,
          userData: 'googleData' in result ? result.googleData : null
        });
        setShowUserTypeModal(true);
        return;
      }

      // If we get here, user already exists and is logged in
      if (onSuccess) {
        onSuccess();
      }

      // Navigate based on user type
      if ('user' in result && result.user?.userType === 'specialist') {
        navigate('/specialist/dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Google Sign-In Error:', error);
      
      // Handle different types of errors
      let errorMessage = t('auth.google.error');

      if (err.message?.includes('CORS') || err.message?.includes('Cross-Origin')) {
        errorMessage = t('auth.google.tryAgain');
      } else if (err.message?.includes('popup_blocked')) {
        errorMessage = t('auth.google.tryAgain');
      } else if (err.message?.includes('access_denied')) {
        errorMessage = t('auth.google.error');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleUserTypeSelection = async (userType: 'customer' | 'specialist') => {
    try {
      if (!pendingGoogleData) {
        throw new Error('No pending Google data');
      }

      // Dispatch Google login with selected user type
      const result = await dispatch(googleLogin({ 
        credential: pendingGoogleData.credential, 
        userType 
      })).unwrap();
      
      setShowUserTypeModal(false);
      setPendingGoogleData(null);

      if (onSuccess) {
        onSuccess();
      }

      // Navigate based on user type
      if (userType === 'specialist') {
        navigate('/specialist/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('User type selection error:', error);
      setShowUserTypeModal(false);
      setPendingGoogleData(null);
      
      if (onError) {
        onError(err.message || 'Registration failed');
      }
    }
  };

  const handleCloseModal = () => {
    setShowUserTypeModal(false);
    setPendingGoogleData(null);
  };

  return (
    <>
      <div className="w-full">
        <div 
          id="enhanced-google-signin-button" 
          className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        />
      </div>

      <UserTypeSelectionModal
        isOpen={showUserTypeModal}
        onClose={handleCloseModal}
        onSelectUserType={handleUserTypeSelection}
        userEmail={pendingGoogleData?.userData?.email}
        userName={pendingGoogleData?.userData?.name}
      />
    </>
  );
};

export default EnhancedGoogleSignIn;
