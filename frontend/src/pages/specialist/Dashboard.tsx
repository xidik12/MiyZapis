import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { analyticsService, bookingService, specialistService } from '../../services';
import { storeService } from '@/services/store.service';
import { reviewsService } from '../../services/reviews.service';
import { retryRequest } from '../../services/api';
import TrialStatusBanner from '../../components/trial/TrialStatusBanner';
import { ShareButton } from '../../components/common/ShareButton';
import { HelpTip } from '@/components/common/HelpTip';
// Removed SpecialistSidebar import - layout is handled by SpecialistLayout
// Status colors for bookings
const statusColors = {
  confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
  inProgress: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  noShow: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
};
import { CalendarIcon, ChartBarIcon, CurrencyDollarIcon, StarIcon, UserGroupIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon, EyeIcon, ChatBubbleLeftRightIcon, PlusIcon, ArrowDownTrayIcon, Cog6ToothIcon } from '@/components/icons';
// Note: Use active prop for filled icons: <Icon active />
;

// Helper function to get the booking currency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getBookingCurrency = (booking: any): 'USD' | 'EUR' | 'UAH' => {
  // Use the service's stored currency, defaulting to UAH if not specified
  const currency = (booking?.service?.currency as 'USD' | 'EUR' | 'UAH') || 'USD';
  return currency;
};

