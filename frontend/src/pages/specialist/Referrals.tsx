import React from 'react';
import { ReferralDashboard } from '../../components/referral';

const SpecialistReferrals: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>

      <div className="relative p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <ReferralDashboard userType="specialist" />
      </div>
    </div>
  );
};

export default SpecialistReferrals;