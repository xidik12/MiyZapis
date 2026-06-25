import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CurrencyDollarIcon, ArrowTrendingUpIcon, DocumentArrowDownIcon, ClockIcon, ChartBarIcon, UserGroupIcon, CheckCircleIcon, WarningIcon as ExclamationTriangleIcon, WalletIcon, ArrowRightIcon, ArrowTrendingDownIcon } from '@/components/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { analyticsService } from '../../services/analytics.service';
import { bookingService } from '../../services/booking.service';
import { expenseService, ExpenseSummary } from '../../services/expense.service';
import { retryRequest } from '../../services/api';
import { HelpTip } from '@/components/common/HelpTip';

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
  newCustomers: number;
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
  currency?: string;
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

// Helper function to get the booking currency
const getBookingCurrency = (booking: any): 'USD' | 'EUR' | 'UAH' => {
  // Use the service's stored currency, defaulting to UAH if not specified
  return (booking.service?.currency as 'USD' | 'EUR' | 'UAH') || 'USD';
};

// ─── Self-contained help content (trilingual, no i18n edits required) ───────
const EARNINGS_HELP = {
  en: {
    overview: 'Your complete earnings record.\n\nThis page shows what you have billed clients across all time and broken down by month. All amounts come from completed bookings and are converted to your display currency at current exchange rates.\n\nImportant: MiyZapis does not process or hold payments. You collect money directly from clients in person. "Earnings" here means what you billed — it is not a platform payout.\n\nHow to use it:\n• Use Total Earnings and This Month to track your income.\n• Monitor Monthly Growth to see whether your business is growing.\n• Add expenses under Finances to see Net Profit and Profit Margin.\n• Export a CSV report any time from the top-right button.',

    totalEarnings: 'Sum of all completed booking amounts across your entire history on MiyZapis, converted to your display currency at current exchange rates.\n\nFormula: Σ (each completed booking amount × exchange rate to your currency).\n\nThis is NOT a platform payout — you collected this money directly from clients in person.',

    thisMonth: 'Your earnings from completed bookings in the current calendar month only.\n\nFormula: sum of completed-booking amounts whose completion date falls in the current month, converted to your display currency.\n\nResets to zero on the 1st of each month.',

    pending: 'Bookings that are confirmed or in progress but not yet marked as completed. The amounts shown here are not yet counted in your total earnings.\n\nOnce you mark a session as completed, it moves into your total.',

    avgPerBooking: 'Average amount you earn per completed booking.\n\nFormula: Total Earnings ÷ number of completed bookings.\n\nUse this to identify whether your pricing matches the market.',

    avgSessionValue: 'Average amount per booking across ALL bookings (completed and upcoming).\n\nFormula: Total Earnings ÷ total bookings.\n\nCompare this to Avg per Booking — a big gap means many bookings are not yet completed.',

    monthlyGrowth: 'How your earnings changed from the previous month to the last recorded month.\n\nFormula: (last month − prior month) ÷ prior month × 100.\n\nPositive = growing. Negative = shrinking. Shows 0 if there are fewer than two months of data.',

    activeClients: 'The number of unique customers who have at least one completed booking with you.\n\nFormula: count of distinct customer IDs across all your completed bookings.\n\nThis is your active client base — the people who have actually paid you.',

    repeatCustomers: 'Clients who came back more than once, as reported by the analytics API.\n\nShows 0 if the analytics data is not available yet — this is normal for new accounts.',

    newCustomers: 'First-time clients in the reporting period, as reported by the analytics API.\n\nShows 0 if the analytics data is not available yet.',

    peakHours: 'The time-of-day window when you receive the most bookings.\n\nCurrently shows "—" because per-booking appointment time data is not yet wired into this page. This will populate automatically once the data pipeline is connected.',

    bestDay: 'The weekday when you earn the most on average.\n\nCurrently shows "—" because per-booking appointment time data is not yet wired into this page. This will populate automatically once the data pipeline is connected.',

    avgDuration: 'Average duration of your completed sessions.\n\nCurrently shows "—" because per-booking duration data is not yet wired into this page. This will populate automatically once the data pipeline is connected.',

    conversionRate: 'Completion rate from the analytics service — how many of your bookings were marked as completed vs total.\n\nFormula: completed bookings ÷ total bookings × 100.\n\nShows 0 if the analytics data is unavailable.',

    monthlyGrowthDetail: 'Month-over-month growth in the Detailed Analytics section.\n\nFormula: (last month earnings − prior month earnings) ÷ prior month earnings × 100.\n\nBased on your monthly earnings breakdown.',
  },

  uk: {
    overview: 'Ваш повний облік доходів.\n\nЦя сторінка показує суми, виставлені клієнтам за весь час та з розбивкою по місяцях. Усі суми беруться із завершених записів і конвертуються у вашу обрану валюту за поточним курсом.\n\nВажливо: MiyZapis не обробляє і не утримує платежі. Ви отримуєте гроші безпосередньо від клієнтів готівкою або переказом. «Доходи» тут означають те, що ви виставили до оплати — це не виплата від платформи.\n\nЯк користуватися:\n• Використовуйте Загальний дохід і Цього місяця для відстеження надходжень.\n• Стежте за Місячним зростанням, щоб бачити динаміку розвитку.\n• Додавайте витрати в розділі «Фінанси», щоб побачити Чистий прибуток і Маржу.\n• Кнопка «Експорт звіту» у верхньому правому куті доступна будь-коли.',

    totalEarnings: 'Сума всіх завершених записів за весь час на MiyZapis, конвертована у вашу обрану валюту за поточним курсом.\n\nФормула: Σ (сума кожного завершеного запису × курс до вашої валюти).\n\nЦе НЕ виплата від платформи — ви отримали ці кошти безпосередньо від клієнтів готівкою або переказом.',

    thisMonth: 'Ваші доходи від завершених записів лише за поточний календарний місяць.\n\nФормула: сума сум завершених записів, дата завершення яких припадає на поточний місяць, конвертована у вашу валюту.\n\nОбнуляється 1-го числа кожного місяця.',

    pending: 'Записи, які підтверджені або в процесі, але ще не позначені як завершені. Ці суми ще не входять у ваш загальний дохід.\n\nЯк тільки ви позначите сесію як завершену, вона перейде до загальної суми.',

    avgPerBooking: 'Середня сума, яку ви отримуєте за один завершений запис.\n\nФормула: Загальний дохід ÷ кількість завершених записів.\n\nВикористовуйте цей показник, щоб оцінити відповідність ваших цін ринку.',

    avgSessionValue: 'Середня сума на запис по ВСІХ записах (завершених і майбутніх).\n\nФормула: Загальний дохід ÷ загальна кількість записів.\n\nПорівняйте з «Середнім за записом» — великий розрив означає, що багато записів ще не завершені.',

    monthlyGrowth: 'Як змінились ваші доходи від попереднього місяця до останнього зафіксованого.\n\nФормула: (останній місяць − попередній місяць) ÷ попередній місяць × 100.\n\nПозитивне значення = зростання. Негативне = зниження. Показує 0, якщо даних менше ніж за два місяці.',

    activeClients: 'Кількість унікальних клієнтів, у яких є хоча б один завершений запис до вас.\n\nФормула: кількість унікальних ідентифікаторів клієнтів серед усіх ваших завершених записів.\n\nЦе ваша активна клієнтська база — люди, які вам фактично платили.',

    repeatCustomers: 'Клієнти, які поверталися більше одного разу — за даними аналітичного API.\n\nПоказує 0, якщо аналітичні дані ще недоступні — це нормально для нових акаунтів.',

    newCustomers: 'Клієнти, які звернулися вперше у звітний період — за даними аналітичного API.\n\nПоказує 0, якщо аналітичні дані ще недоступні.',

    peakHours: 'Година дня, коли ви отримуєте найбільше записів.\n\nПоки що відображається «—», оскільки дані про час прийому по кожному запису ще не підключені до цієї сторінки. Заповниться автоматично після підключення відповідного потоку даних.',

    bestDay: 'День тижня, коли ви в середньому заробляєте найбільше.\n\nПоки що відображається «—», оскільки дані про час прийому по кожному запису ще не підключені до цієї сторінки. Заповниться автоматично після підключення відповідного потоку даних.',

    avgDuration: 'Середня тривалість ваших завершених сесій.\n\nПоки що відображається «—», оскільки дані про тривалість по кожному запису ще не підключені до цієї сторінки. Заповниться автоматично після підключення відповідного потоку даних.',

    conversionRate: 'Відсоток виконання від аналітичного сервісу — скільки ваших записів позначено як завершені відносно загальної кількості.\n\nФормула: завершені записи ÷ загальна кількість записів × 100.\n\nПоказує 0, якщо аналітичні дані недоступні.',

    monthlyGrowthDetail: 'Місяць до місяця в розділі «Детальна аналітика».\n\nФормула: (доходи останнього місяця − доходи попереднього місяця) ÷ доходи попереднього місяця × 100.\n\nРозраховується на основі вашої помісячної розбивки.',
  },

  ru: {
    overview: 'Полный учёт ваших доходов.\n\nЭта страница показывает суммы, выставленные клиентам за всё время и с разбивкой по месяцам. Все суммы берутся из завершённых записей и конвертируются в выбранную вами валюту по текущему курсу.\n\nВажно: MiyZapis не обрабатывает и не хранит платежи. Вы получаете деньги непосредственно от клиентов наличными или переводом. «Доходы» здесь означают то, что вы выставили к оплате — это не выплата от платформы.\n\nКак пользоваться:\n• Используйте Общий доход и За этот месяц для отслеживания поступлений.\n• Следите за Ростом за месяц, чтобы видеть динамику.\n• Добавляйте расходы в разделе «Финансы», чтобы видеть Чистую прибыль и Маржу.\n• Кнопка «Экспорт отчёта» в верхнем правом углу доступна в любое время.',

    totalEarnings: 'Сумма всех завершённых записей за всё время на MiyZapis, конвертированная в выбранную вами валюту по текущему курсу.\n\nФормула: Σ (сумма каждой завершённой записи × курс к вашей валюте).\n\nЭто НЕ выплата от платформы — вы получили эти средства непосредственно от клиентов наличными или переводом.',

    thisMonth: 'Ваши доходы от завершённых записей только за текущий календарный месяц.\n\nФормула: сумма сумм завершённых записей, дата завершения которых приходится на текущий месяц, конвертированная в вашу валюту.\n\nСбрасывается в ноль 1-го числа каждого месяца.',

    pending: 'Записи, которые подтверждены или в процессе, но ещё не отмечены как завершённые. Эти суммы ещё не входят в ваш общий доход.\n\nКак только вы отметите сессию как завершённую, она перейдёт в общую сумму.',

    avgPerBooking: 'Средняя сумма, которую вы получаете за одну завершённую запись.\n\nФормула: Общий доход ÷ количество завершённых записей.\n\nИспользуйте этот показатель, чтобы оценить соответствие ваших цен рынку.',

    avgSessionValue: 'Средняя сумма на запись по ВСЕМ записям (завершённым и предстоящим).\n\nФормула: Общий доход ÷ общее количество записей.\n\nСравните с «Средним за запись» — большой разрыв означает, что многие записи ещё не завершены.',

    monthlyGrowth: 'Как изменились ваши доходы от предыдущего месяца до последнего зафиксированного.\n\nФормула: (последний месяц − предыдущий месяц) ÷ предыдущий месяц × 100.\n\nПоложительное значение = рост. Отрицательное = снижение. Показывает 0, если данных менее чем за два месяца.',

    activeClients: 'Количество уникальных клиентов, у которых есть хотя бы одна завершённая запись к вам.\n\nФормула: количество уникальных идентификаторов клиентов среди всех ваших завершённых записей.\n\nЭто ваша активная клиентская база — люди, которые вам фактически платили.',

    repeatCustomers: 'Клиенты, которые возвращались более одного раза — по данным аналитического API.\n\nПоказывает 0, если аналитические данные ещё недоступны — это нормально для новых аккаунтов.',

    newCustomers: 'Клиенты, обратившиеся впервые в отчётный период — по данным аналитического API.\n\nПоказывает 0, если аналитические данные ещё недоступны.',

    peakHours: 'Час дня, когда вы получаете больше всего записей.\n\nПока отображается «—», так как данные о времени приёма по каждой записи ещё не подключены к этой странице. Заполнится автоматически после подключения соответствующего потока данных.',

    bestDay: 'День недели, когда вы в среднем зарабатываете больше всего.\n\nПока отображается «—», так как данные о времени приёма по каждой записи ещё не подключены к этой странице. Заполнится автоматически после подключения соответствующего потока данных.',

    avgDuration: 'Средняя продолжительность ваших завершённых сессий.\n\nПока отображается «—», так как данные о продолжительности по каждой записи ещё не подключены к этой странице. Заполнится автоматически после подключения соответствующего потока данных.',

    conversionRate: 'Процент выполнения от аналитического сервиса — сколько ваших записей отмечено как завершённые от общего числа.\n\nФормула: завершённые записи ÷ общее количество записей × 100.\n\nПоказывает 0, если аналитические данные недоступны.',

    monthlyGrowthDetail: 'Месяц к месяцу в разделе «Детальная аналитика».\n\nФормула: (доходы последнего месяца − доходы предыдущего месяца) ÷ доходы предыдущего месяца × 100.\n\nРассчитывается на основе вашей помесячной разбивки.',
  },
};
// ─────────────────────────────────────────────────────────────────────────────