// ─── Self-contained help content (trilingual, no i18n edits required) ───────
const DASHBOARD_HELP = {
  en: {
    overview: 'Your business at a glance.\n\nThis page shows key metrics computed from your real booking and retail data. All amounts are converted to your chosen display currency at current exchange rates.\n\nHow to use it:\n• Check Monthly Revenue and Completion Rate daily to spot trends.\n• Use the Quality Metrics card to identify problems early (high no-show rate → send reminders).\n• Export a report any time from the top-right button.\n\nKey terms:\n• Completed booking — a session you marked as done.\n• Display currency — set in your profile settings; all totals are shown in it.',

    totalBookings: 'All-time count of every booking ever associated with your account — completed and still upcoming.\n\nFormula: completed bookings + active (confirmed / pending / in-progress) bookings.\n\nThis number never decreases.',

    monthlyRevenue: 'Revenue earned THIS calendar month only.\n\nFormula: sum of completed-booking amounts whose appointment date falls in the current month, converted to your display currency + any retail/POS sales recorded for this month.\n\nNote: MiyZapis does not process or hold your payments. You collect money directly from clients in person. This figure reflects what you billed — it is not a platform payout.',

    averageRating: 'The average score across all customer reviews left for you.\n\nFormula: sum of all review scores ÷ total number of reviews.\n\nScale: 0 – 5.0. Shows 0 until your first review arrives.',

    responseTime: 'How quickly you act on new booking requests, measured in your working hours only.\n\nFormula: for each completed booking, count business-hours minutes between booking creation and your first status change; average those values.\n\nOnly counts time within your configured working schedule — overnight and off-day gaps are excluded. Bookings with response times over 24 business hours are treated as outliers and excluded from the average.',

    completionRate: 'What share of your concluded bookings actually got done.\n\nFormula: completed ÷ (completed + no-shows) × 100.\n\nUpcoming bookings are excluded from the denominator — they have not had a chance to complete yet. A low rate means sessions are resulting in no-shows rather than completions.',

    repeatClients: 'What share of your clients came back more than once.\n\nFormula: clients with more than one completed booking ÷ all unique clients with at least one completed booking × 100.\n\nA high percentage means strong client loyalty.',

    noShowRate: 'How often clients do not show up for their appointment.\n\nFormula: no-shows ÷ (completed + no-shows) × 100.\n\nCancellations are NOT counted as no-shows. Above 20% a warning appears — consider automated reminders.',
  },

  uk: {
    overview: 'Загальний стан вашого бізнесу одним поглядом.\n\nЦя сторінка показує ключові показники, розраховані на основі ваших реальних даних про записи та роздрібні продажі. Усі суми конвертовані у вашу обрану валюту за поточним курсом.\n\nЯк користуватися:\n• Щодня перевіряйте Дохід за місяць і Відсоток виконання — це допоможе помітити тенденції.\n• Картка «Показники якості» дозволяє швидко виявити проблеми (висока частка неявок → надсилайте нагадування).\n• Кнопка «Експорт звіту» у верхньому правому куті доступна будь-коли.\n\nОсновні терміни:\n• Завершений запис — сесія, яку ви позначили як виконану.\n• Відображувана валюта — обирається в налаштуваннях профілю; всі підсумки показуються в ній.',

    totalBookings: 'Загальна кількість усіх записів за весь час — як завершених, так і майбутніх.\n\nФормула: завершені записи + активні (підтверджені / очікують / в процесі).\n\nЦе число ніколи не зменшується.',

    monthlyRevenue: 'Дохід лише за ПОТОЧНИЙ календарний місяць.\n\nФормула: сума сум завершених записів, дата прийому яких припадає на поточний місяць, конвертована у вашу валюту + роздрібні/POS продажі за цей місяць.\n\nВажливо: MiyZapis не обробляє і не утримує ваші платежі. Ви отримуєте гроші безпосередньо від клієнтів готівкою або переказом. Ця сума відображає те, що ви виставили до оплати — це не виплата від платформи.',

    averageRating: 'Середній бал з усіх відгуків клієнтів.\n\nФормула: сума всіх оцінок ÷ кількість відгуків.\n\nШкала: 0–5,0. Показує 0, поки не надійде перший відгук.',

    responseTime: 'Наскільки швидко ви реагуєте на нові запити на запис — вимірюється лише у ваших робочих годинах.\n\nФормула: для кожного завершеного запису рахуються хвилини робочого часу між створенням запису та вашою першою зміною статусу; потім береться середнє.\n\nНічні перерви та вихідні дні не враховуються. Записи з часом реакції понад 24 робочі години вважаються викидами і виключаються.',

    completionRate: 'Яка частка завершених (термінальних) записів дійсно відбулася.\n\nФормула: завершені ÷ (завершені + неявки) × 100.\n\nМайбутні записи не враховуються в знаменнику — вони ще не мали можливості завершитися. Низький показник означає, що записи завершуються неявками, а не проведеними сесіями.',

    repeatClients: 'Яка частка ваших клієнтів повернулася більше одного разу.\n\nФормула: клієнти з більше ніж одним завершеним записом ÷ усі унікальні клієнти з хоча б одним завершеним записом × 100.\n\nВисокий відсоток свідчить про сильну лояльність клієнтів.',

    noShowRate: 'Як часто клієнти не з\'являються на прийом.\n\nФормула: неявки ÷ (завершені + неявки) × 100.\n\nСкасування НЕ вважаються неявками. При перевищенні 20% з\'являється попередження — розгляньте автоматичні нагадування.',
  },

  ru: {
    overview: 'Общее состояние вашего бизнеса с первого взгляда.\n\nЭта страница показывает ключевые показатели, рассчитанные на основе ваших реальных данных о записях и розничных продажах. Все суммы конвертируются в выбранную вами валюту по текущему курсу.\n\nКак пользоваться:\n• Ежедневно проверяйте Доход за месяц и Процент выполнения — это поможет заметить тенденции.\n• Карточка «Показатели качества» позволяет быстро выявить проблемы (высокий процент неявок → отправляйте напоминания).\n• Кнопка «Экспорт отчёта» в верхнем правом углу доступна в любое время.\n\nОсновные термины:\n• Завершённая запись — сессия, которую вы отметили как выполненную.\n• Отображаемая валюта — выбирается в настройках профиля; все итоги показываются в ней.',

    totalBookings: 'Общее количество всех записей за всё время — как завершённых, так и предстоящих.\n\nФормула: завершённые записи + активные (подтверждённые / ожидают / в процессе).\n\nЭто число никогда не уменьшается.',

    monthlyRevenue: 'Доход только за ТЕКУЩИЙ календарный месяц.\n\nФормула: сумма сумм завершённых записей, дата приёма которых приходится на текущий месяц, конвертированная в вашу валюту + розничные/POS продажи за этот месяц.\n\nВажно: MiyZapis не обрабатывает и не хранит ваши платежи. Вы получаете деньги непосредственно от клиентов наличными или переводом. Эта сумма отражает то, что вы выставили к оплате — это не выплата от платформы.',

    averageRating: 'Средний балл по всем отзывам клиентов.\n\nФормула: сумма всех оценок ÷ количество отзывов.\n\nШкала: 0–5,0. Показывает 0, пока не поступит первый отзыв.',

    responseTime: 'Насколько быстро вы реагируете на новые запросы на запись — измеряется только в ваших рабочих часах.\n\nФормула: для каждой завершённой записи считаются минуты рабочего времени между созданием записи и вашим первым изменением статуса; затем берётся среднее.\n\nНочные перерывы и выходные дни не учитываются. Записи со временем реакции более 24 рабочих часов считаются выбросами и исключаются.',

    completionRate: 'Какая доля завершённых (терминальных) записей действительно состоялась.\n\nФормула: завершённые ÷ (завершённые + неявки) × 100.\n\nПредстоящие записи не учитываются в знаменателе — у них ещё не было возможности завершиться. Низкий показатель означает, что записи завершаются неявками, а не проведёнными сессиями.',

    repeatClients: 'Какая доля ваших клиентов вернулась более одного раза.\n\nФормула: клиенты с более чем одной завершённой записью ÷ все уникальные клиенты хотя бы с одной завершённой записью × 100.\n\nВысокий процент свидетельствует о сильной лояльности клиентов.',

    noShowRate: 'Как часто клиенты не приходят на приём.\n\nФормула: неявки ÷ (завершённые + неявки) × 100.\n\nОтмены НЕ считаются неявками. При превышении 20% появляется предупреждение — рассмотрите автоматические напоминания.',
  },
};
// ─────────────────────────────────────────────────────────────────────────────

