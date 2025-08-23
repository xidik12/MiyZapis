import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  DocumentArrowDownIcon, 
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  pending: number;
  lastPayout: number;
  completedBookings: number;
  activeClients: number;
  averageBookingValue: number;
  monthlyGrowth: number;
}

interface MonthlyEarning {
  month: string;
  earnings: number;
  bookings: number;
}

interface PayoutHistory {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  method: string;
}

const SpecialistEarnings: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isExporting, setIsExporting] = useState(false);

  // Translate month names
  const getTranslatedMonth = (monthAbbr: string): string => {
    const monthMapping: { [key: string]: string } = {
      'Jan': 'month.january', 'Feb': 'month.february', 'Mar': 'month.march',
      'Apr': 'month.april', 'May': 'month.may', 'Jun': 'month.june',
      'Jul': 'month.july'
    };
    return monthMapping[monthAbbr] ? t(monthMapping[monthAbbr]) : monthAbbr;
  };

  // Translate payment methods
  const getTranslatedPaymentMethod = (method: string): string => {
    const methodMapping: { [key: string]: string } = {
      'Bank Transfer': 'earnings.paymentMethod.bankTransfer',
      'PayPal': 'earnings.paymentMethod.paypal'
    };
    return methodMapping[method] ? t(methodMapping[method]) : method;
  };

  // Initialize with empty data for new accounts
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonth: 0,
    pending: 0,
    lastPayout: 0,
    completedBookings: 0,
    activeClients: 0,
    averageBookingValue: 0,
    monthlyGrowth: 0
  });

  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);

  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);

  // Load earnings data from API
  useEffect(() => {
    const loadEarningsData = async () => {
      try {
        // For now, keep empty data for new accounts
        // TODO: Integrate with real earnings/payments API when backend is ready
        console.log('Earnings data would be loaded from API here');
        
        // Real data should come from API calls to:
        // - await paymentsService.getEarnings();
        // - await paymentsService.getPayoutHistory();
      } catch (err: any) {
        console.error('Error loading earnings:', err);
      }
    };

    loadEarningsData();
  }, []);

  const handleExportReport = async () => {
    setIsExporting(true);
    
    try {
      // Create CSV content
      const csvContent = generateCSVReport();
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `earnings-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSVReport = (): string => {
    const headers = ['Date', 'Earnings (USD)', 'Bookings', 'Status'];
    const rows = monthlyEarnings.map(item => [
      item.month,
      item.earnings.toString(),
      item.bookings.toString(),
      'Completed'
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    return csvContent;
  };

  return (
    
      <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.nav.earnings')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('earnings.subtitle')}</p>
        </div>
        <button 
          onClick={handleExportReport}
          disabled={isExporting}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>{isExporting ? t('earnings.exporting') : t('earnings.exportReport')}</span>
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.totalEarnings')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${earningsData.totalEarnings}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.thisMonth')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${earningsData.thisMonth}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.pending')}</p>
              <p className="text-2xl font-bold text-orange-600">
                ${earningsData.pending}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.lastPayout')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${earningsData.lastPayout}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.completedBookings')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {earningsData.completedBookings}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.activeClients')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {earningsData.activeClients}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.averageBookingValue')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${earningsData.averageBookingValue}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.monthlyGrowth')}</p>
              <p className="text-2xl font-bold text-green-600">
                +{earningsData.monthlyGrowth}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Earnings Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('earnings.monthlyEarnings')}</h3>
            <div className="flex space-x-2">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t(`schedule.${period}`)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Enhanced Bar Chart */}
          <div className="space-y-3">
            {monthlyEarnings.map((item, index) => (
              <div key={item.month} className="flex items-center space-x-3">
                <div className="w-16 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {getTranslatedMonth(item.month)}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-10 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-500 ease-out"
                      style={{ width: `${(item.earnings / Math.max(...monthlyEarnings.map(m => m.earnings))) * 100}%` }}
                    >
                      <span className="text-white text-sm font-semibold shadow-sm">${item.earnings}</span>
                    </div>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                    {item.bookings} {t('earnings.bookings')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('earnings.recentPayouts')}</h3>
          <div className="space-y-4">
            {payoutHistory.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    ${payout.amount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(payout.date).toLocaleDateString()} • {getTranslatedPaymentMethod(payout.method)}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  payout.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : payout.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                }`}>
                  {t(`earnings.${payout.status}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Earnings Analytics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('earnings.detailedAnalytics')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">{t('earnings.performanceMetrics')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.conversionRate')}</span>
                <span className="font-medium text-gray-900 dark:text-white">12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.repeatCustomers')}</span>
                <span className="font-medium text-gray-900 dark:text-white">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.avgSessionValue')}</span>
                <span className="font-medium text-gray-900 dark:text-white">${earningsData.averageBookingValue}</span>
              </div>
            </div>
          </div>

          {/* Time Analysis */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">{t('earnings.timeAnalysis')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.peakHours')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{t('earnings.timeFormat.afternoon')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.bestDay')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{t('earnings.weekday.thursday')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.avgBookingDuration')}</span>
                <span className="font-medium text-gray-900 dark:text-white">90 {t('earnings.duration.minutes')}</span>
              </div>
            </div>
          </div>

          {/* Growth Insights */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">{t('earnings.growthInsights')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.monthlyGrowth')}</span>
                <span className="font-medium text-green-600">+{earningsData.monthlyGrowth}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.newCustomers')}</span>
                <span className="font-medium text-gray-900 dark:text-white">+8 {t('earnings.thisMonthShort')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.revenueTrend')}</span>
                <span className="font-medium text-green-600">{t('earnings.increasing')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    
  );
};

export default SpecialistEarnings;