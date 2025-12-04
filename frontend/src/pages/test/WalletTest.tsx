import React from 'react';
import WalletDashboard from '../../components/wallet/WalletDashboard';

const WalletTest: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Wallet & Referral System Test</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <WalletDashboard />
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Test Notes:</h2>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>Wallet Balance: Shows current balance with privacy toggle</li>
          <li>Transaction History: Displays all wallet transactions with filtering</li>
          <li>Earnings Tab: Integrates referral analytics with wallet transactions</li>
          <li>Real-time Updates: Balance and transactions refresh automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletTest;