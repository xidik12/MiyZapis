import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { loyaltyService, ReferralProgram, UserReferral } from '@/services/loyalty.service';
import { toast } from 'react-toastify';
import {
  UsersIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  GiftIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  QrCodeIcon,
  LinkIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
} from '@/components/icons';

const CustomerReferrals: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [referralProgram, setReferralProgram] = useState<ReferralProgram | null>(null);
  const [userReferrals, setUserReferrals] = useState<UserReferral[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const [program, referrals] = await Promise.all([
        loyaltyService.getReferralProgram().catch(() => null), // May not exist yet
        loyaltyService.getUserReferrals()
      ]);

      setReferralProgram(program);
      setUserReferrals(referrals);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error(t('referrals.loadError') || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferralCode = async () => {
    try {
      setCreating(true);
      const newProgram = await loyaltyService.createReferralCode();
      setReferralProgram(newProgram);
      toast.success(t('referrals.createSuccess') || 'Referral code created successfully!');
    } catch (error) {
      console.error('Error creating referral code:', error);
      toast.error(t('referrals.createError') || 'Failed to create referral code');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('clipboard.copied') || 'Copied to clipboard');
    } catch (error) {
      toast.error(t('clipboard.copyError') || 'Failed to copy to clipboard');
    }
  };

  const generateShareUrl = () => {
    if (!referralProgram) return '';
    return `${window.location.origin}/register?ref=${referralProgram.code}`;
  };

  const generateShareText = () => {
    if (!referralProgram) return '';
    return `Join Panhaha with my referral code "${referralProgram.code}" and we both get ${referralProgram.refereePoints} loyalty points! 🎉 Book amazing services at ${generateShareUrl()}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'EXPIRED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const completedReferrals = userReferrals.filter(r => r.status === 'COMPLETED');
  const pendingReferrals = userReferrals.filter(r => r.status === 'PENDING');
  const totalPointsEarned = completedReferrals.reduce((sum, r) => sum + r.referrerPoints, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading referral program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Referral Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Invite friends and earn loyalty points together
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Referrals</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {userReferrals.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {completedReferrals.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {pendingReferrals.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Points Earned</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {totalPointsEarned.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <GiftIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        {!referralProgram ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 mb-8 text-center">
            <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Create Your Referral Code
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start earning points by inviting friends to join Panhaha
            </p>
            <button
              onClick={handleCreateReferralCode}
              disabled={creating}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Referral Code
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl shadow-sm p-8 border border-primary-200 dark:border-primary-800 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Your Referral Code
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share this code with friends and both of you get {referralProgram.refereePoints} loyalty points!
              </p>
            </div>

            {/* Referral Code Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Referral Code</p>
                    <p className="text-3xl font-mono font-bold text-primary-600 dark:text-primary-400 tracking-wider">
                      {referralProgram.code}
                    </p>
                  </div>
                  
                  <div className="hidden md:block h-12 w-px bg-gray-200 dark:bg-gray-600"></div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Used</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {referralProgram.currentUses}
                      {referralProgram.maxUses && (
                        <span className="text-lg text-gray-500"> / {referralProgram.maxUses}</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(referralProgram.code, 'Referral code')}
                  className="flex items-center px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/30 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                  Copy Code
                </button>
              </div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => copyToClipboard(generateShareUrl(), 'Referral link')}
                className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <LinkIcon className="h-6 w-6 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Copy Link</span>
              </button>

              <button
                onClick={() => copyToClipboard(generateShareText(), 'Share message')}
                className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Share Text</span>
              </button>

              <a
                href={`mailto:?subject=Join Panhaha&body=${encodeURIComponent(generateShareText())}`}
                className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <EnvelopeIcon className="h-6 w-6 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Email</span>
              </a>

              <a
                href={`sms:?body=${encodeURIComponent(generateShareText())}`}
                className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <DevicePhoneMobileIcon className="h-6 w-6 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">SMS</span>
              </a>
            </div>

            {/* Referral URL */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your referral link:</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 px-3 py-2 rounded border font-mono overflow-x-auto">
                  {generateShareUrl()}
                </code>
                <button
                  onClick={() => copyToClipboard(generateShareUrl(), 'Referral link')}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Referrals List */}
        {userReferrals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Referral History
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track your referral progress and earnings
              </p>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {userReferrals.map((referral) => (
                <div key={referral.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(referral.status)}
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Referral Code: {referral.code}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                            {referral.status.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {referral.referrerPoints} points
                      </p>
                      {referral.status === 'COMPLETED' && referral.completedAt && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Completed {new Date(referral.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for No Referrals */}
        {userReferrals.length === 0 && referralProgram && (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No referrals yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start sharing your referral code to earn loyalty points!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReferrals;
