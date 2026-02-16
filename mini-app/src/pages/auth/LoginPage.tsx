import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Phone, User, AlertCircle, Calendar, Star, Shield, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { telegramAuthAsync, registerAsync, clearError, setCredentials } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';

// @ts-ignore - Vite env types
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
// @ts-ignore
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api/v1';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, initData, webApp } = useTelegram();

  // Raw Telegram user from WebApp SDK (has first_name, last_name, photo_url, username)
  const telegramUser = webApp?.initDataUnsafe?.user || null;
  const initDataUnsafe = webApp?.initDataUnsafe || null;

  const { isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const [registrationData, setRegistrationData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (telegramUser) {
      setRegistrationData(prev => ({
        ...prev,
        firstName: telegramUser.first_name || '',
        lastName: telegramUser.last_name || ''
      }));
    }
  }, [telegramUser]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!(window as any).google?.accounts?.id) return;

      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleButtonRef.current) {
        (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          width: googleButtonRef.current.offsetWidth,
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
        });
      }
    };

    // Check if script already loaded
    if ((window as any).google?.accounts?.id) {
      initGoogle();
      return;
    }

    // Load the GSI script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {
      // Cleanup - don't remove script as other components may use it
    };
  }, [GOOGLE_CLIENT_ID]);

  const handleGoogleResponse = useCallback(async (response: any) => {
    if (!response?.credential) return;
    setGoogleLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth-enhanced/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const { tokens, user } = data.data;
        const authToken = tokens?.accessToken || tokens?.token || '';
        localStorage.setItem('authToken', authToken);
        // Also store in booking_app_token for TelegramProvider compatibility
        localStorage.setItem('booking_app_token', authToken);
        dispatch(setCredentials({ user, token: authToken }));

        // Auto-link Telegram account if user is inside Telegram
        if (telegramUser && authToken) {
          try {
            const linkRes = await fetch(`${API_BASE_URL}/users/telegram/link`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                telegramId: telegramUser.id.toString(),
                firstName: telegramUser.first_name || user.firstName,
                lastName: telegramUser.last_name || user.lastName || '',
                username: telegramUser.username || '',
                authDate: initDataUnsafe?.auth_date || Math.floor(Date.now() / 1000),
                hash: initDataUnsafe?.hash || 'mini-app-link',
              }),
            });
            const linkData = await linkRes.json();
            if (linkData.success) {
              console.log('Telegram account linked to Google account');
            } else {
              // 409 = already linked to another account, which is fine
              console.log('Telegram link result:', linkData.error || 'already linked');
            }
          } catch (linkErr) {
            // Non-critical — account works without linking, just won't auto-login next time
            console.warn('Failed to link Telegram account:', linkErr);
          }
        }

        dispatch(addToast({
          type: 'success',
          title: 'Welcome!',
          message: `Signed in as ${user.firstName}`
        }));
        hapticFeedback.notificationSuccess();
      } else {
        throw new Error(data.error || 'Google sign-in failed');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      dispatch(addToast({
        type: 'error',
        title: 'Sign-in Failed',
        message: err instanceof Error ? err.message : 'Google sign-in failed'
      }));
      hapticFeedback.notificationError();
    } finally {
      setGoogleLoading(false);
    }
  }, [dispatch, hapticFeedback, telegramUser, initDataUnsafe]);

  const handleAutoLogin = async () => {
    if (!telegramUser || !initData) {
      setShowRegistrationForm(true);
      return;
    }

    try {
      // Send raw initData to the WebApp-specific endpoint for proper validation
      const res = await fetch(`${API_BASE_URL}/auth-enhanced/telegram/webapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const { tokens, user, token } = data.data;
        const authToken = tokens?.accessToken || tokens?.token || token || '';
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('booking_app_token', authToken);
        dispatch(setCredentials({ user, token: authToken }));
        dispatch(addToast({
          type: 'success',
          title: 'Welcome!',
          message: `Signed in as ${user.firstName}`
        }));
        hapticFeedback.notificationSuccess();
      } else {
        throw new Error(data.error || data.message || 'Telegram auth failed');
      }
    } catch (err) {
      console.error('Telegram auto-login failed:', err);
      setShowRegistrationForm(true);
      hapticFeedback.notificationWarning();
    }
  };

  const handleRegistration = async () => {
    if (!registrationData.firstName.trim()) {
      hapticFeedback.notificationError();
      dispatch(addToast({
        type: 'error',
        title: 'Required Field',
        message: 'First name is required.'
      }));
      return;
    }

    try {
      // Use /auth-enhanced/register with Telegram data
      const res = await fetch(`${API_BASE_URL}/auth-enhanced/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: registrationData.firstName,
          lastName: registrationData.lastName || '',
          email: registrationData.email || `telegram_${telegramUser?.id || 'unknown'}@miyzapis.com`,
          password: `tg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          phone: registrationData.phone || '',
          telegramId: telegramUser?.id?.toString() || '',
          userType: 'customer',
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const { tokens, user, token } = data.data;
        const authToken = tokens?.accessToken || tokens?.token || token || '';
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('booking_app_token', authToken);
        dispatch(setCredentials({ user, token: authToken }));
        dispatch(addToast({
          type: 'success',
          title: 'Registration Complete!',
          message: 'Your account has been created successfully.'
        }));
        hapticFeedback.notificationSuccess();
      } else {
        throw new Error(data.error || data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      dispatch(addToast({
        type: 'error',
        title: 'Registration Failed',
        message: err instanceof Error ? err.message : 'Please try again.'
      }));
      hapticFeedback.notificationError();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }));
    if (error) dispatch(clearError());
  };

  if (isLoading || googleLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title="Signing In..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4 mx-auto" />
            <p className="text-text-secondary">
              {googleLoading ? 'Signing in with Google...' : 'Authenticating with Telegram...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary">
      <Header
        title="Welcome to MiyZapis"
        subtitle="Your booking platform"
      />

      <div className="flex-1 px-4 py-6 page-stagger overflow-y-auto">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3b97f2] to-[#1d4ed8] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">MiyZapis</h1>
          <p className="text-text-secondary text-sm max-w-[280px] mx-auto">
            Book appointments with top specialists. Manage your schedule effortlessly.
          </p>
        </div>

        {/* How it works */}
        <Card className="mb-6">
          <h3 className="font-semibold text-text-primary mb-3 text-sm">How it works</h3>
          <div className="space-y-3">
            {[
              { icon: <User size={16} />, title: 'Create Account', desc: 'Sign in with Google or Telegram' },
              { icon: <Star size={16} />, title: 'Find Specialists', desc: 'Browse and pick the best match' },
              { icon: <Calendar size={16} />, title: 'Book & Go', desc: 'Choose a time and confirm' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-primary/15 flex items-center justify-center text-accent-primary flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{step.title}</p>
                  <p className="text-xs text-text-secondary">{step.desc}</p>
                </div>
                {i < 2 && <ChevronRight size={14} className="text-text-muted flex-shrink-0" />}
              </div>
            ))}
          </div>
        </Card>

        {/* Sign-In Options */}
        <div className="space-y-3 mb-6">
          {/* Telegram Sign-In */}
          {telegramUser && (
            <Card className="mb-0">
              <div className="flex items-center gap-3 mb-3">
                {telegramUser.photo_url ? (
                  <img src={telegramUser.photo_url} alt="Profile" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">
                    {telegramUser.first_name} {telegramUser.last_name}
                  </h3>
                  {telegramUser.username && (
                    <p className="text-xs text-text-secondary">@{telegramUser.username}</p>
                  )}
                </div>
              </div>

              {!showRegistrationForm ? (
                <Button fullWidth onClick={handleAutoLogin} disabled={isLoading}>
                  Continue with Telegram
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-text-secondary text-sm">Complete your profile:</p>
                  <Input
                    label="First Name"
                    value={registrationData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    icon={<User size={16} />}
                    placeholder="First name"
                    required
                  />
                  <Input
                    label="Last Name"
                    value={registrationData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    icon={<User size={16} />}
                    placeholder="Last name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={registrationData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    icon={<Mail size={16} />}
                    placeholder="your@email.com"
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={registrationData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    icon={<Phone size={16} />}
                    placeholder="+380..."
                  />
                  <Button
                    fullWidth
                    onClick={handleRegistration}
                    disabled={!registrationData.firstName.trim() || isLoading}
                    loading={isLoading}
                  >
                    Complete Registration
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Divider */}
          {telegramUser && GOOGLE_CLIENT_ID && (
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          )}

          {/* Google Sign-In */}
          {GOOGLE_CLIENT_ID && (
            <div className="w-full">
              <div ref={googleButtonRef} className="w-full flex justify-center" />
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-4 bg-accent-red/15 border-accent-red/30">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-accent-red flex-shrink-0" />
              <div>
                <h4 className="font-medium text-accent-red text-sm">Error</h4>
                <p className="text-xs text-accent-red/80 mt-0.5">{error}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearError())}
              className="mt-2 text-accent-red"
            >
              Dismiss
            </Button>
          </Card>
        )}

        {/* Security note */}
        <div className="flex items-center gap-2 justify-center text-text-muted mb-4">
          <Shield size={14} />
          <span className="text-[11px]">Secure sign-in. Your data is protected.</span>
        </div>

        {/* Browse without account */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-text-secondary text-sm"
          >
            Browse without account
          </Button>
        </div>
      </div>
    </div>
  );
};
