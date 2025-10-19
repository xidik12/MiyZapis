import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import WalletDashboard from '../../components/wallet/WalletDashboard';
import { useLanguage } from '../../contexts/LanguageContext';

const SpecialistWallet: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>

      <div className="relative p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/specialist/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {t('navigation.backToDashboard')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletDashboard />
      </div>
      </div>
    </div>
  );
};

export default SpecialistWallet;