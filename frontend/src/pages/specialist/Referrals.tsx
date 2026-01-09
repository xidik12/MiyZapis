import React from 'react';
import { ReferralDashboard } from '../../components/referral';

const SpecialistReferrals: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <ReferralDashboard userType="specialist" />
      </div>
    </div>
  );
};

export default SpecialistReferrals;