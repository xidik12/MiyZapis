import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'invalid';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('No verification token provided.');
      return;
    }

    handleEmailVerification();
  }, [token]);

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
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Email
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              You will be redirected to your dashboard in a few seconds...
            </p>
            <Link
              to="/dashboard"
              className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        );

      case 'error':
      case 'expired':
      case 'invalid':
        return (
          <div className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            {(status === 'expired' || status === 'error') && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Request New Verification Email
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      placeholder="Enter your email address"
                    />
                  </div>
                  
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !email.trim()}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;