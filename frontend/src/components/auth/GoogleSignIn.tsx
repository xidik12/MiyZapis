import React, { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { googleLogin } from '@/store/slices/authSlice';

interface GoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess, onError, disabled = false }) => {
  const dispatch = useAppDispatch();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Don't render if Google OAuth is not configured
  if (!clientId) {
    return null;
  }

  useEffect(() => {
    // Check if Google script is already loaded
    if (window.google) {
      initializeGoogleSignIn();
      return;
    }

    // Load Google Identity Services script if not already loaded
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Small delay to ensure Google SDK is fully loaded
        setTimeout(initializeGoogleSignIn, 100);
      };
      script.onerror = () => {
        console.error('Failed to load Google Sign-In SDK');
        if (onError) {
          onError('Failed to load Google Sign-In. Please refresh the page.');
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup is handled globally to avoid conflicts with multiple instances
    };
  }, [clientId]);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Use a more flexible button configuration
      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
        
        // Apply custom styling to make it full width
        const googleButton = buttonContainer.querySelector('div[role="button"]');
        if (googleButton) {
          googleButton.style.width = '100%';
          googleButton.style.justifyContent = 'center';
        }
      }
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Dispatch Google login action
      await dispatch(googleLogin({ credential: response.credential })).unwrap();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Google Sign-In failed';
      
      if (error.message?.includes('CORS') || error.message?.includes('Cross-Origin')) {
        errorMessage = 'Authentication service temporarily unavailable. Please try again.';
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Authentication service not available. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <div className="w-full">
      <div 
        id="google-signin-button" 
        className={`w-full flex justify-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      ></div>
    </div>
  );
};

export default GoogleSignIn;