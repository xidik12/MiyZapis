import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@/components/icons';

type VerificationStatus = 'loading' | 'success' | 'pending' | 'error' | 'expired' | 'invalid';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const token = searchParams.get('token');
  const navigationState = location.state as { email?: string; message?: string } | null;

  useEffect(() => {
    // Check if we came from registration (with email and message in navigation state)
    if (!token && navigationState?.email && navigationState?.message) {
      setStatus('pending');
      setEmail(navigationState.email);
      setMessage(navigationState.message);
      return;
    }

    // Original flow - verify token from email link
    if (!token) {
      setStatus('invalid');
      setMessage('No verification token provided.');
      return;
    }

    handleEmailVerification();
  }, [token, navigationState]);

  const handleEmailVerification = async () => {
    try {
      setStatus('loading');
      
      // Call the enhanced auth API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth-enhanced/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus('success');
        setMessage(result.data.message || 'Email verified successfully!');
        
        // Store tokens if provided
        if (result.data.tokens) {
          localStorage.setItem('accessToken', result.data.tokens.accessToken);
          localStorage.setItem('refreshToken', result.data.tokens.refreshToken);
        }
        
        // Redirect to login after 3 seconds (user needs to login after verification)
        setTimeout(() => {
          navigate('/auth/login', { 
            state: { message: 'Email verified successfully! Please sign in to continue.' } 
          });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error?.message || 'Email verification failed.');
      }
    } catch (error: any) {
      setStatus('error');
      
      if (error.message?.includes('expired')) {
        setStatus('expired');
        setMessage('Your verification link has expired. Please request a new one.');
      } else if (error.message?.includes('invalid')) {
        setStatus('invalid');
        setMessage('Invalid verification link. Please check your email and try again.');
      } else {
        setMessage(error.message || 'Email verification failed. Please try again.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setResendMessage('Please enter your email address.');
      return;
    }

    try {
      setIsResending(true);
      setResendMessage('');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth-enhanced/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (result.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendMessage(result.error?.message || 'Failed to send verification email.');
      }
    } catch (error: any) {
      setResendMessage(error.message || 'Failed to send verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Verifying Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You will be redirected to the login page in a few seconds...
            </p>
            <Link
              to="/auth/login"
              className="inline-block mt-4 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 font-semibold transition-all duration-200 hover:scale-105"
            >
              Go to Login
            </Link>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center">
            <EnvelopeIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Email Verification Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Please check your email ({email}) and click the verification link to activate your account.
            </p>
            
            <div className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Didn't receive the email?
              </h3>
              
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 hover:scale-105"
              >
                {isResending ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>
              
              {resendMessage && (
                <div className={`text-sm mt-4 ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                  {resendMessage}
                </div>
              )}
            </div>

            <div className="mt-6">
              <Link
                to="/auth/login"
                className="text-primary-600 hover:text-primary-500 text-sm font-semibold px-2 py-1 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200"
              >
                Back to Login
              </Link>
            </div>
          </div>
        );

      case 'error':
      case 'expired':
      case 'invalid':
        return (
          <div className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            {(status === 'expired' || status === 'error') && (
              <div className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Request New Verification Email
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                      placeholder="Enter your email address"
                    />
                  </div>
                  
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !email.trim()}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 hover:scale-105"
                  >
                    {isResending ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <EnvelopeIcon className="w-4 h-4 mr-2" />
                        Send Verification Email
                      </>
                    )}
                  </button>
                  
                  {resendMessage && (
                    <div className={`text-sm ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                      {resendMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link
                to="/auth/login"
                className="text-primary-600 hover:text-primary-500 text-sm font-semibold px-2 py-1 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200"
              >
                Back to Login
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl py-8 px-4 shadow-glass border border-gray-200/20 dark:border-gray-700/20 sm:rounded-2xl sm:px-10">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;