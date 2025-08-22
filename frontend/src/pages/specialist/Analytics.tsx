import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { RootState, AppDispatch } from '../../store';
import { analyticsService } from '../../services/analytics.service';

// Mock analytics data structure
interface AnalyticsData {
  stats: {
    totalRevenue: number;
    totalBookings: number;
    totalClients: number;
    avgRating: number;
    profileViews: number;
    messagesReceived: number;
    responseRate: number;
    rating: number;
    reviewCount: number;
    responseTime: number;
    completionRate: number;
    conversionRate: number;
  };
  services: Array<{
    name: string;
    bookings: number;
    price: number;
  }>;
  dailyStats: {
    revenue: number[];
    bookings: number[];
    labels: string[];
  };
  weeklyStats: {
    revenue: number[];
    bookings: number[];
    labels: string[];
  };
  monthlyStats: {
    revenue: number[];
    bookings: number[];
    labels: string[];
  };
  yearlyStats: {
    revenue: number[];
    bookings: number[];
    labels: string[];
  };
}

// Category colors for charts
const categoryColors = {
  'Психологічна консультація': '#3B82F6', // blue
  'Індивідуальна терапія': '#10B981', // green
  'Сімейна консультація': '#F59E0B', // yellow
  'Групова терапія': '#EF4444', // red
  'Експрес-консультація': '#8B5CF6', // purple
  'Підліткова психологія': '#06B6D4', // cyan
  'Терапія пар': '#EC4899', // pink
  'Психологічна діагностика': '#84CC16', // lime
};

interface ChartProps {
  data: number[];
  labels: string[];
  type: 'line' | 'bar' | 'pie';
  color?: string;
  height?: string;
}

// Simple CSS-based chart components
const SimpleLineChart: React.FC<ChartProps> = ({ data, labels, height = '200px' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range * 80 + 10);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b97f2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b97f2" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="#3b97f2"
          strokeWidth="0.5"
          points={points}
        />
        <polygon
          fill="url(#lineGradient)"
          points={`0,100 ${points} 100,100`}
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-1">
        {labels.map((label, index) => (
          <span key={index} className="text-center">{label}</span>
        ))}
      </div>
    </div>
  );
};

