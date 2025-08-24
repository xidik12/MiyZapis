import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  DocumentArrowDownIcon, 
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { specialistService } from '../../services/specialist.service';
import { paymentService } from '../../services/payment.service';
import { analyticsService } from '../../services/analytics.service';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  pending: number;
  lastPayout: number;
  completedBookings: number;
  activeClients: number;
  averageBookingValue: number;
  monthlyGrowth: number;
  conversionRate: number;
  repeatCustomers: number;
  peakHours: string;
  bestDay: string;
  avgSessionValue: number;
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

interface LoadingState {
  earnings: boolean;
  payments: boolean;
  analytics: boolean;
}

interface ErrorState {
  earnings: string | null;
  payments: string | null;
  analytics: string | null;
}

const SpecialistEarnings: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState<LoadingState>({
    earnings: true,
    payments: true,
    analytics: true
  });
  const [errors, setErrors] = useState<ErrorState>({
    earnings: null,
    payments: null,
    analytics: null
  });

  // Translate month names
  const getTranslatedMonth = (monthAbbr: string): string => {
    const monthMapping: { [key: string]: string } = {
      'Jan': 'month.january', 'Feb': 'month.february', 'Mar': 'month.march',
      'Apr': 'month.april', 'May': 'month.may', 'Jun': 'month.june',
      'Jul': 'month.july', 'Aug': 'month.august', 'Sep': 'month.september',
      'Oct': 'month.october', 'Nov': 'month.november', 'Dec': 'month.december'
    };
    return monthMapping[monthAbbr] ? t(monthMapping[monthAbbr]) : monthAbbr;
  };

  // Translate payment methods
  const getTranslatedPaymentMethod = (method: string): string => {
    const methodMapping: { [key: string]: string } = {
      'Bank Transfer': 'earnings.paymentMethod.bankTransfer',
      'PayPal': 'earnings.paymentMethod.paypal',
      'Stripe': 'earnings.paymentMethod.stripe',
      'card': 'earnings.paymentMethod.card'
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
    monthlyGrowth: 0,
    conversionRate: 0,
    repeatCustomers: 0,
    peakHours: '',
    bestDay: '',
    avgSessionValue: 0
  });

  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);

  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);

  // Load earnings data from API
  useEffect(() => {
    const loadEarningsData = async () => {
      // Load revenue data from specialist service
      try {
        setLoading(prev => ({ ...prev, earnings: true }));
        setErrors(prev => ({ ...prev, earnings: null }));
        
        const revenueData = await specialistService.getRevenueBreakdown(selectedPeriod);
        const customerInsights = await specialistService.getCustomerInsights();
        const analytics = await specialistService.getAnalytics(selectedPeriod);
        
        // Transform revenue data to match our interface
        const transformedEarnings: EarningsData = {
          totalEarnings: revenueData.totalRevenue,
          thisMonth: revenueData.totalRevenue, // Current period revenue
          pending: revenueData.pendingRevenue,
          lastPayout: revenueData.paidRevenue,
          completedBookings: analytics.totalBookings,
          activeClients: customerInsights.totalCustomers,
          averageBookingValue: revenueData.breakdown.length > 0 
            ? revenueData.breakdown.reduce((sum, item) => sum + (item.revenue / item.bookings || 0), 0) / revenueData.breakdown.length
            : 0,
          monthlyGrowth: calculateGrowthRate(revenueData.breakdown),
          conversionRate: analytics.conversionRate || 0,
          repeatCustomers: customerInsights.repeatCustomers || 0,
          peakHours: determinePeakHours(revenueData.breakdown),
          bestDay: determineBestDay(revenueData.breakdown),
          avgSessionValue: revenueData.breakdown.length > 0 
            ? revenueData.breakdown.reduce((sum, item) => sum + (item.revenue / item.bookings || 0), 0) / revenueData.breakdown.length
            : 0
        };
        
        setEarningsData(transformedEarnings);
        
        // Transform monthly breakdown
        const transformedMonthly = revenueData.breakdown.map(item => ({
          month: formatDateToMonth(item.date),
          earnings: item.revenue,
          bookings: item.bookings
        }));
        
        setMonthlyEarnings(transformedMonthly);
        setLoading(prev => ({ ...prev, earnings: false }));
      } catch (err: any) {
        console.error('Error loading earnings:', err);
        setErrors(prev => ({ ...prev, earnings: err.message || 'Failed to load earnings data' }));
        setLoading(prev => ({ ...prev, earnings: false }));
      }
    };

    const loadPaymentHistory = async () => {
      try {
        setLoading(prev => ({ ...prev, payments: true }));
        setErrors(prev => ({ ...prev, payments: null }));
        
        const paymentHistoryData = await paymentService.getPaymentHistory({
          limit: 10,
          status: 'completed'
        });
        
        // Transform payment data to match our interface
        const transformedHistory: PayoutHistory[] = paymentHistoryData.payments.map(payment => ({
          id: payment.id,
          date: payment.createdAt || payment.updatedAt,
          amount: payment.amount,
          status: payment.status === 'succeeded' ? 'completed' : payment.status === 'pending' ? 'pending' : 'processing',
          method: payment.paymentMethod?.type || 'card'
        }));
        
        setPayoutHistory(transformedHistory);
        setLoading(prev => ({ ...prev, payments: false }));
      } catch (err: any) {
        console.error('Error loading payment history:', err);
        setErrors(prev => ({ ...prev, payments: err.message || 'Failed to load payment history' }));
        setLoading(prev => ({ ...prev, payments: false }));
      }
    };

    loadEarningsData();
    loadPaymentHistory();
  }, [selectedPeriod]);

  // Helper functions
  const calculateGrowthRate = (breakdown: Array<{ date: string; revenue: number }>) => {
    if (breakdown.length < 2) return 0;
    const recent = breakdown.slice(-2);
    const oldValue = recent[0].revenue;
    const newValue = recent[1].revenue;
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  };

  const determinePeakHours = (breakdown: Array<{ date: string; revenue: number }>) => {
    // This is a simplified implementation. In a real scenario, you'd analyze hourly data
    const hasData = breakdown.some(item => item.revenue > 0);
    return hasData ? t('earnings.timeFormat.afternoon') : t('earnings.noData');
  };

  const determineBestDay = (breakdown: Array<{ date: string; revenue: number }>) => {
    if (breakdown.length === 0) return t('earnings.noData');
    const bestDay = breakdown.reduce((best, current) => 
      current.revenue > best.revenue ? current : best
    );
    const dayName = new Date(bestDay.date).toLocaleDateString('en', { weekday: 'long' });
    return t(`earnings.weekday.${dayName.toLowerCase()}`) || dayName;
  };

  const formatDateToMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en', { month: 'short' });
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    
    try {
      // Use analytics service to export data
      const blob = await analyticsService.exportAnalytics('revenue', {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        endDate: new Date().toISOString()
      }, 'csv');
      
      // Create and download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `earnings-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setErrors(prev => ({ ...prev, analytics: 'Failed to export report' }));
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

      {/* Error Display */}
      {(errors.earnings || errors.payments || errors.analytics) && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {t('earnings.errorTitle')}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                {errors.earnings && <p>{errors.earnings}</p>}
                {errors.payments && <p>{errors.payments}</p>}
                {errors.analytics && <p>{errors.analytics}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.totalEarnings')}</p>
              {loading.earnings ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${earningsData.totalEarnings.toFixed(2)}
                </p>
              )}
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
              {loading.earnings ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${earningsData.thisMonth.toFixed(2)}
                </p>
              )}
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
              {loading.earnings ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-orange-600">
                  ${earningsData.pending.toFixed(2)}
                </p>
              )}
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
              {loading.earnings ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${earningsData.lastPayout.toFixed(2)}
                </p>
              )}
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
              {loading.earnings ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {earningsData.completedBookings}
                </p>
              )}
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
              {loading.earnings ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {earningsData.activeClients}
                </p>
              )}
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
              {loading.earnings ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${earningsData.averageBookingValue.toFixed(2)}
                </p>
              )}
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
              {loading.earnings ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className={`text-2xl font-bold ${earningsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {earningsData.monthlyGrowth >= 0 ? '+' : ''}{earningsData.monthlyGrowth}%
                </p>
              )}
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
            {loading.earnings ? (
              Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-10 relative overflow-hidden">
                      <div className="bg-gray-200 dark:bg-gray-600 h-full rounded-lg animate-pulse" style={{ width: `${Math.random() * 80 + 20}%` }}></div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : monthlyEarnings.length > 0 ? (
              monthlyEarnings.map((item, index) => (
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
                        <span className="text-white text-sm font-semibold shadow-sm">${item.earnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                      {item.bookings} {t('earnings.bookings')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('earnings.noDataAvailable')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('earnings.recentPayouts')}</h3>
          <div className="space-y-4">
            {loading.payments ? (
              Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                </div>
              ))
            ) : payoutHistory.length > 0 ? (
              payoutHistory.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${payout.amount.toFixed(2)}
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('earnings.noPayoutHistory')}</p>
              </div>
            )}
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
                {loading.earnings ? (
                  <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">{earningsData.conversionRate.toFixed(1)}%</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.repeatCustomers')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">{earningsData.repeatCustomers}%</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.avgSessionValue')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">${earningsData.avgSessionValue.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Time Analysis */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">{t('earnings.timeAnalysis')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.peakHours')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">{earningsData.peakHours || t('earnings.noData')}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.bestDay')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">{earningsData.bestDay || t('earnings.noData')}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.avgBookingDuration')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">90 {t('earnings.duration.minutes')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Growth Insights */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">{t('earnings.growthInsights')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.monthlyGrowth')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className={`font-medium ${earningsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {earningsData.monthlyGrowth >= 0 ? '+' : ''}{earningsData.monthlyGrowth}%
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.newCustomers')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">+{Math.max(0, earningsData.activeClients - earningsData.repeatCustomers)} {t('earnings.thisMonthShort')}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('earnings.revenueTrend')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className={`font-medium ${earningsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {earningsData.monthlyGrowth >= 0 ? t('earnings.increasing') : t('earnings.decreasing')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    
  );
};

export default SpecialistEarnings;