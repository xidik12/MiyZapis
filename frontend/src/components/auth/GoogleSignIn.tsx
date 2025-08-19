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

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        }
      );
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
      const errorMessage = error.message || 'Google Sign-In failed';
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