const SimpleBarChart: React.FC<ChartProps> = ({ data, labels, color = '#3b97f2', height = '200px' }) => {
  const max = Math.max(...data);
  
  return (
    <div className="flex items-end justify-between space-x-1" style={{ height }}>
      {data.map((value, index) => {
        const barHeight = (value / max) * 80; // 80% max height
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="text-xs text-gray-600 mb-1">{value}</div>
            <div
              className="w-full rounded-t transition-all duration-500 ease-out"
              style={{
                height: `${barHeight}%`,
                backgroundColor: color,
                minHeight: '4px'
              }}
            />
            <div className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
              {labels[index]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SimplePieChart: React.FC<{ data: { label: string; value: number; color: string }[]; height?: string }> = ({ data, height = '200px' }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;
  
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percent = (item.value / total) * 100;
            const strokeDasharray = `${percent} ${100 - percent}`;
            const strokeDashoffset = -cumulativePercent;
            cumulativePercent += percent;
            
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
      </div>
      <div className="ml-6">
        {data.map((item, index) => (
          <div key={index} className="flex items-center mb-2">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-semibold ml-2">{((item.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SpecialistAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    stats: {
      totalRevenue: 15420,
      totalBookings: 89,
      totalClients: 62,
      avgRating: 4.8,
      profileViews: 1247,
      messagesReceived: 156,
      responseRate: 95,
      rating: 4.8,
      reviewCount: 24,
      responseTime: 15,
      completionRate: 98,
      conversionRate: 85
    },
    services: [
      { name: 'Психологічна консультація', bookings: 25, price: 800 },
      { name: 'Індивідуальна терапія', bookings: 18, price: 1200 },
      { name: 'Сімейна консультація', bookings: 12, price: 1500 },
      { name: 'Групова терапія', bookings: 8, price: 600 }
    ],
    dailyStats: {
      revenue: [1200, 1500, 980, 1800, 1350, 2100, 1750],
      bookings: [3, 4, 2, 5, 3, 6, 4],
      labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
    },
    weeklyStats: {
      revenue: [4200, 5800, 3900, 6200],
      bookings: [12, 16, 10, 18],
      labels: ['Тиж 1', 'Тиж 2', 'Тиж 3', 'Тиж 4']
    },
    monthlyStats: {
      revenue: [12500, 15200, 8900, 18600, 14200, 16800],
      bookings: [45, 52, 38, 67, 48, 58],
      labels: ['Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип']
    },
    yearlyStats: {
      revenue: [89000, 125000, 156000],
      bookings: [320, 445, 567],
      labels: ['2022', '2023', '2024']
    }
  });
  const [selectedView, setSelectedView] = useState<'revenue' | 'bookings' | 'customers'>('revenue');
  
  // Service name translation mapping
  const getTranslatedServiceName = (ukrainianName: string): string => {
    const serviceMapping: { [key: string]: string } = {
      'Індивідуальна консультація': 'service.individualTherapy',
      'Сімейна терапія': 'service.familyConsultation', 
      'Групова терапія': 'service.groupTherapy',
      'Експрес-консультація': 'service.expressConsultation',
    };
    
    return serviceMapping[ukrainianName] ? t(serviceMapping[ukrainianName]) : ukrainianName;
  };
  
  // Translate chart labels for different periods
  const translateChartLabels = (labels: string[], period: string): string[] => {
    switch (period) {
      case 'monthly':
        // Ukrainian month names to translation keys
        const monthMap: { [key: string]: string } = {
          'Січ': 'month.january', 'Лют': 'month.february', 'Бер': 'month.march', 'Кві': 'month.april',
          'Тра': 'month.may', 'Чер': 'month.june', 'Лип': 'month.july', 'Сер': 'month.august'
        };
        return labels.map(label => monthMap[label] ? t(monthMap[label]) : label);
        
      case 'daily':
        // Ukrainian weekday names to translation keys
        const dayMap: { [key: string]: string } = {
          'Пн': 'weekday.monday', 'Вт': 'weekday.tuesday', 'Ср': 'weekday.wednesday', 
          'Чт': 'weekday.thursday', 'Пт': 'weekday.friday', 'Сб': 'weekday.saturday', 'Нд': 'weekday.sunday'
        };
        return labels.map(label => dayMap[label] ? t(dayMap[label]) : label);
        
      case 'weekly':
        // Ukrainian week numbers to translated format
        return labels.map(label => label.replace('Тиж', t('schedule.week')));
        
      default:
        return labels; // yearly and other periods are already in numbers/English
    }
  };
  
  const stats = analyticsData.stats;
  
  // Get the appropriate data based on selected period
  const getDataForPeriod = () => {
    switch (selectedPeriod) {
      case 'daily':
        return analyticsData.dailyStats;
      case 'weekly':
        return analyticsData.weeklyStats;
      case 'monthly':
        return analyticsData.monthlyStats;
      case 'yearly':
        return analyticsData.yearlyStats;
      default:
        return analyticsData.monthlyStats;
    }
  };
  
  const currentPeriodData = getDataForPeriod();
  
  // Calculate current period totals and growth
  const getCurrentPeriodStats = () => {
    const currentRevenue = currentPeriodData.revenue.reduce((sum, val) => sum + val, 0);
    const currentBookings = currentPeriodData.bookings.reduce((sum, val) => sum + val, 0);
    const avgRevenue = currentRevenue / currentPeriodData.revenue.length;
    const avgBookings = currentBookings / currentPeriodData.bookings.length;
    
    // Calculate growth (simplified - comparing last value to average)
    const lastRevenue = currentPeriodData.revenue[currentPeriodData.revenue.length - 1];
    const lastBookings = currentPeriodData.bookings[currentPeriodData.bookings.length - 1];
    
    const revenueGrowth = avgRevenue > 0 ? ((lastRevenue - avgRevenue) / avgRevenue) * 100 : 0;
    const bookingGrowth = avgBookings > 0 ? ((lastBookings - avgBookings) / avgBookings) * 100 : 0;
    
    return {
      currentRevenue,
      currentBookings,
      revenueGrowth,
      bookingGrowth,
      avgRevenue,
      avgBookings
    };
  };
  
  const periodStats = getCurrentPeriodStats();
  
  // Service performance data for pie chart
  const serviceData = analyticsData.services.map((service, index) => ({
    label: getTranslatedServiceName(service.name),
    value: service.bookings,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index] || '#6B7280'
  }));
  
  // Revenue by service for bar chart
  const serviceRevenue = analyticsData.services.map(service => service.price * service.bookings);
  
  return (
    
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('dashboard.nav.analytics')}
            </h1>
            <p className="text-gray-600">
              {t('analytics.subtitle')}
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="mt-4 lg:mt-0 flex space-x-2">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t(`analytics.${period}`)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {selectedPeriod === 'yearly' ? t('analytics.total') : t(`analytics.${selectedPeriod}`)} {t('dashboard.analytics.revenue')}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(selectedPeriod === 'yearly' ? (stats?.totalRevenue || 0) : (periodStats?.currentRevenue || 0))}
                </p>
                <div className="flex items-center mt-2">
                  <div className={`flex items-center ${
                    periodStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <svg className={`w-4 h-4 mr-1 ${
                      periodStats.revenueGrowth >= 0 ? 'rotate-0' : 'rotate-180'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold">
                      {Math.abs(periodStats.revenueGrowth).toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{t('analytics.vsAverage')}</span>
                </div>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Monthly Revenue */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('analytics.average')} {t(`analytics.${selectedPeriod}`)} {t('dashboard.analytics.revenue')}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(periodStats.avgRevenue)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {t('analytics.total')}: {formatPrice(periodStats.currentRevenue)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Total Bookings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {selectedPeriod === 'yearly' ? t('analytics.total') : t(`analytics.${selectedPeriod}`)} {t('dashboard.analytics.bookings')}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(selectedPeriod === 'yearly' ? (stats?.totalBookings || 0) : (periodStats?.currentBookings || 0)).toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <div className={`flex items-center ${
                    periodStats.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <svg className={`w-4 h-4 mr-1 ${
                      periodStats.bookingGrowth >= 0 ? 'rotate-0' : 'rotate-180'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold">
                      {Math.abs(periodStats.bookingGrowth).toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{t('analytics.vsAverage')}</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Average Rating */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('dashboard.specialist.averageRating')}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.rating || 0}
                </p>
                <div className="flex items-center mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(stats?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {stats?.reviewCount || 0} {t('rating.reviews')}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedView === 'revenue' ? t('analytics.revenueTrend') : t('analytics.bookingsTrend')} ({t(`analytics.${selectedPeriod}`)})
              </h2>
              <div className="flex space-x-2">
                {(['revenue', 'bookings'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setSelectedView(view)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      selectedView === view
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t(`dashboard.analytics.${view}`)}
                  </button>
                ))}
              </div>
            </div>
            <SimpleLineChart
              data={selectedView === 'revenue' ? currentPeriodData.revenue : currentPeriodData.bookings}
              labels={translateChartLabels(currentPeriodData.labels, selectedPeriod)}
              type="line"
              height="300px"
            />
          </div>
          
          {/* Service Performance Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('analytics.servicePerformance')}</h2>
            <SimplePieChart data={serviceData} height="300px" />
          </div>
        </div>
        
        {/* Service Revenue Analysis */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('analytics.revenueByService')}</h2>
          <SimpleBarChart
            data={serviceRevenue}
            labels={analyticsData.services.map(s => getTranslatedServiceName(s.name))}
            color="#10B981"
            height="300px"
          />
        </div>
        
        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('analytics.responseTime')}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.responseTime || 0}m
                </p>
                <p className="text-xs text-green-600 mt-1">{t('analytics.excellent')}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('analytics.completionRate')}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.completionRate || 0}%
                </p>
                <p className="text-xs text-green-600 mt-1">{t('analytics.outstanding')}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('analytics.profileViews')}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {(stats?.profileViews || 0).toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">+12% {t('analytics.thisMonth')}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('analytics.conversionRate')}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.conversionRate || 0}%
                </p>
                <p className="text-xs text-orange-600 mt-1">{t('analytics.industryAvg')} 18%</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Export & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('analytics.exportPdfReport')}
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('analytics.exportCsvData')}
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            {t('analytics.shareAnalytics')}
          </button>
        </div>
        </div>
      </div>
    
  );
};

export default SpecialistAnalytics;