const SpecialistEarnings: React.FC = () => {
  const { t, language } = useLanguage();
  const eh = (EARNINGS_HELP as any)[language] || EARNINGS_HELP.en;
  const { formatPrice, convertPrice, currency } = useCurrency();
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
  const [retryCount, setRetryCount] = useState(0);

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
    newCustomers: 0,
    peakHours: '',
    bestDay: '',
    avgSessionValue: 0
  });

  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);

  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // Load earnings data from API
  useEffect(() => {
    const loadEarningsData = async () => {
      try {
        setLoading(prev => ({ ...prev, earnings: true, analytics: true }));
        setErrors(prev => ({ ...prev, earnings: null, analytics: null }));

        // Derive date range from the selected period so the bookings query
        // actually filters by window (week / month / year).
        const periodEnd = new Date();
        const periodStart = new Date();
        if (selectedPeriod === 'week') {
          periodStart.setDate(periodEnd.getDate() - 7);
        } else if (selectedPeriod === 'month') {
          periodStart.setMonth(periodEnd.getMonth() - 1);
        } else {
          periodStart.setFullYear(periodEnd.getFullYear() - 1);
        }
        const startDateStr = periodStart.toISOString().split('T')[0];
        const endDateStr = periodEnd.toISOString().split('T')[0];

        // Load data from backend endpoints - prioritize bookings API over payments API for accurate amounts
        const [completedBookingsData, analyticsOverview, bookingAnalytics, _servicesData, _performanceData] = await Promise.allSettled([
          retryRequest(() => bookingService.getBookings({ limit: 100, status: 'COMPLETED', startDate: startDateStr, endDate: endDateStr }, 'specialist'), 2, 1000),
          retryRequest(() => analyticsService.getOverview(), 2, 1000),
          retryRequest(() => analyticsService.getBookingAnalytics(), 2, 1000),
          retryRequest(() => analyticsService.getServiceAnalytics(), 2, 1000),
          retryRequest(() => analyticsService.getPerformanceAnalytics(), 2, 1000)
        ]);

        // Process bookings data to calculate accurate earnings
        let totalEarnings = 0;
        let thisMonthEarnings = 0;
        let pendingEarnings = 0;
        let monthlyBreakdown: MonthlyEarning[] = [];
        let uniqueCustomers = 0;
        
        if (completedBookingsData.status === 'fulfilled' && completedBookingsData.value) {
          try {
            const bookingResponse = completedBookingsData.value;

            const completedBookings = Array.isArray(bookingResponse.bookings) ? bookingResponse.bookings : [];
            
            // Count unique customers from actual booking data
            const uniqueCustomerIds = new Set();
            completedBookings.forEach(booking => {
              if (booking.customer?.id) {
                uniqueCustomerIds.add(booking.customer.id);
              }
            });
            uniqueCustomers = uniqueCustomerIds.size;
            
            // Calculate total earnings from completed bookings (accurate amounts with currency conversion)
            totalEarnings = completedBookings.reduce((sum, booking) => {
              const amount = Number(booking.totalAmount) || 0;
              const bookingCurrency = getBookingCurrency(booking);
              
              // Convert to user's preferred currency for consistent total
              const convertedAmount = convertPrice(amount, bookingCurrency);
              
              return sum + Math.round(convertedAmount * 100) / 100;
            }, 0);
            
            // Calculate this month's earnings from completed bookings
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            thisMonthEarnings = completedBookings
              .filter(booking => {
                try {
                  const bookingDate = new Date(booking.updatedAt || booking.createdAt);
                  return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
                } catch {
                  return false;
                }
              })
              .reduce((sum, booking) => {
                const amount = Number(booking.totalAmount) || 0;
                const bookingCurrency = getBookingCurrency(booking);
                const convertedAmount = convertPrice(amount, bookingCurrency);
                return sum + Math.round(convertedAmount * 100) / 100;
              }, 0);
            
            // Create monthly breakdown from completed bookings
            const monthlyData = new Map<string, { earnings: number; bookings: number }>();
            completedBookings.forEach(booking => {
              try {
                const date = new Date(booking.updatedAt || booking.createdAt);
                const monthKey = date.toLocaleDateString('en', { month: 'short', year: 'numeric' });
                const existing = monthlyData.get(monthKey) || { earnings: 0, bookings: 0 };
                const amount = Number(booking.totalAmount) || 0;
                const bookingCurrency = getBookingCurrency(booking);
                const convertedAmount = convertPrice(amount, bookingCurrency);
                monthlyData.set(monthKey, {
                  earnings: existing.earnings + convertedAmount,
                  bookings: existing.bookings + 1
                });
              } catch {
                // skip booking with unparseable date
              }
            });
            
            monthlyBreakdown = Array.from(monthlyData.entries())
              .map(([month, data]) => ({
                month,
                earnings: data.earnings,
                bookings: data.bookings
              }))
              .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
          } catch {
            // bookings data processing failed; totals remain at 0
          }
        }
        // If completedBookingsData is rejected, totals remain 0 and
        // the catch below will set an error state.
        
        // Calculate analytics data from actual payment/booking data since analytics APIs are unreliable
        const totalBookingsFromPayments = monthlyBreakdown.reduce((sum, month) => sum + month.bookings, 0);
        
        // Initialize analytics with data derived from actual earnings data
        let analyticsData = {
          totalBookings: totalBookingsFromPayments,
          completedBookings: totalBookingsFromPayments, // Since we have payments, these were completed
          // Honest zeros — only the analytics API (below) can supply real values for
          // these. Previously these were fabricated (4.5 rating, 95% completion,
          // 60/40 new-vs-repeat split), which showed fake numbers to operators.
          averageRating: 0,
          completionRate: 0,
          newCustomers: 0,
          repeatCustomers: 0,
        };
        
        // Try to enhance with analytics API data if available, but don't rely on it
        if (analyticsOverview.status === 'fulfilled' && analyticsOverview.value) {
          try {
            const overview = analyticsOverview.value;
            
            // Only use analytics data if it seems reasonable (not zeros or null)
            if (overview.totalBookings > 0) {
              analyticsData.totalBookings = Math.max(analyticsData.totalBookings, overview.totalBookings);
              analyticsData.completedBookings = Math.max(analyticsData.completedBookings, overview.totalBookings);
            }
            if (overview.averageRating > 0) {
              analyticsData.averageRating = overview.averageRating;
            }
            if (overview.completionRate > 0) {
              analyticsData.completionRate = Math.min(100, overview.completionRate);
            }
            if (overview.newCustomers > 0) {
              analyticsData.newCustomers = overview.newCustomers;
            }
            if (overview.repeatCustomers > 0) {
              analyticsData.repeatCustomers = overview.repeatCustomers;
            }
          } catch {
            // analytics overlay failed; fall back to booking-derived values
          }
        }

        // Try to enhance with booking analytics if available
        if (bookingAnalytics.status === 'fulfilled' && bookingAnalytics.value) {
          try {
            const bookings = bookingAnalytics.value;

            if (bookings.completedBookings > 0) {
              analyticsData.completedBookings = Math.max(analyticsData.completedBookings, bookings.completedBookings);
            }
            if (bookings.totalBookings > 0) {
              analyticsData.totalBookings = Math.max(analyticsData.totalBookings, bookings.totalBookings);
            }
          } catch {
            // booking analytics failed; continue with existing values
          }
        }
        
        // Ensure data consistency - completed bookings shouldn't exceed total bookings
        const safeAnalyticsData = {
          ...analyticsData,
          completedBookings: Math.min(analyticsData.completedBookings, analyticsData.totalBookings),
          totalBookings: Math.max(analyticsData.totalBookings, analyticsData.completedBookings)
        };
        
        const transformedEarnings: EarningsData = {
          totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
          thisMonth: Math.round(thisMonthEarnings * 100) / 100,
          pending: Math.round(pendingEarnings * 100) / 100,
          lastPayout: Math.round((totalEarnings - pendingEarnings) * 100) / 100,
          completedBookings: safeAnalyticsData.completedBookings,
          activeClients: uniqueCustomers, // Use actual unique customer count from bookings
          averageBookingValue: safeAnalyticsData.completedBookings > 0 
            ? Math.round((totalEarnings / safeAnalyticsData.completedBookings) * 100) / 100 
            : 0,
          monthlyGrowth: calculateGrowthRate(monthlyBreakdown.map(item => ({ date: item.month, revenue: item.earnings }))),
          conversionRate: safeAnalyticsData.completionRate,
          repeatCustomers: safeAnalyticsData.repeatCustomers,
          newCustomers: safeAnalyticsData.newCustomers,
          // Peak hours / best day can't be derived from monthly aggregates — these
          // helpers returned a fixed value regardless of data. Leave blank (shows
          // "—") until per-booking time data is wired in.
          peakHours: '',
          bestDay: '',
          avgSessionValue: safeAnalyticsData.totalBookings > 0 
            ? Math.round((totalEarnings / safeAnalyticsData.totalBookings) * 100) / 100 
            : 0
        };
        
        setEarningsData(transformedEarnings);
        setMonthlyEarnings(monthlyBreakdown);
        setLoading(prev => ({ ...prev, earnings: false, analytics: false }));
      } catch {
        // Set fallback data and show error state
        const fallbackEarnings: EarningsData = {
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
          newCustomers: 0,
          peakHours: t('earnings.noData'),
          bestDay: t('earnings.noData'),
          avgSessionValue: 0
        };

        setEarningsData(fallbackEarnings);
        setMonthlyEarnings([]);

        // Always surface the error so users see "data unavailable" rather than
        // silent all-zero cards (which are indistinguishable from an empty account).
        setErrors(prev => ({
          ...prev,
          earnings: t('earnings.someDataUnavailable') || 'Earnings data unavailable. Please retry.',
          analytics: null // avoid duplicate message
        }));
        setLoading(prev => ({ ...prev, earnings: false, analytics: false }));
      }
    };

    const loadRecentCompletedBookings = async () => {
      try {
        setLoading(prev => ({ ...prev, payments: true }));
        setErrors(prev => ({ ...prev, payments: null }));
        
        // Use the same bookings API that the Bookings page uses - this has correct amounts
        const bookingData = await retryRequest(
          () => bookingService.getBookings({
            limit: 10,
            status: 'COMPLETED' // Only completed bookings for earnings
          }, 'specialist'),
          2, 1000
        );
        
        // Transform booking data to match payout history interface
        const bookings = Array.isArray(bookingData.bookings) ? bookingData.bookings : [];
        const recentEarnings: PayoutHistory[] = bookings
          .filter((booking: any) => booking && booking.id && booking.totalAmount) // Only valid completed bookings
          .map((booking: any) => {
            return {
              id: booking.id as string,
              date: (booking.completedAt || booking.updatedAt || new Date().toISOString()) as string,
              amount: Number(booking.totalAmount), // Use the same field as Bookings page
              status: 'completed' as const,
              method: (booking.service?.name || 'Service') as string,
              currency: getBookingCurrency(booking) // Add currency information
            };
          });
        
        setPayoutHistory(recentEarnings);
        setLoading(prev => ({ ...prev, payments: false }));
      } catch {
        setPayoutHistory([]);
        setErrors(prev => ({ ...prev, payments: t('earnings.recentEarningsUnavailable') }));
        setLoading(prev => ({ ...prev, payments: false }));
      }
    };

    const loadExpenseSummary = async () => {
      try {
        setLoadingExpenses(true);

        const summary = await expenseService.getExpenseSummary();
        setExpenseSummary(summary);
      } catch {
        setExpenseSummary(null);
      } finally {
        setLoadingExpenses(false);
      }
    };

    loadEarningsData();
    loadRecentCompletedBookings();
    loadExpenseSummary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, retryCount]);

  // Helper functions
  const calculateGrowthRate = (breakdown: Array<{ date: string; revenue: number }>) => {
    if (!breakdown || breakdown.length < 2) return 0;
    
    try {
      const validData = breakdown.filter(item => item && typeof item.revenue === 'number' && !isNaN(item.revenue));
      if (validData.length < 2) return 0;
      
      const recent = validData.slice(-2);
      const oldValue = recent[0].revenue;
      const newValue = recent[1].revenue;
      
      if (oldValue === 0) return newValue > 0 ? 100 : 0;
      return Math.round(((newValue - oldValue) / oldValue) * 100);
    } catch {
      return 0;
    }
  };

  const expenseCurrency = expenseSummary && (expenseSummary.currency === 'USD' || expenseSummary.currency === 'EUR' || expenseSummary.currency === 'UAH')
    ? expenseSummary.currency
    : 'UAH';
  const totalExpensesConverted = expenseSummary
    ? convertPrice(expenseSummary.totalExpenses || 0, expenseCurrency)
    : 0;
  const thisMonthExpensesConverted = expenseSummary
    ? convertPrice(expenseSummary.thisMonthExpenses || 0, expenseCurrency)
    : 0;
  const netProfit = (earningsData.totalEarnings || 0) - totalExpensesConverted;
  const profitMargin = earningsData.totalEarnings > 0
    ? (netProfit / earningsData.totalEarnings) * 100
    : 0;

  // A quick estimate only — service earnings minus expenses. It does NOT include
  // retail/POS, paid invoices, VAT or tax. The Accounting page is the authoritative
  // Profit & Loss; this tip points there so the two profit figures don't confuse.
  const plScopeNote = ({
    en: 'A quick estimate: your service earnings (completed bookings, all-time) minus recorded expenses.\n\nNet Profit = Total Earnings − Total Expenses.\nProfit Margin = Net Profit ÷ Total Earnings × 100.\n\nThis is simplified — it excludes retail/POS sales, paid invoices, VAT and tax. For your full, period-based Profit & Loss, open the Accounting page (that is the source of truth).',
    uk: 'Швидка оцінка: ваш дохід від послуг (завершені записи, за весь час) мінус враховані витрати.\n\nЧистий прибуток = Загальний заробіток − Загальні витрати.\nМаржа = Чистий прибуток ÷ Загальний заробіток × 100.\n\nЦе спрощений показник — він не враховує роздрібні/POS продажі, оплачені рахунки, ПДВ і податки. Для повного звіту про прибутки та збитки за період відкрийте сторінку «Бухгалтерія» (це джерело істини).',
    ru: 'Быстрая оценка: ваш доход от услуг (завершённые записи, за всё время) минус учтённые расходы.\n\nЧистая прибыль = Общий заработок − Общие расходы.\nМаржа = Чистая прибыль ÷ Общий заработок × 100.\n\nЭто упрощённый показатель — без розничных/POS продаж, оплаченных счетов, НДС и налогов. Полный отчёт о прибылях и убытках за период — на странице «Бухгалтерия» (источник истины).',
  } as Record<string, string>)[language] || '';

  const determinePeakHours = (breakdown: Array<{ date: string; revenue: number }>) => {
    try {
      // This is a simplified implementation. In a real scenario, you'd analyze hourly data
      const hasData = breakdown && breakdown.some(item => item && item.revenue > 0);
      return hasData ? t('earnings.timeFormat.afternoon') : t('earnings.noData');
    } catch {
      return t('earnings.noData');
    }
  };

  const determineBestDay = (breakdown: Array<{ date: string; revenue: number }>) => {
    try {
      if (!breakdown || breakdown.length === 0) return t('earnings.noData');

      const validData = breakdown.filter(item => item && typeof item.revenue === 'number' && !isNaN(item.revenue));
      if (validData.length === 0) return t('earnings.noData');

      const bestDay = validData.reduce((best, current) =>
        current.revenue > best.revenue ? current : best
      );

      // For monthly data, just return the best month
      return bestDay.date || t('earnings.noData');
    } catch {
      return t('earnings.noData');
    }
  };


  const handleExportReport = async () => {
    setIsExporting(true);
    
    try {
      // Try to use analytics service to export data, fallback to CSV generation
      try {
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
      } catch {
        
        // Fallback to local CSV generation
        const csvContent = generateCSVReport();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `earnings-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch {
      setErrors(prev => ({ ...prev, analytics: t('earnings.exportFailed') }));
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSVReport = (): string => {
    const headers = ['Date', `Earnings (${currency})`, 'Bookings', 'Status'];
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
    
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">{t('dashboard.nav.earnings')}</h1>
            <HelpTip title={t('help.earnings.title') || 'Earnings'} content={eh.overview} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('earnings.subtitle')}</p>
        </div>
        <button
          onClick={handleExportReport}
          disabled={isExporting}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] disabled:active:scale-100"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>{isExporting ? t('earnings.exporting') : t('earnings.exportReport')}</span>
        </button>
      </div>

      {/* Error Display */}
      {(errors.earnings || errors.payments || errors.analytics) && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
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
            <button
              onClick={() => setRetryCount(c => c + 1)}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
            >
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('earnings.totalEarnings')}</p>
                <HelpTip title={t('earnings.totalEarnings')} content={eh.totalEarnings} />
              </div>
              {loading.earnings ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                  {formatPrice(earningsData.totalEarnings || 0, currency)}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('earnings.thisMonth')}</p>
                <HelpTip title={t('earnings.thisMonth')} content={eh.thisMonth} />
              </div>
              {loading.earnings ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                  {formatPrice(earningsData.thisMonth || 0, currency)}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('earnings.averageBookingValue')}</p>
                <HelpTip title={t('earnings.averageBookingValue')} content={eh.avgPerBooking} />
              </div>
              {loading.earnings ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                  {formatPrice(earningsData.averageBookingValue || 0, currency)}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('earnings.completedBookings')}</p>
              </div>
              {loading.earnings ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                  {earningsData.completedBookings || 0}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('earnings.activeClients')}</p>
                <HelpTip title={t('earnings.activeClients')} content={eh.activeClients} />
              </div>
              {loading.earnings ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                  {earningsData.activeClients || 0}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('earnings.monthlyGrowth')}</p>
                <HelpTip title={t('earnings.monthlyGrowth')} content={eh.monthlyGrowth} />
              </div>
              {loading.earnings ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className={`text-xl sm:text-2xl font-bold tabular-nums ${(earningsData.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(earningsData.monthlyGrowth || 0) >= 0 ? '+' : ''}{earningsData.monthlyGrowth || 0}%
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Expense and Profit Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.totalExpenses')}</p>
              {loadingExpenses ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-red-600 tabular-nums">
                  {formatPrice(totalExpensesConverted, currency)}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
              <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('earnings.thisMonthExpenses')}</p>
              {loadingExpenses ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-red-600 tabular-nums">
                  {formatPrice(thisMonthExpensesConverted, currency)}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5">{t('earnings.netProfit')} <HelpTip title={t('earnings.netProfit')} content={plScopeNote} /></p>
              {loading.earnings || loadingExpenses ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className={`text-xl sm:text-2xl font-bold tabular-nums ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(netProfit, currency)}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5">{t('earnings.profitMargin')} <HelpTip title={t('earnings.profitMargin')} content={plScopeNote} /></p>
              {loading.earnings || loadingExpenses ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className={`text-xl sm:text-2xl font-bold tabular-nums ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {earningsData.totalEarnings > 0 ? `${profitMargin.toFixed(1)}%` : '0%'}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* View All Expenses Link */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <Link
          to="/specialist/finances"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
        >
          {t('earnings.viewAllExpenses')}
          <ArrowRightIcon className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* Detailed Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
        {/* Monthly Earnings Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{t('earnings.monthlyEarnings')}</h3>
            <div className="flex flex-wrap gap-2">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-xl transition active:scale-[0.96] ${
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
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl h-10 relative overflow-hidden">
                      <div className="bg-gray-200 dark:bg-gray-600 h-full rounded-xl animate-pulse" style={{ width: `${Math.random() * 80 + 20}%` }}></div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : monthlyEarnings && monthlyEarnings.length > 0 ? (
              monthlyEarnings.map((item, index) => {
                const maxEarnings = Math.max(...monthlyEarnings.map(m => m.earnings || 0));
                const widthPercentage = maxEarnings > 0 ? ((item.earnings || 0) / maxEarnings) * 100 : 0;
                
                return (
                  <div key={item.month || index} className="flex items-center space-x-3">
                    <div className="w-16 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {getTranslatedMonth(item.month || 'N/A')}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl h-10 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-xl flex items-center justify-end pr-3 transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(5, widthPercentage)}%` }}
                        >
                          <span className="text-white text-sm font-semibold shadow-sm tabular-nums">{formatPrice(item.earnings || 0, currency)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-medium">
                        {item.bookings || 0} {t('earnings.bookings')}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('earnings.noDataAvailable')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Earnings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">{t('earnings.recentCompletedServices')}</h3>
          <div className="space-y-4">
            {loading.payments ? (
              Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div>
                    <div className="h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                </div>
              ))
            ) : payoutHistory && payoutHistory.length > 0 ? (
              payoutHistory.map((payout) => (
                <div key={payout.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="min-w-0 mr-3">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {formatPrice(payout.amount || 0, (payout.currency || 'USD') as 'USD' | 'EUR' | 'UAH')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {payout.date ? new Date(payout.date).toLocaleDateString() : 'N/A'} • {payout.method || 'Service'}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payout.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : payout.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {t(`earnings.${payout.status || 'processing'}`)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('earnings.noRecentCompletedServices')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Earnings Analytics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition active:scale-[0.96]">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">{t('earnings.detailedAnalytics')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Performance Metrics */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">{t('earnings.performanceMetrics')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between gap-2">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 min-w-0">
                  <span className="truncate">{t('earnings.conversionRate')}</span>
                  <HelpTip title={t('earnings.conversionRate')} content={eh.conversionRate} />
                </span>
                {loading.earnings ? (
                  <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white flex-shrink-0 text-right tabular-nums">{(earningsData.conversionRate || 0).toFixed(1)}%</span>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 min-w-0">
                  <span className="truncate">{t('earnings.repeatCustomers')}</span>
                  <HelpTip title={t('earnings.repeatCustomers')} content={eh.repeatCustomers} />
                </span>
                {loading.earnings ? (
                  <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white flex-shrink-0 text-right tabular-nums">{earningsData.repeatCustomers || 0}</span>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 min-w-0">
                  <span className="truncate">{t('earnings.avgSessionValue')}</span>
                  <HelpTip title={t('earnings.avgSessionValue')} content={eh.avgSessionValue} />
                </span>
                {loading.earnings ? (
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white flex-shrink-0 text-right tabular-nums">{formatPrice(earningsData.avgSessionValue || 0, currency)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Growth Insights */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">{t('earnings.growthInsights')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between gap-2">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 min-w-0">
                  <span className="truncate">{t('earnings.monthlyGrowth')}</span>
                  <HelpTip title={t('earnings.monthlyGrowth')} content={eh.monthlyGrowthDetail} />
                </span>
                {loading.earnings ? (
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className={`font-medium tabular-nums ${(earningsData.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(earningsData.monthlyGrowth || 0) >= 0 ? '+' : ''}{earningsData.monthlyGrowth || 0}%
                  </span>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 min-w-0">
                  <span className="truncate">{t('earnings.newCustomers')}</span>
                  <HelpTip title={t('earnings.newCustomers')} content={eh.newCustomers} />
                </span>
                {loading.earnings ? (
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white flex-shrink-0 text-right tabular-nums">{(earningsData.newCustomers || 0) > 0 ? `+${earningsData.newCustomers}` : t('earnings.noData')}</span>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 dark:text-gray-400 min-w-0 truncate">{t('earnings.revenueTrend')}</span>
                {loading.earnings ? (
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <span className={`font-medium ${(earningsData.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(earningsData.monthlyGrowth || 0) >= 0 ? t('earnings.increasing') : t('earnings.decreasing')}
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