const SpecialistDashboard: React.FC = () => {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  const { formatPrice, convertPrice, currency } = useCurrency();
  const { t, language } = useLanguage();
  const dh = (DASHBOARD_HELP as any)[language] || DASHBOARD_HELP.en;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<any>({
    stats: {
      totalBookings: 0,
      monthlyRevenue: 0,
      rating: 0,
      reviewCount: 0,
      responseTime: 0,
      profileViews: 0,
      favoriteCount: 0,
      conversionRate: 0,
      completionRate: 0,
      repeatClients: 0
      // Removed punctuality - no real data available
    },
    recentBookings: [],
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [specialistSlug, setSpecialistSlug] = useState<string>('');
  // Removed sidebarOpen state - layout is handled by SpecialistLayout

  // Check if specialist needs onboarding (no services created yet)
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const services = await specialistService.getServices();
        // If no services exist, redirect to onboarding wizard
        if (!services || services.length === 0) {
          // Also check if this is a previously-dismissed onboarding
          const dismissed = localStorage.getItem('miyzapis_onboarding_dismissed');
          if (!dismissed) {
            navigate('/specialist/onboarding', { replace: true });
          }
        }
      } catch (err) {
        // If API fails, don't block the dashboard - just skip check
        console.warn('Onboarding check skipped:', err);
      }
    };
    checkOnboarding();
  }, [navigate]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load data from multiple sources with retry logic - prioritize bookings API for accuracy
        const [analyticsData, upcomingBookingsData, completedBookingsData, profileData, noShowBookingsData, storeSummaryData] = await Promise.allSettled([
          retryRequest(() => analyticsService.getOverview(), 2, 1000),
          retryRequest(() => bookingService.getBookings({ limit: 10, status: 'confirmed,pending,inProgress' as any }, 'specialist'), 2, 1000),
          retryRequest(() => bookingService.getBookings({ limit: 100, status: 'COMPLETED' }, 'specialist'), 2, 1000),
          retryRequest(() => specialistService.getProfile(), 2, 1000),
          retryRequest(() => bookingService.getBookings({ limit: 100, status: 'NO_SHOW' }, 'specialist'), 2, 1000),
          retryRequest(() => storeService.getSummary(), 1, 800),
        ]);

        if (analyticsData.status === 'rejected') {
          console.error('🔍 Analytics failed:', analyticsData.reason);
        }
        if (upcomingBookingsData.status === 'rejected') {
          console.error('🔍 Upcoming bookings failed:', upcomingBookingsData.reason);
        }
        if (completedBookingsData.status === 'rejected') {
          console.error('🔍 Completed bookings failed:', completedBookingsData.reason);
        }

        // Calculate stats from completed bookings data (accurate source) - NO MOCK DATA
        let stats = {
          totalBookings: 0,
          monthlyRevenue: 0,
          rating: 0,
          reviewCount: 0,
          responseTime: 0, // Only real data
          profileViews: 0,
          favoriteCount: 0,
          conversionRate: 0,
          completionRate: 0,
          repeatClients: 0,
          noShowRate: 0,
          noShowCount: 0,
          thisWeekBookings: 0,
          lastWeekBookings: 0,
          thisWeekRevenue: 0,
          lastWeekRevenue: 0,
          // Removed punctuality - no real data available
        };

        // Process completed bookings to calculate accurate stats
        if (completedBookingsData.status === 'fulfilled' && completedBookingsData.value) {
          try {
            const completedBookings = Array.isArray(completedBookingsData.value.bookings) ? completedBookingsData.value.bookings : [];
            const upcomingBookings = (upcomingBookingsData.status === 'fulfilled' && upcomingBookingsData.value)
              ? (Array.isArray(upcomingBookingsData.value.bookings) ? upcomingBookingsData.value.bookings : [])
              : [];

            // Total bookings = completed + pending/confirmed/inProgress
            stats.totalBookings = completedBookings.length + upcomingBookings.length;
            
            // Monthly revenue = THIS MONTH's completed-booking revenue (filtered by
            // the appointment date) + this month's retail/POS sales. (Previously
            // this summed ALL-TIME booking revenue but was labelled "Monthly", which
            // showed a lifetime total under a monthly heading.)
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const monthlyBookingRevenue = Math.round(completedBookings.reduce((sum, booking) => {
              const when = new Date((booking as any).scheduledAt || (booking as any).updatedAt || (booking as any).createdAt || 0);
              if (isNaN(when.getTime()) || when < monthStart) return sum;
              return sum + convertPrice(booking.totalAmount || 0, getBookingCurrency(booking));
            }, 0) * 100) / 100;

            // Retail/POS summary is already this-month only (converted from the
            // shop's currency into the display currency).
            let retailRevenue = 0;
            if (storeSummaryData.status === 'fulfilled' && storeSummaryData.value) {
              const s = storeSummaryData.value as { monthSalesTotal?: number; currency?: string };
              retailRevenue = convertPrice(Number(s.monthSalesTotal || 0), (s.currency as any) || 'UAH');
            }
            stats.monthlyRevenue = Math.round((monthlyBookingRevenue + retailRevenue) * 100) / 100;
            
            // Calculate completion rate: completed ÷ (completed + noShows) only.
            // Upcoming bookings are excluded — they haven't had a chance to complete
            // and dragging them into the denominator unfairly suppresses the rate.
            // noShowBookingsData is fetched in parallel above and used below.
            const noShowsForRate = (noShowBookingsData.status === 'fulfilled' && noShowBookingsData.value)
              ? (Array.isArray(noShowBookingsData.value.bookings) ? noShowBookingsData.value.bookings.length : 0)
              : 0;
            const terminalTotal = completedBookings.length + noShowsForRate;
            if (terminalTotal > 0) {
              stats.completionRate = Math.round((completedBookings.length / terminalTotal) * 100);
              stats.conversionRate = stats.completionRate;
            }
            
            // Calculate response time counting only business working hours
            // Extract specialist working hours from profile
            let workingHoursMap: Record<string, { start: string; end: string; isWorking: boolean }> | null = null;
            if (profileData.status === 'fulfilled' && profileData.value) {
              const prof = profileData.value as any;
              const wh = prof?.availability?.workingHours || prof?.workingHours;
              if (wh && typeof wh === 'object') {
                workingHoursMap = wh;
              }
            }

            // Helper: calculate minutes elapsed only during business hours
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const calcBusinessMinutes = (start: Date, end: Date): number => {
              if (!workingHoursMap) {
                // Fallback: no working hours set, count raw elapsed time
                return (end.getTime() - start.getTime()) / (1000 * 60);
              }

              let minutes = 0;
              const cursor = new Date(start);

              // Cap at 30 days to avoid infinite loops on bad data
              const maxEnd = new Date(start);
              maxEnd.setDate(maxEnd.getDate() + 30);
              const safeEnd = end < maxEnd ? end : maxEnd;

              while (cursor < safeEnd) {
                const dayName = dayNames[cursor.getDay()];
                const daySchedule = workingHoursMap![dayName];

                if (daySchedule && daySchedule.isWorking && daySchedule.start && daySchedule.end) {
                  const [startH, startM] = daySchedule.start.split(':').map(Number);
                  const [endH, endM] = daySchedule.end.split(':').map(Number);

                  const workStart = new Date(cursor);
                  workStart.setHours(startH, startM, 0, 0);
                  const workEnd = new Date(cursor);
                  workEnd.setHours(endH, endM, 0, 0);

                  // Overlap between [cursor..safeEnd] and [workStart..workEnd]
                  const overlapStart = cursor > workStart ? cursor : workStart;
                  const overlapEnd = safeEnd < workEnd ? safeEnd : workEnd;

                  if (overlapStart < overlapEnd) {
                    minutes += (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
                  }
                }

                // Move cursor to start of next day
                cursor.setDate(cursor.getDate() + 1);
                cursor.setHours(0, 0, 0, 0);
              }

              return minutes;
            };

            let totalResponseTimeMinutes = 0;
            let responsiveBookings = 0;

            completedBookings.forEach(booking => {
              if (booking.createdAt && booking.updatedAt) {
                try {
                  const created = new Date(booking.createdAt);
                  const responded = new Date(booking.updatedAt);

                  if (responded > created) {
                    const bizMinutes = calcBusinessMinutes(created, responded);
                    // Cap individual response at 24 hours (1440 min) to filter outliers
                    if (bizMinutes > 0 && bizMinutes <= 1440) {
                      totalResponseTimeMinutes += bizMinutes;
                      responsiveBookings++;
                    }
                  }
                } catch (e) {
                  console.warn('Invalid booking dates:', booking);
                }
              }
            });

            if (responsiveBookings > 0) {
              stats.responseTime = Math.round(totalResponseTimeMinutes / responsiveBookings);
            }
            
            // Only use real data - no estimates or defaults
            // rating: 0 (no real rating data available)
            // reviewCount: 0 (no real review data available)
            
            // Calculate repeat clients from actual customer booking frequency (real data only)
            const customerCounts = new Map();
            completedBookings.forEach(booking => {
              if (booking.customer?.id) {
                customerCounts.set(booking.customer.id, (customerCounts.get(booking.customer.id) || 0) + 1);
              }
            });
            
            if (customerCounts.size > 0) {
              const repeatCustomers = Array.from(customerCounts.values()).filter(count => count > 1).length;
              stats.repeatClients = Math.round((repeatCustomers / customerCounts.size) * 100);
            }

            // Calculate no-show rate
            if (noShowBookingsData.status === 'fulfilled' && noShowBookingsData.value) {
              const noShowBookings = Array.isArray(noShowBookingsData.value.bookings) ? noShowBookingsData.value.bookings : [];
              stats.noShowCount = noShowBookings.length;
              const totalForRate = completedBookings.length + noShowBookings.length;
              if (totalForRate > 0) {
                stats.noShowRate = Math.round((noShowBookings.length / totalForRate) * 100);
              }
            }

            // Week-over-week comparison
            const now = new Date();
            const startOfThisWeek = new Date(now);
            startOfThisWeek.setDate(now.getDate() - now.getDay());
            startOfThisWeek.setHours(0, 0, 0, 0);
            const startOfLastWeek = new Date(startOfThisWeek);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

            completedBookings.forEach((booking: any) => {
              const completedDate = new Date(booking.completedAt || booking.updatedAt || booking.scheduledAt);
              const amount = booking.totalAmount || 0;
              if (completedDate >= startOfThisWeek) {
                stats.thisWeekBookings++;
                stats.thisWeekRevenue += amount;
              } else if (completedDate >= startOfLastWeek && completedDate < startOfThisWeek) {
                stats.lastWeekBookings++;
                stats.lastWeekRevenue += amount;
              }
            });

          } catch (err) {
            console.warn('Error processing completed bookings:', err);
          }
        }

        // Try to enhance with analytics data if available, but don't rely on it
        if (analyticsData.status === 'fulfilled' && analyticsData.value) {
          const overview = analyticsData.value;
          
          // Only use analytics data if it seems reasonable (not zeros)
          if (overview.averageRating > 0) {
            stats.rating = overview.averageRating;
          }
          // Skip analytics responseTime — we already calculated it using business hours only
          if (overview.totalBookings > stats.totalBookings) {
            stats.totalBookings = overview.totalBookings;
          }
        }

        // Enhance with real review stats (average rating, review count)
        try {
          const profile = profileData.status === 'fulfilled' ? profileData.value : null;
          const specialistId = (profile as any)?.id || (profile as any)?.specialist?.id;

          // Use profile rating as baseline fallback
          const profileRating = (profile as any)?.rating || (profile as any)?.specialist?.rating;
          const profileReviewCount = (profile as any)?.reviewCount || (profile as any)?.specialist?.reviewCount;
          if (profileRating > 0 && stats.rating === 0) {
            stats.rating = profileRating;
          }
          if (profileReviewCount > 0 && stats.reviewCount === 0) {
            stats.reviewCount = profileReviewCount;
          }

          if (specialistId) {
            const reviewStats = await reviewsService.getSpecialistReviewStats(specialistId);
            if (reviewStats.totalReviews > 0) {
              stats.rating = reviewStats.averageRating;
              stats.reviewCount = reviewStats.totalReviews;
            }
          }
        } catch (e) {
          console.warn('Unable to enhance rating from review stats:', e);
        }

        // Store specialist slug for share button
        if (profileData.status === 'fulfilled' && profileData.value) {
          const prof = profileData.value as any;
          setSpecialistSlug(prof.slug || prof.id || '');
        }

        // Process bookings data correctly: completed for recent, upcoming for appointments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let recentBookings: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let upcomingAppointments: any[] = [];

        // Recent Bookings should show recently completed bookings (Sep 2, Sep 4, etc.)
        if (completedBookingsData.status === 'fulfilled' && completedBookingsData.value) {
          try {
            const completedBookings = Array.isArray(completedBookingsData.value.bookings) ? completedBookingsData.value.bookings : [];

            recentBookings = completedBookings
              .filter((booking: any) => booking && booking.id)
              .sort((a: any, b: any) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime()) // Most recent first
              .slice(0, 5)
              .map((booking: any) => {
                // Format date nicely instead of raw ISO format
                const rawDate = booking.completedAt || booking.scheduledAt || booking.createdAt;
                let formattedDate = t('common.notAvailable') || 'N/A';
                try {
                  if (rawDate) {
                    const date = new Date(rawDate);
                    formattedDate = date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) + ' at ' + date.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                  }
                } catch (e) {
                  console.warn('Invalid date format:', rawDate);
                }
                
                const processedBooking = {
                  id: booking.id,
                  customerName: booking.customer ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() || 'Customer' : 'Customer',
                  serviceName: booking.service?.name || 'Service',
                  date: formattedDate, // Now properly formatted
                  status: 'completed',
                  amount: booking.totalAmount || 0,
                  totalAmount: booking.totalAmount || 0, // Keep both for compatibility
                  service: booking.service // Preserve service object for currency detection
                };
                
                return processedBooking;
              });
          } catch (err) {
            console.warn('Error processing completed bookings for recent list:', err);
          }
        }

        // Today's appointments should show upcoming bookings scheduled for today
        if (upcomingBookingsData.status === 'fulfilled' && upcomingBookingsData.value) {
          try {
            const upcomingBookings = Array.isArray(upcomingBookingsData.value.bookings) ? upcomingBookingsData.value.bookings : [];

            upcomingAppointments = upcomingBookings
              .filter((booking: any) => {
                if (!booking || !booking.scheduledAt) return false;
                const bookingDate = new Date(booking.scheduledAt);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Start of today
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999); // End of today
                return bookingDate >= today && bookingDate <= endOfToday;
              })
              .map((booking: any) => ({
                id: booking.id,
                customerName: booking.customer ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() || 'Customer' : 'Customer',
                serviceName: booking.service?.name || 'Service',
                time: new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                duration: booking.duration != null ? `${booking.duration} min` : (booking.service?.duration != null ? `${booking.service.duration} min` : '—'),
                type: booking.meetingLink ? 'online' : 'offline'
              }));
          } catch (err) {
            console.warn('Error processing upcoming bookings data:', err);
          }
        }

        setDashboardData({
          stats,
          recentBookings,
          upcomingAppointments
        });

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        // Keep default empty state on error
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('dashboard.welcome.morning');
    if (hour < 17) return t('dashboard.welcome.afternoon');
    return t('dashboard.welcome.evening');
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.pending;
  };

  const getStatusText = (status: string) => {
    return t(`dashboard.booking.status.${status}` as any) || status;
  };

  // Export handler for dashboard report
  const handleExportReport = async () => {
    try {
      // Create a comprehensive dashboard report
      const content = `
Dashboard Report - Generated ${new Date().toLocaleDateString()}

Specialist: ${user?.firstName} ${user?.lastName}
Generated: ${new Date().toLocaleString()}
Currency: ${currency}

STATISTICS
==========
Total Bookings: ${dashboardData.stats.totalBookings || 0}
Monthly Revenue: ${formatPrice(dashboardData.stats.monthlyRevenue || 0, currency)}
Average Rating: ${dashboardData.stats.rating || 'N/A'}
Review Count: ${dashboardData.stats.reviewCount || 0}
Response Time: ${dashboardData.stats.responseTime || 'N/A'} minutes
Profile Views: ${dashboardData.stats.profileViews || 0}
Favorite Count: ${dashboardData.stats.favoriteCount || 0}
Conversion Rate: ${dashboardData.stats.conversionRate || 'N/A'}%
Completion Rate: ${dashboardData.stats.completionRate || 'N/A'}%
Repeat Clients: ${dashboardData.stats.repeatClients || 0}

RECENT BOOKINGS
===============
${dashboardData.recentBookings?.length ? dashboardData.recentBookings.map((booking: any) =>
  `- ${booking.service?.name || 'Service'}: ${booking.customer?.firstName} ${booking.customer?.lastName} (${booking.date})`
).join('\n') : 'No recent bookings'}

UPCOMING APPOINTMENTS
====================
${dashboardData.upcomingAppointments?.length ? dashboardData.upcomingAppointments.map((booking: any) =>
  `- ${booking.service?.name || 'Service'}: ${booking.customer?.firstName} ${booking.customer?.lastName} (${booking.date})`
).join('\n') : 'No upcoming appointments'}
      `;

      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting dashboard report:', error);
      toast.error(t('dashboard.exportError') || 'Failed to export dashboard report. Please try again.');
    }
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, iconBg, description, helpTip }: { title: string; value: string | number; change?: string; changeType?: string; icon: React.ElementType; iconBg: string; description?: string; helpTip?: React.ReactNode }) => (
    <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer transition duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
            {helpTip}
          </div>
          {loading ? (
            <div className="mb-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            </div>
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 tabular-nums">{value}</p>
          )}
          {description && !loading && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
          {loading && (
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
          )}
          {change && !loading && (
            <div className={`flex items-center mt-2 text-xs sm:text-sm ${
              changeType === 'positive' ? 'text-success-600' : 'text-error-600'
            }`}>
              {changeType === 'positive' ? (
                <ArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${iconBg} flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {user?.firstName}! 👋
            </h1>
            <HelpTip title={t('help.dashboard.title') || 'Dashboard'} content={dh.overview} />
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('dashboard.today')} {currentTime.toLocaleDateString(
              language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US',
              { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }
            )}
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Link
            to="/specialist/services"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition duration-200 active:scale-[0.96] font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {t('dashboard.specialist.addService')}
          </Link>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200 active:scale-[0.96] font-medium text-sm sm:text-base"
          >
            <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {t('dashboard.specialist.exportReport')}
          </button>
          {specialistSlug && (
            <ShareButton
              variant="icon"
              className="h-10 w-10 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              url={`${window.location.origin}/s/${specialistSlug}`}
              title={`${user?.firstName} ${user?.lastName} — MiyZapys`}
              text={t('dashboard.shareProfile') || 'Share Your Profile'}
            />
          )}
        </div>
      </div>

      {/* Trial Status Banner */}
      <TrialStatusBanner
        trialStartDate={user?.trialStartDate}
        trialEndDate={user?.trialEndDate}
        isInTrial={user?.isInTrial}
        userType="specialist"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title={t('dashboard.specialist.totalBookings')}
          value={dashboardData.stats.totalBookings}
          change={dashboardData.stats.lastWeekBookings > 0
            ? `${dashboardData.stats.thisWeekBookings >= dashboardData.stats.lastWeekBookings ? '+' : ''}${Math.round(((dashboardData.stats.thisWeekBookings - dashboardData.stats.lastWeekBookings) / dashboardData.stats.lastWeekBookings) * 100)}% ${t('dashboard.weekOverWeek') || 'vs last week'}`
            : dashboardData.stats.thisWeekBookings > 0 ? `${dashboardData.stats.thisWeekBookings} ${t('dashboard.weekOverWeek') || 'this week'}` : ''}
          changeType={dashboardData.stats.thisWeekBookings >= dashboardData.stats.lastWeekBookings ? 'positive' : 'negative'}
          icon={CalendarIcon}
          iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
          description={t('dashboard.specialist.allTime')}
          helpTip={<HelpTip title={t('dashboard.specialist.totalBookings')} content={dh.totalBookings} />}
        />
        <StatCard
          title={t('dashboard.specialist.monthlyRevenue')}
          value={formatPrice(dashboardData.stats.monthlyRevenue, currency)}
          change={dashboardData.stats.lastWeekRevenue > 0
            ? `${dashboardData.stats.thisWeekRevenue >= dashboardData.stats.lastWeekRevenue ? '+' : ''}${Math.round(((dashboardData.stats.thisWeekRevenue - dashboardData.stats.lastWeekRevenue) / dashboardData.stats.lastWeekRevenue) * 100)}% ${t('dashboard.weekOverWeek') || 'vs last week'}`
            : dashboardData.stats.thisWeekRevenue > 0 ? `${formatPrice(dashboardData.stats.thisWeekRevenue, currency)} ${t('dashboard.weekOverWeek') || 'this week'}` : ''}
          changeType={dashboardData.stats.thisWeekRevenue >= dashboardData.stats.lastWeekRevenue ? 'positive' : 'negative'}
          icon={CurrencyDollarIcon}
          iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
          description={t('dashboard.specialist.thisMonth')}
          helpTip={<HelpTip title={t('dashboard.specialist.monthlyRevenue')} content={dh.monthlyRevenue} />}
        />
        <StatCard
          title={t('dashboard.specialist.averageRating')}
          value={`${dashboardData.stats.rating}/5.0`}
          change={undefined}
          changeType="positive"
          icon={StarIcon}
          iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
          description={`${dashboardData.stats.reviewCount} ${t('dashboard.nav.reviews').toLowerCase()}`}
          helpTip={<HelpTip title={t('dashboard.specialist.averageRating')} content={dh.averageRating} />}
        />
        <StatCard
          title={t('dashboard.specialist.responseTime')}
          value={dashboardData.stats.responseTime >= 60
            ? `${Math.round(dashboardData.stats.responseTime / 60)} ${t('time.hours') || 'h'}`
            : `${dashboardData.stats.responseTime} ${t('time.minutes')}`}
          change={undefined}
          changeType="positive"
          icon={ClockIcon}
          iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
          description={t('dashboard.specialist.averageTime')}
          helpTip={<HelpTip title={t('dashboard.specialist.responseTime')} content={dh.responseTime} />}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.specialist.profileActivity')}</h3>
            <EyeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('dashboard.specialist.profileViews')}</span>
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{dashboardData.stats.profileViews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('dashboard.specialist.favoriteCount')}</span>
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{dashboardData.stats.favoriteCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer transition duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.specialist.qualityMetrics')}</h3>
            <ChartBarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                {t('dashboard.specialist.completionRate')}
                <HelpTip title={t('dashboard.specialist.completionRate')} content={dh.completionRate} />
              </span>
              <span className="font-semibold text-success-600 tabular-nums">{dashboardData.stats.completionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                {t('dashboard.specialist.repeatClients')}
                <HelpTip title={t('dashboard.specialist.repeatClients')} content={dh.repeatClients} />
              </span>
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{dashboardData.stats.repeatClients}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                {t('dashboard.noShowRate') || 'No-Show Rate'}
                <HelpTip title={t('dashboard.noShowRate') || 'No-Show Rate'} content={dh.noShowRate} />
              </span>
              <span className={`font-semibold tabular-nums ${dashboardData.stats.noShowRate > 20 ? 'text-error-600' : 'text-gray-900 dark:text-white'}`}>
                {dashboardData.stats.noShowRate}%
              </span>
            </div>
          </div>
          {dashboardData.stats.noShowRate > 20 && (
            <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('dashboard.noShowWarning') || 'High no-show rate detected. Consider sending reminders to clients.'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-primary-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold">{t('dashboard.quickActions')}</h3>
            <UserGroupIcon className="w-5 h-5 opacity-80" />
          </div>
          <div className="space-y-2">
            <Link
              to="/specialist/schedule"
              className="w-full text-left py-2 px-3 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 transition duration-200 active:scale-[0.96] text-sm font-medium flex items-center"
            >
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
              {t('dashboard.specialist.manageSchedule')}
            </Link>
            <Link
              to="/specialist/reviews"
              className="w-full text-left py-2 px-3 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 transition duration-200 active:scale-[0.96] text-sm font-medium flex items-center"
            >
              <StarIcon className="w-4 h-4 mr-2" />
              {t('dashboard.specialist.viewReviews')}
            </Link>
            <Link
              to="/specialist/messages"
              className="w-full text-left py-2 px-3 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 transition duration-200 active:scale-[0.96] text-sm font-medium flex items-center"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              {t('dashboard.specialist.messageClients')}
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.specialist.recentBookings')}</h3>
            <Link 
              to="/specialist/bookings"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-4">
            {dashboardData.recentBookings.slice(0, 4).map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-200">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-10 h-10 flex-shrink-0 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {(booking.customerName || 'U').split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{booking.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{booking.serviceName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {booking.date}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">
                    {formatPrice(booking.totalAmount, getBookingCurrency(booking))}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.specialist.todaysSchedule')}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentTime.toLocaleDateString(
                language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US',
                { day: 'numeric', month: 'short' }
              )}
            </span>
          </div>
          <div className="space-y-4">
            {dashboardData.upcomingAppointments.map((appointment: any) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-md transition duration-200">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {(appointment.customerName || 'U').split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{appointment.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{appointment.serviceName}</p>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{appointment.time}</span>
                      <span>•</span>
                      <span>{appointment.duration}</span>
                      <span>•</span>
                      <span className={appointment.type === 'online' ? 'text-primary-600' : 'text-secondary-600'}>
                        {appointment.type === 'online'
                          ? `🔗 ${t('dashboard.specialist.online')}`
                          : `🏢 ${t('dashboard.specialist.offline')}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <button
                    onClick={() => navigate('/specialist/messages')}
                    className="p-2.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-xl transition duration-200 active:scale-[0.96]"
                    title={t('dashboard.specialist.goToMessages') || 'Messages'}
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate('/specialist/schedule')}
                    className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition duration-200 active:scale-[0.96]"
                    title={t('dashboard.specialist.goToSchedule') || 'Schedule'}
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {dashboardData.upcomingAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.specialist.noAppointments')}</p>
                <p className="text-sm">{t('dashboard.specialist.freeTimeMessage')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistDashboard;
