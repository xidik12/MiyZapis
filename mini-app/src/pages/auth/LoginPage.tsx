import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Phone, User, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { telegramAuthAsync, registerAsync, clearError } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const {
    user: telegramUser,
    hapticFeedback,
    initData,
    initDataUnsafe
  } = useTelegram();

  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const [registrationData, setRegistrationData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

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

  const handleAutoLogin = async () => {
    try {
      const telegramData = {
        initData,
        initDataUnsafe,
        user: telegramUser
      };
      await dispatch(telegramAuthAsync(telegramData)).unwrap();
      dispatch(addToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have been signed in successfully.'
      }));
    } catch (err) {
      // If auto-login fails, show registration form
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
      const userData = {
        ...registrationData,
        email: registrationData.email || `${telegramUser?.id}@telegram.local`,
        password: 'temp_telegram_password', // Will be handled by backend
        telegramId: telegramUser?.id.toString()
      };

      await dispatch(registerAsync(userData)).unwrap();
      dispatch(addToast({
        type: 'success',
        title: 'Registration Complete!',
        message: 'Your account has been created successfully.'
      }));
      hapticFeedback.notificationSuccess();
    } catch (err) {
      hapticFeedback.notificationError();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) dispatch(clearError());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title="Signing In..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4 mx-auto" />
            <p className="text-text-secondary">Authenticating with Telegram...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary">
      <Header
        title="Welcome"
        subtitle="Sign in to continue"
      />

      <div className="flex-1 px-4 py-6 page-stagger">
        {/* Telegram User Info */}
        {telegramUser && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              {telegramUser.photo_url ? (
                <img
                  src={telegramUser.photo_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent-primary flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-text-primary">
                  {telegramUser.first_name} {telegramUser.last_name}
                </h3>
                {telegramUser.username && (
                  <p className="text-text-secondary">@{telegramUser.username}</p>
                )}
              </div>
            </div>

            {!showRegistrationForm ? (
              <div>
                <p className="text-text-secondary mb-4">
                  Continue with your Telegram account to access all booking features.
                </p>
                <Button
                  fullWidth
                  onClick={handleAutoLogin}
                  disabled={isLoading}
                >
                  Continue with Telegram
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-text-secondary">
                  Complete your profile to get started:
                </p>

                <Input
                  label="First Name"
                  value={registrationData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  icon={<User size={18} />}
                  placeholder="Enter your first name"
                  required
                />

                <Input
                  label="Last Name (Optional)"
                  value={registrationData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  icon={<User size={18} />}
                  placeholder="Enter your last name"
                />

                <Input
                  label="Email (Optional)"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  icon={<Mail size={18} />}
                  placeholder="Enter your email"
                />

                <Input
                  label="Phone (Optional)"
                  type="tel"
                  value={registrationData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  icon={<Phone size={18} />}
                  placeholder="Enter your phone number"
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

        {/* Error Display */}
        {error && (
          <Card className="mb-6 bg-accent-red/15 border-accent-red/30">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-accent-red flex-shrink-0" />
              <div>
                <h4 className="font-medium text-accent-red">Authentication Error</h4>
                <p className="text-sm text-accent-red/80 mt-1">{error}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearError())}
              className="mt-3 text-accent-red"
            >
              Try Again
            </Button>
          </Card>
        )}

        {/* Info Section */}
        <Card className="bg-accent-primary/10 border-accent-primary/20">
          <div className="text-center">
            <h3 className="font-semibold text-accent-primary mb-2">
              Why sign in?
            </h3>
            <ul className="text-sm text-accent-primary/80 space-y-1">
              <li>Book and manage appointments</li>
              <li>Save favorite specialists</li>
              <li>Track booking history</li>
              <li>Get personalized recommendations</li>
              <li>Earn loyalty points</li>
            </ul>
          </div>
        </Card>

        {/* Browse without account */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-text-secondary"
          >
            Browse without account
          </Button>
        </div>
      </div>
    </div>
  );
};
