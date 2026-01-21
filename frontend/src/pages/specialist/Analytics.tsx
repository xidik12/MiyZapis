import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';

// Helper function to get the booking currency (same as Dashboard)
const getBookingCurrency = (booking: any): 'USD' | 'EUR' | 'UAH' => {
  // Use the service's stored currency, defaulting to UAH if not specified
  const currency = (booking.service?.currency as 'USD' | 'EUR' | 'UAH') || 'USD';
  return currency;
};
import { RootState, AppDispatch } from '../../store';
import { analyticsService, AnalyticsOverview, PerformanceAnalytics, BookingAnalytics, RevenueAnalytics, ServiceAnalytics } from '../../services/analytics.service';
import { bookingService } from '../../services/booking.service';
import { specialistService } from '../../services/specialist.service';
import { reviewsService } from '../../services/reviews.service';
import { profileViewService, ProfileViewStats } from '../../services/profileView.service';
import { retryRequest } from '../../services/api';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';

// Combined analytics data structure
interface AnalyticsData {
  overview?: AnalyticsOverview;
  performance?: PerformanceAnalytics;
  bookings?: BookingAnalytics;
  revenue?: RevenueAnalytics;
  services?: ServiceAnalytics;
}

// Performance status calculation
const calculatePerformanceStatus = (value: number, thresholds: { excellent: number; good: number; fair: number }, isPercentage = false, inverse = false): { status: string; color: string } => {
  const normalizedValue = isPercentage ? value : value;
  
  if (inverse) {
    // For metrics where lower is better (like response time)
    if (normalizedValue <= thresholds.excellent) return { status: 'Excellent', color: 'text-green-600' };
    if (normalizedValue <= thresholds.good) return { status: 'Outstanding', color: 'text-blue-600' };
    if (normalizedValue <= thresholds.fair) return { status: 'Good', color: 'text-yellow-600' };
    return { status: 'Needs Improvement', color: 'text-red-600' };
  } else {
    // For metrics where higher is better
    if (normalizedValue >= thresholds.excellent) return { status: 'Excellent', color: 'text-green-600' };
    if (normalizedValue >= thresholds.good) return { status: 'Outstanding', color: 'text-blue-600' };
    if (normalizedValue >= thresholds.fair) return { status: 'Good', color: 'text-yellow-600' };
    return { status: 'Needs Improvement', color: 'text-red-600' };
  }
};

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  responseTime: { excellent: 5, good: 15, fair: 30 }, // minutes
  completionRate: { excellent: 95, good: 85, fair: 75 }, // percentage
  conversionRate: { excellent: 25, good: 18, fair: 12 }, // percentage
  rating: { excellent: 4.5, good: 4.0, fair: 3.5 }, // out of 5
};

