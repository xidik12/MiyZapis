import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Phone, User, AlertCircle, Calendar, Star, Shield, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react';
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

/** Map backend userType to role for mini-app compatibility */
function normalizeUser(user: any): any {
  if (user && !user.role && user.userType) {
    return { ...user, role: user.userType.toLowerCase() };
  }
  return user;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, initData, webApp } = useTelegram();

  // Raw Telegram user from WebApp SDK
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
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailLoginData, setEmailLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
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

    if ((window as any).google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {};
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
        const { tokens, user: rawUser } = data.data;
        const user = normalizeUser(rawUser);
        const authToken = tokens?.accessToken || tokens?.token || '';
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('booking_app_token', authToken);
        dispatch(setCredentials({ user, token: authToken }));

        // Auto-link Telegram if inside Telegram
        if (telegramUser && authToken) {
          try {
            await fetch(`${API_BASE_URL}/users/telegram/link`, {
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
          } catch {}
        }

        dispatch(addToast({ type: 'success', title: 'Welcome!', message: `Signed in as ${user.firstName}` }));
        hapticFeedback.notificationSuccess();
      } else {
        throw new Error(data.error || 'Google sign-in failed');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      dispatch(addToast({ type: 'error', title: 'Sign-in Failed', message: err instanceof Error ? err.message : 'Google sign-in failed' }));
      hapticFeedback.notificationError();
    } finally {
      setGoogleLoading(false);
    }
  }, [dispatch, hapticFeedback, telegramUser, initDataUnsafe]);

  // Telegram auto-login
  const handleAutoLogin = async () => {
    if (!telegramUser || !initData) {
      setShowRegistrationForm(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth-enhanced/telegram/webapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const { tokens, user: rawUser, token } = data.data;
        const user = normalizeUser(rawUser);
        const authToken = tokens?.accessToken || tokens?.token || token || '';
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('booking_app_token', authToken);
        dispatch(setCredentials({ user, token: authToken }));
        dispatch(addToast({ type: 'success', title: 'Welcome!', message: `Signed in as ${user.firstName}` }));
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

  // Email/password login
  const handleEmailLogin = async () => {
    if (!emailLoginData.email || !emailLoginData.password) {
      dispatch(addToast({ type: 'error', title: 'Required', message: 'Email and password are required' }));
      return;
    }

    setEmailLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth-enhanced/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailLoginData.email,
          password: emailLoginData.password,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const { tokens, user: rawUser, token } = data.data;
        const user = normalizeUser(rawUser);
        const authToken = tokens?.accessToken || tokens?.token || token || '';
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('booking_app_token', authToken);
        dispatch(setCredentials({ user, token: authToken }));

        // Auto-link Telegram if inside Telegram
        if (telegramUser && authToken) {
          try {
            await fetch(`${API_BASE_URL}/users/telegram/link`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                telegramId: telegramUser.id.toString(),
                firstName: telegramUser.first_name || user.firstName,
                lastName: telegramUser.last_name || '',
                username: telegramUser.username || '',
                authDate: initDataUnsafe?.auth_date || Math.floor(Date.now() / 1000),
                hash: initDataUnsafe?.hash || 'mini-app-link',
              }),
            });
          } catch {}
        }

        dispatch(addToast({ type: 'success', title: 'Welcome!', message: `Signed in as ${user.firstName}` }));
        hapticFeedback.notificationSuccess();
      } else {
        throw new Error(data.error || data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Email login error:', err);
      dispatch(addToast({ type: 'error', title: 'Login Failed', message: err instanceof Error ? err.message : 'Invalid email or password' }));
      hapticFeedback.notificationError();
    } finally {
      setEmailLoading(false);
    }
  };

  // Registration
  const handleRegistration = async () => {
    if (!registrationData.firstName.trim()) {
      hapticFeedback.notificationError();
      dispatch(addToast({ type: 'error', title: 'Required Field', message: 'First name is required.' }));
      return;
    }

    try {
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
        const { tokens, user: rawUser, token } = data.data;
        const user = normalizeUser(rawUser);
        const authToken = tokens?.accessToken || tokens?.token || token || '';
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('booking_app_token', authToken);
        dispatch(setCredentials({ user, token: authToken }));
        dispatch(addToast({ type: 'success', title: 'Registration Complete!', message: 'Your account has been created successfully.' }));
        hapticFeedback.notificationSuccess();
      } else {
        throw new Error(data.error || data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      dispatch(addToast({ type: 'error', title: 'Registration Failed', message: err instanceof Error ? err.message : 'Please try again.' }));
      hapticFeedback.notificationError();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }));
    if (error) dispatch(clearError());
  };

  if (isLoading || googleLoading || emailLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title="Signing In..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4 mx-auto" />
            <p className="text-text-secondary">
              {googleLoading ? 'Signing in with Google...' : emailLoading ? 'Signing in...' : 'Authenticating with Telegram...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary">
      <Header title="Welcome to MiyZapis" subtitle="Your booking platform" />

      <div className="flex-1 px-4 py-6 page-stagger overflow-y-auto">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3b97f2] to-[#1d4ed8] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">MiyZapis</h1>
          <p className="text-text-secondary text-sm max-w-[280px] mx-auto">
            Book appointments with top specialists. Manage your schedule effortlessly.
          </p>
        </div>

        {/* Sign-In Options */}
        <div className="space-y-3 mb-6">

          {/* 1. Telegram Sign-In (shown when inside Telegram) */}
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
                  <Input label="First Name" value={registrationData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} icon={<User size={16} />} placeholder="First name" required />
                  <Input label="Last Name" value={registrationData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} icon={<User size={16} />} placeholder="Last name" />
                  <Input label="Email" type="email" value={registrationData.email} onChange={(e) => handleInputChange('email', e.target.value)} icon={<Mail size={16} />} placeholder="your@email.com" />
                  <Input label="Phone" type="tel" value={registrationData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} icon={<Phone size={16} />} placeholder="+380..." />
                  <Button fullWidth onClick={handleRegistration} disabled={!registrationData.firstName.trim() || isLoading} loading={isLoading}>
                    Complete Registration
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Divider */}
          {telegramUser && (
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-text-muted">or sign in with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          )}

          {/* 2. Google Sign-In */}
          {GOOGLE_CLIENT_ID && (
            <div className="w-full">
              <div ref={googleButtonRef} className="w-full flex justify-center" />
            </div>
          )}

          {/* 3. Email/Password Login */}
          {!showEmailLogin ? (
            <button
              onClick={() => setShowEmailLogin(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/15 text-text-primary font-medium rounded-xl transition-colors text-sm border border-white/10"
            >
              <Mail size={18} />
              Sign in with Email
            </button>
          ) : (
            <Card>
              <div className="space-y-3">
                <Input
                  label="Email"
                  type="email"
                  value={emailLoginData.email}
                  onChange={(e) => setEmailLoginData(prev => ({ ...prev, email: e.target.value }))}
                  icon={<Mail size={16} />}
                  placeholder="your@email.com"
                />
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={emailLoginData.password}
                    onChange={(e) => setEmailLoginData(prev => ({ ...prev, password: e.target.value }))}
                    icon={<Lock size={16} />}
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Button
                  fullWidth
                  onClick={handleEmailLogin}
                  disabled={!emailLoginData.email || !emailLoginData.password}
                >
                  Sign In
                </Button>
                <button
                  onClick={() => setShowEmailLogin(false)}
                  className="w-full text-center text-xs text-text-muted hover:text-text-secondary"
                >
                  Cancel
                </button>
              </div>
            </Card>
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
            <Button variant="ghost" size="sm" onClick={() => dispatch(clearError())} className="mt-2 text-accent-red">
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
          <Button variant="ghost" onClick={() => navigate('/')} className="text-text-secondary text-sm">
            Browse without account
          </Button>
        </div>
      </div>
    </div>
  );
};