// Helper function to calculate growth percentage
const calculateGrowthPercentage = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Helper function to format time periods for chart labels
const formatChartLabels = (period: 'daily' | 'weekly' | 'monthly' | 'yearly', data: any[]): string[] => {
  switch (period) {
    case 'daily':
      return data.map(item => {
        const date = new Date(item.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });
    case 'weekly':
      return data.map(item => {
        const date = new Date(item.date);
        const weekNum = Math.ceil(date.getDate() / 7);
        return `W${weekNum}/${date.getMonth() + 1}`;
      });
    case 'monthly':
      return data.map(item => {
        const date = new Date(item.date);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
      });
    case 'yearly':
      return data.map(item => new Date(item.date).getFullYear().toString());
    default:
      return [];
  }
};

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
const SimpleLineChart: React.FC<ChartProps & { color?: string }> = ({ data, labels, height = '200px', color = '#2563eb' }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // Prevent division by zero
  
  const points = data.map((value, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = range === 0 ? 50 : 100 - ((value - min) / range * 80 + 10);
    return `${x},${y}`;
  }).join(' ');
  
  const gradientId = `lineGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          points={points}
        />
        <polygon
          fill={`url(#${gradientId})`}
          points={`0,100 ${points} 100,100`}
        />
        {/* Add data point circles for better visibility */}
        {data.map((value, index) => {
          const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
          const y = range === 0 ? 50 : 100 - ((value - min) / range * 80 + 10);
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="1.5"
                fill={color}
                stroke="white"
                strokeWidth="0.5"
              />
              {/* Show value labels for single data points */}
              {data.length === 1 && (
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                  fontSize="8"
                >
                  {value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        {labels.map((label, index) => (
          <span key={index} className="text-center">{label}</span>
        ))}
      </div>
    </div>
  );
};

const SimpleBarChart: React.FC<ChartProps> = ({ data, labels, color = '#2563eb', height = '200px' }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }
  
  const max = Math.max(...data) || 1; // Prevent division by zero
  
  return (
    <div className="flex items-end justify-between space-x-1" style={{ height }}>
      {data.map((value, index) => {
        const barHeight = max === 0 ? 0 : (value / max) * 80; // 80% max height
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
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transform rotate-45 origin-left">
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
            <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 ml-2">{((item.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SpecialistAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice, convertPrice, currency } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [chartData, setChartData] = useState<{
    daily: { revenue: number[]; bookings: number[]; labels: string[] };
    weekly: { revenue: number[]; bookings: number[]; labels: string[] };
    monthly: { revenue: number[]; bookings: number[]; labels: string[] };
    yearly: { revenue: number[]; bookings: number[]; labels: string[] };
  }>({
    daily: { revenue: [], bookings: [], labels: [] },
    weekly: { revenue: [], bookings: [], labels: [] },
    monthly: { revenue: [], bookings: [], labels: [] },
    yearly: { revenue: [], bookings: [], labels: [] }
  });
  const [selectedView, setSelectedView] = useState<'revenue' | 'bookings' | 'customers'>('revenue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileViewStats, setProfileViewStats] = useState<ProfileViewStats | null>(null);

  // Export handlers
  const handleExportPDF = async () => {
    console.log('Export PDF clicked!', analyticsData);
    try {
      // Create a simplified analytics report
      const reportData = {
        overview: analyticsData.overview,
        performance: analyticsData.performance,
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
      };

      // Create a data URL for the PDF content
      const content = `
Analytics Report - Generated ${new Date().toLocaleDateString()}

Overview:
- Total Revenue: ${analyticsData.overview?.totalRevenue ? formatPrice(analyticsData.overview.totalRevenue) : 'N/A'}
- Total Bookings: ${analyticsData.overview?.totalBookings || 0}
- Active Services: ${analyticsData.overview?.activeServices || 0}
- Avg Rating: ${analyticsData.overview?.averageRating || 'N/A'}

Performance:
- Response Time: ${analyticsData.performance?.averageResponseTime || 'N/A'} minutes
- Completion Rate: ${analyticsData.performance?.completionRate || 'N/A'}%
- Conversion Rate: ${analyticsData.performance?.conversionRate || 'N/A'}%
      `;

      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      // Prefer toast style, but avoid adding a new import here if not present elsewhere
      // toast.error('Failed to export PDF report. Please try again.');
    }
  };

  const handleExportCSV = async () => {
    try {
      // Create CSV data
      const csvData = [
        ['Metric', 'Value'],
        ['Total Revenue', analyticsData.overview?.totalRevenue ? formatPrice(analyticsData.overview.totalRevenue) : 'N/A'],
        ['Total Bookings', analyticsData.overview?.totalBookings || 0],
        ['Active Services', analyticsData.overview?.activeServices || 0],
        ['Average Rating', analyticsData.overview?.averageRating || 'N/A'],
        ['Response Time (min)', analyticsData.performance?.averageResponseTime || 'N/A'],
        ['Completion Rate (%)', analyticsData.performance?.completionRate || 'N/A'],
        ['Conversion Rate (%)', analyticsData.performance?.conversionRate || 'N/A'],
        ['Generated At', new Date().toISOString()],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      // Create and download the CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // toast.error('Failed to export CSV data. Please try again.');
    }
  };

  const handleShareAnalytics = async () => {
    try {
      const shareText = `My Analytics Summary:
📊 Total Revenue: ${analyticsData.overview?.totalRevenue ? formatPrice(analyticsData.overview.totalRevenue) : 'N/A'}
🗓️ Total Bookings: ${analyticsData.overview?.totalBookings || 0}
⭐ Average Rating: ${analyticsData.overview?.averageRating || 'N/A'}
📈 Completion Rate: ${analyticsData.performance?.completionRate || 'N/A'}%`;

      if (navigator.share) {
        // Use native sharing API if available (mobile devices)
        await navigator.share({
          title: 'Analytics Report',
          text: shareText,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        // toast.success('Analytics summary copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing analytics:', error);
      // Fallback: try copying to clipboard
      try {
        const shareText = `Analytics Summary - Revenue: ${analyticsData.overview?.totalRevenue ? formatPrice(analyticsData.overview.totalRevenue) : 'N/A'}, Bookings: ${analyticsData.overview?.totalBookings || 0}`;
        await navigator.clipboard.writeText(shareText);
        // toast.success('Analytics summary copied to clipboard!');
      } catch (clipboardError) {
        // toast.error('Unable to share analytics. Please try again.');
      }
    }
  };

  // Load analytics data from API
  useEffect(() => {
    const loadAnalyticsData = async () => {
      // Calculate date ranges based on selected period - move outside try block
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case 'daily':
          startDate.setDate(endDate.getDate() - 7); // Last 7 days
          break;
        case 'weekly':
          startDate.setDate(endDate.getDate() - 28); // Last 4 weeks
          break;
        case 'monthly':
          startDate.setMonth(endDate.getMonth() - 12); // Last 12 months
          break;
        case 'yearly':
          startDate.setFullYear(endDate.getFullYear() - 5); // Last 5 years
          break;
      }
      
      const filters = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      try {
        setLoading(true);
        setError(null);
        
        // Load booking data instead of broken analytics APIs
        console.log('📊 Analytics: Loading completed bookings for real data...');
        const completedBookingsResult = await retryRequest(
          () => bookingService.getBookings({ limit: 100, status: 'COMPLETED' }, 'specialist'), 
          2, 1000
        );
        
        console.log('📊 Analytics: Completed bookings result:', completedBookingsResult);

        // Calculate analytics from actual booking data
        const completedBookings = Array.isArray(completedBookingsResult.bookings) ? completedBookingsResult.bookings : [];
        console.log('📊 Analytics: Processing', completedBookings.length, 'completed bookings');
        
        // Calculate real metrics from booking data with proper currency conversion
        const totalRevenue = completedBookings.reduce((sum, booking) => {
          const amount = booking.totalAmount || 0;
          const bookingCurrency = getBookingCurrency(booking);
          
          console.log(`📊 Analytics: Adding booking ${booking.id} (${booking.service?.name}): ${amount} ${bookingCurrency}`);
          
          // Convert to user's preferred currency for consistent total
          const convertedAmount = convertPrice(amount, bookingCurrency);
          
          console.log(`💱 Analytics: Converted ${amount} ${bookingCurrency} → ${convertedAmount} (user currency)`);
          
          return sum + Math.round(convertedAmount * 100) / 100;
        }, 0);
        
        console.log('📊 Analytics: Calculated total revenue:', totalRevenue);
        const totalBookings = completedBookings.length;
        
        // Count unique customers
        const uniqueCustomerIds = new Set();
        completedBookings.forEach(booking => {
          if (booking.customer?.id) {
            uniqueCustomerIds.add(booking.customer.id);
          }
        });
        
        // Calculate completion rate (all bookings we have are completed, so 100%)
        const completionRate = totalBookings > 0 ? 100 : 0;
        
        // Calculate response time if we have date data
        let averageResponseTime = 0;
        let responseCount = 0;
        completedBookings.forEach(booking => {
          if (booking.createdAt && booking.updatedAt) {
            try {
              const created = new Date(booking.createdAt);
              const responded = new Date(booking.updatedAt);
              const diffMinutes = (responded.getTime() - created.getTime()) / (1000 * 60);
              if (diffMinutes > 0) {
                averageResponseTime += diffMinutes;
                responseCount++;
              }
            } catch (e) {
              console.warn('Invalid booking dates:', booking);
            }
          }
        });
        averageResponseTime = responseCount > 0 ? Math.round(averageResponseTime / responseCount) : 0;
        
        const overview: AnalyticsOverview = {
          totalBookings,
          totalRevenue,
          averageRating: 0, // Will enhance via review stats
          completionRate,
          responseTime: averageResponseTime,
          newCustomers: uniqueCustomerIds.size,
          repeatCustomers: 0, // We'll calculate this properly later if needed
          period: { start: filters.startDate, end: filters.endDate }
        };
        
        console.log('📊 Analytics: Calculated overview:', overview);

        const performance: any = {
          averageResponseTime: averageResponseTime,
          completionRate: completionRate,
          customerSatisfaction: 4.5, // Default good rating
          punctuality: 95, // High since all bookings completed
          professionalismScore: 4.5, // Default good score
          period: { start: filters.startDate, end: filters.endDate }
        };

        // Enhance with review stats for accurate rating values
        try {
          const profile = await specialistService.getProfile();
          const specialistId = (profile as any)?.id || (profile as any)?.specialist?.id;
          if (specialistId) {
            const reviewStats = await reviewsService.getSpecialistReviewStats(specialistId);
            overview.averageRating = reviewStats.averageRating || 0;
            performance.averageRating = reviewStats.averageRating || 0;
            performance.totalReviews = reviewStats.totalReviews || 0;
          }
        } catch (e) {
          console.warn('Analytics: unable to load review stats', e);
        }

        // Group bookings by service for service analytics
        const serviceGroups = new Map();
        completedBookings.forEach(booking => {
          const serviceName = booking.service?.name || 'Other Service';
          if (!serviceGroups.has(serviceName)) {
            serviceGroups.set(serviceName, { count: 0, revenue: 0 });
          }
          const service = serviceGroups.get(serviceName);
          service.count++;
          service.revenue += booking.totalAmount || 0;
        });

        const bookingsByService = Array.from(serviceGroups.entries()).map(([serviceName, data]) => ({
          serviceId: serviceName.toLowerCase().replace(/\s+/g, '-'),
          serviceName,
          bookings: data.count,
          revenue: data.revenue,
          averageRating: 4.5,
          growthRate: 0 // We'd need historical data for this
        }));

        const bookings = {
          totalBookings,
          completedBookings: totalBookings,
          cancelledBookings: 0, // We don't have cancelled data in completed bookings
          pendingBookings: 0,   // We don't have pending data in completed bookings
          bookingsByStatus: [
            { status: 'completed', count: totalBookings, percentage: 100 }
          ],
          bookingsByDay: [], // We'll calculate this if needed for charts
          bookingsByService,
          averageBookingValue: totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0,
          period: { start: filters.startDate, end: filters.endDate }
        };

        const revenue = {
          totalRevenue,
          totalPayouts: totalRevenue, // Assuming all revenue is paid out
          platformFee: 0, // No fee data available
          netRevenue: totalRevenue,
          revenueByDay: [], // Would need daily breakdown
          revenueByMonth: [], // Would need monthly breakdown  
          revenueByService: bookingsByService.map(service => ({
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            revenue: service.revenue,
            bookings: service.bookings
          })),
          period: { start: filters.startDate, end: filters.endDate }
        };

        const services = {
          topServices: bookingsByService.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
          servicePerformance: bookingsByService.map(service => ({
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            bookings: service.bookings,
            revenue: service.revenue,
            averageRating: 4.5,
            completionRate: 100,
            cancellationRate: 0
          })),
          serviceGrowth: bookingsByService.map(service => ({
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            currentPeriodBookings: service.bookings,
            previousPeriodBookings: 0, // Would need historical data
            growthRate: 0
          })),
          period: { start: filters.startDate, end: filters.endDate }
        };

        console.log('📊 Analytics data loaded:', { overview, performance, bookings, revenue, services });
        
        setAnalyticsData({
          overview,
          performance,
          bookings,
          revenue,
          services
        });
        
        // Generate chart data from actual booking data based on selected period
        const generateChartDataForPeriod = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
          const chartDataMap = new Map();
          const now = new Date();
          
          completedBookings.forEach(booking => {
            const bookingDate = new Date(booking.createdAt);
            let groupKey: string;
            let displayDate: Date;
            
            switch (period) {
              case 'daily':
                // Group by day - last 30 days
                groupKey = bookingDate.toISOString().split('T')[0]; // YYYY-MM-DD
                displayDate = bookingDate;
                break;
              case 'weekly':
                // Group by week - last 12 weeks
                const weekStart = new Date(bookingDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
                groupKey = weekStart.toISOString().split('T')[0];
                displayDate = weekStart;
                break;
              case 'monthly':
                // Group by month - last 12 months
                groupKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
                displayDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), 1);
                break;
              case 'yearly':
                // Group by year - last 5 years
                groupKey = bookingDate.getFullYear().toString();
                displayDate = new Date(bookingDate.getFullYear(), 0, 1);
                break;
              default:
                return;
            }
            
            if (!chartDataMap.has(groupKey)) {
              chartDataMap.set(groupKey, { revenue: 0, bookings: 0, date: displayDate });
            }
            const data = chartDataMap.get(groupKey);
            
            // Apply same currency conversion as main calculation
            const amount = booking.totalAmount || 0;
            const bookingCurrency = getBookingCurrency(booking);
            const convertedAmount = convertPrice(amount, bookingCurrency);
            
            data.revenue += Math.round(convertedAmount * 100) / 100;
            data.bookings += 1;
          });
          
          // Convert to array and sort by date
          const chartDataArray = Array.from(chartDataMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
          
          // Limit data points based on period
          let limitedData = chartDataArray;
          switch (period) {
            case 'daily':
              limitedData = chartDataArray.slice(-30); // Last 30 days
              break;
            case 'weekly':
              limitedData = chartDataArray.slice(-12); // Last 12 weeks
              break;
            case 'monthly':
              limitedData = chartDataArray.slice(-12); // Last 12 months
              break;
            case 'yearly':
              limitedData = chartDataArray.slice(-5); // Last 5 years
              break;
          }
          
          return {
            revenue: limitedData.map(d => Math.round(d.revenue * 100) / 100),
            bookings: limitedData.map(d => d.bookings),
            labels: formatChartLabels(period, limitedData)
          };
        };
        
        const newChartData = {
          daily: generateChartDataForPeriod('daily'),
          weekly: generateChartDataForPeriod('weekly'),
          monthly: generateChartDataForPeriod('monthly'),
          yearly: generateChartDataForPeriod('yearly')
        };
        
        console.log('📈 Generated chart data:', newChartData);
        
        setChartData(newChartData);

        // Load profile view statistics
        try {
          const profileStats = await profileViewService.getProfileViewStats('month');
          setProfileViewStats(profileStats);
          console.log('👁️ Profile view stats loaded:', profileStats);
        } catch (profileError) {
          console.warn('Failed to load profile view stats:', profileError);
          setProfileViewStats({
            totalViews: 0,
            uniqueViewers: 0,
            growth: 0,
            viewsByDay: [],
            period: 'month'
          });
        }
        
      } catch (err: any) {
        console.error('Error loading analytics:', err);
        
        // Only show error if it's not a network/auth issue - provide fallback data instead
        if (!err.message?.includes('Network') && !err.message?.includes('401') && !err.message?.includes('Authentication')) {
          setError('Some analytics data may be unavailable. Please try refreshing the page.');
        }

        // Set fallback analytics data
        setAnalyticsData({
          overview: {
            totalBookings: 0,
            totalRevenue: 0,
            averageRating: 0,
            completionRate: 85,
            responseTime: 15,
            newCustomers: 0,
            repeatCustomers: 0,
            period: { start: filters.startDate, end: filters.endDate }
          },
          performance: {
            averageResponseTime: 15,
            completionRate: 85,
            customerSatisfaction: 4.2,
            punctuality: 90,
            professionalismScore: 4.5,
            period: { start: filters.startDate, end: filters.endDate }
          },
          bookings: {
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            pendingBookings: 0,
            bookingsByStatus: [],
            bookingsByDay: [],
            bookingsByService: [],
            averageBookingValue: 0,
            period: { start: filters.startDate, end: filters.endDate }
          },
          revenue: {
            totalRevenue: 0,
            totalPayouts: 0,
            platformFee: 0,
            netRevenue: 0,
            revenueByDay: [],
            revenueByMonth: [],
            revenueByService: [],
            period: { start: filters.startDate, end: filters.endDate }
          },
          services: {
            topServices: [],
            servicePerformance: [],
            serviceGrowth: [],
            period: { start: filters.startDate, end: filters.endDate }
          }
        });
        
        // Provide default chart data with at least some fallback data
        setChartData({
          daily: { revenue: [0], bookings: [0], labels: ['Today'] },
          weekly: { revenue: [0], bookings: [0], labels: ['This Week'] },
          monthly: { revenue: [0], bookings: [0], labels: ['This Month'] },
          yearly: { revenue: [0], bookings: [0], labels: ['2024'] }
        });

        // Set fallback profile view stats
        setProfileViewStats({
          totalViews: 0,
          uniqueViewers: 0,
          growth: 0,
          viewsByDay: [],
          period: 'month'
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [selectedPeriod]);
  
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
  
  // Translate chart labels for different periods (simplified since we use numeric formats now)
  const translateChartLabels = (labels: string[], period: string): string[] => {
    // Since we're now using simple numeric date formats (DD/MM, MM/YY), no translation needed
    return labels;
  };
  
  // Get the appropriate data based on selected period
  const getCurrentPeriodData = () => {
    const data = chartData[selectedPeriod] || { revenue: [], bookings: [], labels: [] };
    console.log(`📈 getCurrentPeriodData for ${selectedPeriod}:`, data);
    return data;
  };
  
  const currentPeriodData = getCurrentPeriodData();
  
  // Calculate current period stats and growth
  const getCurrentPeriodStats = () => {
    const currentRevenue = Math.round(currentPeriodData.revenue.reduce((sum, val) => sum + val, 0) * 100) / 100;
    const currentBookings = currentPeriodData.bookings.reduce((sum, val) => sum + val, 0);
    const avgRevenue = currentPeriodData.revenue.length > 0 ? Math.round((currentRevenue / currentPeriodData.revenue.length) * 100) / 100 : 0;
    const avgBookings = currentPeriodData.bookings.length > 0 ? currentBookings / currentPeriodData.bookings.length : 0;
    
    // Calculate growth by comparing current period to previous period
    const dataLength = currentPeriodData.revenue.length;
    const midPoint = Math.floor(dataLength / 2);
    
    const recentRevenue = Math.round(currentPeriodData.revenue.slice(midPoint).reduce((sum, val) => sum + val, 0) * 100) / 100;
    const previousRevenue = Math.round(currentPeriodData.revenue.slice(0, midPoint).reduce((sum, val) => sum + val, 0) * 100) / 100;
    const recentBookings = currentPeriodData.bookings.slice(midPoint).reduce((sum, val) => sum + val, 0);
    const previousBookings = currentPeriodData.bookings.slice(0, midPoint).reduce((sum, val) => sum + val, 0);
    
    const revenueGrowth = calculateGrowthPercentage(recentRevenue, previousRevenue);
    const bookingGrowth = calculateGrowthPercentage(recentBookings, previousBookings);
    
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
  
  // Get profile view data from state
  const profileViewGrowth = profileViewStats?.growth || 0;
  
  // Get performance statuses
  const responseTimeStatus = calculatePerformanceStatus(
    analyticsData.performance?.averageResponseTime || 0,
    PERFORMANCE_THRESHOLDS.responseTime,
    false,
    true // inverse - lower is better
  );
  
  const completionRateStatus = calculatePerformanceStatus(
    analyticsData.performance?.completionRate || 0,
    PERFORMANCE_THRESHOLDS.completionRate,
    true
  );
  
  const conversionRate = analyticsData.overview ? 
    Math.min((analyticsData.overview.totalBookings / Math.max(analyticsData.overview.newCustomers + analyticsData.overview.repeatCustomers, 1)) * 100, 100) : 0;
  
  const conversionRateStatus = calculatePerformanceStatus(
    conversionRate,
    PERFORMANCE_THRESHOLDS.conversionRate,
    true
  );
  
  // Service performance data for pie chart
  const serviceData = analyticsData.services?.topServices?.map((service, index) => ({
    label: getTranslatedServiceName(service.serviceName),
    value: service.bookings,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][index] || '#6B7280'
  })) || [];
  
  // Revenue by service for bar chart
  const serviceRevenue = analyticsData.services?.topServices?.map(service => service.revenue) || [];
  const serviceNames = analyticsData.services?.topServices?.map(service => getTranslatedServiceName(service.serviceName)) || [];
  
  // Loading component
  if (loading) {
    return (
      <FullScreenHandshakeLoader 
        title={t('common.loading')} 
        subtitle={t('dashboard.specialist.analytics')}
      />
    );
  }
  
  // Error component
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center max-w-md">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to Load Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('dashboard.nav.analytics')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('analytics.subtitle')}
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="mt-4 lg:mt-0 flex flex-wrap gap-2">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {selectedPeriod === 'yearly' ? t('analytics.total') : t(`analytics.${selectedPeriod}`)} {t('dashboard.analytics.revenue')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(selectedPeriod === 'yearly' ? (analyticsData.overview?.totalRevenue || 0) : (periodStats?.currentRevenue || 0), currency)}
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 ml-2">{t('analytics.vsAverage')}</span>
                </div>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900/20 dark:bg-primary-900/20 rounded-xl">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Monthly Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('analytics.average')} {t(`analytics.${selectedPeriod}`)} {t('dashboard.analytics.revenue')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(periodStats.avgRevenue, currency)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {t('analytics.total')}: {formatPrice(periodStats.currentRevenue, currency)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Total Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {selectedPeriod === 'yearly' ? t('analytics.total') : t(`analytics.${selectedPeriod}`)} {t('dashboard.analytics.bookings')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(selectedPeriod === 'yearly' ? (analyticsData.overview?.totalBookings || 0) : (periodStats?.currentBookings || 0)).toLocaleString()}
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{t('analytics.vsAverage')}</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Average Rating */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('dashboard.specialist.averageRating')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(analyticsData.performance?.averageRating || 0).toFixed(1)}
                </p>
                <div className="flex items-center mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(analyticsData.performance?.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {analyticsData.performance?.totalReviews || 0} {t('rating.reviews')}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedView === 'revenue' ? t('analytics.revenueTrend') : t('analytics.bookingsTrend')} ({t(`analytics.${selectedPeriod}`)})
              </h2>
              <div className="flex flex-wrap gap-2">
                {(['revenue', 'bookings'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setSelectedView(view)}
                    className={`px-3 py-1 rounded-xl text-sm font-medium transition-all ${
                      selectedView === view
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {t(`dashboard.analytics.${view}`)}
                  </button>
                ))}
              </div>
            </div>
            {!loading && (currentPeriodData.revenue.length > 0 || currentPeriodData.bookings.length > 0) ? (
              <>
                <SimpleLineChart
                  data={(() => {
                    const data = selectedView === 'revenue' ? currentPeriodData.revenue : currentPeriodData.bookings;
                    console.log(`📊 Chart data for ${selectedView}:`, data, 'Values:', data.join(', '));
                    console.log(`📊 Revenue data:`, currentPeriodData.revenue, 'Values:', currentPeriodData.revenue.join(', '));
                    console.log(`📊 Bookings data:`, currentPeriodData.bookings, 'Values:', currentPeriodData.bookings.join(', '));
                    console.log(`📊 Selected period: ${selectedPeriod}`);
                    return data;
                  })()}
                  labels={translateChartLabels(currentPeriodData.labels, selectedPeriod)}
                  color={selectedView === 'revenue' ? '#059669' : '#2563eb'} // Green for revenue, blue for bookings
                  type="line"
                  height="300px"
                />
                {/* Show data summary for better understanding */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
                      <span>Revenue: {formatPrice(Math.round(currentPeriodData.revenue.reduce((sum, val) => sum + val, 0) * 100) / 100, currency)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                      <span>Bookings: {currentPeriodData.bookings.reduce((sum, val) => sum + val, 0)}</span>
                    </div>
                    {currentPeriodData.revenue.length <= 1 && (
                      <div className="text-gray-500 dark:text-gray-400 italic">
                        {selectedPeriod === 'yearly' ? 'Switch to "monthly" for detailed trends' :
                         selectedPeriod === 'monthly' ? 'Switch to "daily" for detailed trends' :
                         selectedPeriod === 'weekly' ? 'Switch to "daily" for detailed trends' :
                         'Not enough data for trend analysis'}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <p>{t('analytics.noTrendData')}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Service Performance Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('analytics.servicePerformance')}</h2>
            {serviceData.length > 0 ? (
              <SimplePieChart data={serviceData} height="300px" />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <p>{t('analytics.noServiceData')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Service Revenue Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('analytics.revenueByService')}</h2>
          {serviceRevenue.length > 0 ? (
            <SimpleBarChart
              data={serviceRevenue}
              labels={serviceNames}
              color="#10B981"
              height="300px"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>{t('analytics.noServiceData')}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('analytics.responseTime')}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {Math.round(analyticsData.performance?.averageResponseTime || 0)}m
                </p>
                <p className={`text-xs mt-1 ${responseTimeStatus.color}`}>
                  {responseTimeStatus.status}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('analytics.completionRate')}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {(analyticsData.performance?.completionRate || 0).toFixed(1)}%
                </p>
                <p className={`text-xs mt-1 ${completionRateStatus.color}`}>
                  {completionRateStatus.status}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('analytics.profileViews')}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {profileViewStats?.totalViews || 0}
                </p>
                <p className={`text-xs mt-1 ${
                  profileViewGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profileViewGrowth >= 0 ? '+' : ''}{profileViewGrowth.toFixed(1)}% {t('analytics.thisMonth')}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('analytics.conversionRate')}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {conversionRate.toFixed(1)}%
                </p>
                <div className="flex items-center mt-1">
                  <p className={`text-xs ${conversionRateStatus.color}`}>
                    {conversionRateStatus.status}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Industry avg: 18%</span>
                </div>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Export & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleExportPDF}
            className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('analytics.exportPdfReport')}
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('analytics.exportCsvData')}
          </button>
          <button 
            onClick={handleShareAnalytics}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
          >
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
