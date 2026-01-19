import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import baseEnTranslations from './translations-en.json';

export type Language = 'en' | 'kh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

interface TranslationValue {
  en: string;
  kh: string;
}

type Translations = Record<string, TranslationValue>;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const createTranslations = (): Translations => {
  const map: Translations = {};

  const normalize = (value: string) =>
    value
      .replace(/MiyZap[iy]s/gi, 'Panhaha')
      .replace(/Miyzapis/gi, 'Panhaha')
      .replace(/VicheaPro/gi, 'Panhaha');

  // First load all translations from JSON file
  for (const [key, value] of Object.entries(baseEnTranslations)) {
    const normalized = normalize(value);
    map[key] = { en: normalized, kh: normalized };
  }

  // Then allow manual overrides with ensure()
  const ensure = (key: string, en: string, kh?: string) => {
    // Only override if explicitly providing different content
    if (!map[key] || map[key].en !== en) {
      map[key] = { en, kh: kh ?? en };
    }
  };

  // Branding
  ensure('brand.name', 'Panhaha');
  ensure('brand.tagline', 'Professional Services Marketplace');

  // Hero
  ensure('hero.title', 'Find Expert Services in Cambodia');
  ensure('hero.title1', 'Book trusted Cambodian specialists');
  ensure('hero.title2', 'Elevate every appointment with Panhaha');
  ensure('hero.badge', 'Cambodian excellence');
  ensure(
    'hero.subtitle',
    'Connect with verified specialists and businesses. Book appointments instantly.'
  );
  ensure('hero.searchPlaceholder', 'Search for services...');
  ensure('hero.searchButton', 'Search');

  // CTA
  ensure('cta.title', 'Ready to Get Started?');
  ensure('cta.subtitle.loggedOut', 'Join thousands of satisfied customers and businesses');
  ensure('cta.subtitle.loggedIn', 'Find your next professional service');
  ensure('cta.browseServices', 'Browse Services');
  ensure('cta.signUpCustomer', 'Sign Up as Customer');
  ensure('cta.joinSpecialist', 'Join as Specialist');
  ensure('cta.joinBusiness', 'Register Your Business');

  // Currency
  ensure('currency.usd', 'US Dollar', 'ដុល្លារអាមេរិក');
  ensure('currency.khr', 'Khmer Riel', 'រៀលខ្មែរ');

  // Theme
  ensure('settings.language', 'Language', 'ភាសា');
  ensure('settings.languageDescription', 'Set your preferred language and currency', 'កំណត់ភាសា និងរូបិយប័ណ្ណដែលអ្នកចូលចិត្ត');
  ensure('settings.languagePreferences', 'Language Preferences', 'ការកំណត់ភាសា');
  ensure('settings.interfaceLanguage', 'Interface Language', 'ភាសាបង្ហាញ');
  ensure('settings.theme', 'Theme', 'ប្រធានបទ');
  ensure('settings.theme.light', 'Light', 'ពន្លឺ');
  ensure('settings.theme.dark', 'Dark', 'ងងឹត');
  ensure('settings.theme.system', 'System', 'ប្រព័ន្ធ');
  ensure('settings.currency', 'Currency', 'រូបិយប័ណ្ណ');

  // Auth - Registration Account Types
  ensure('auth.register.individualSpecialist', 'Individual Specialist', 'អ្នកជំនាញបុគ្គល');
  ensure('auth.register.individualSpecialistDesc', 'I offer services independently', 'ខ្ញុំផ្តល់សេវាកម្មដោយឯករាជ្យ');
  ensure('auth.register.businessAccount', 'Business Account', 'គណនីអាជីវកម្ម');
  ensure('auth.register.businessAccountDesc', 'Clinic, salon, spa with multiple staff', 'គ្លីនិក សាឡុនសម្រស់ ស្ប៉ាជាមួយបុគ្គលិកច្រើន');

  const fallbackEntries: Record<string, string> = {
    'actions.bookNow': 'Book now',
    'actions.bookAgain': 'Book Again',
    'actions.retry': 'Retry',
    'actions.review': 'Review',
    'auth.error.passwordsNotMatch': 'Passwords do not match.',
    'booking.autoBookingConfirmed': 'This booking was automatically confirmed.',
    'booking.bookingConfirmed': 'Booking confirmed!',
    'booking.cannotBookOwn': 'You cannot book your own service.',
    'booking.confirmed': 'Confirmed',
    'booking.originalPrice': 'Original price',
    'booking.selectReward': 'Select a reward to apply',
    'bookingDetails.contactNotAvailable': 'Contact not available',
    'bookingDetails.joinMeeting': 'Join meeting',
    'bookingDetails.meetingLink': 'Meeting link',
    'bookings.accessInstructions': 'Access instructions',
    'bookings.address': 'Address',
    'bookings.cancelledSuccessfully': 'Booking cancelled successfully.',
    'bookings.contactInfoNote': 'Contact details are shared once the booking is confirmed.',
    'bookings.contactInformation': 'Contact information',
    'bookings.instructions': 'Instructions',
    'bookings.locationInfoNote': 'Location details are visible after confirmation.',
    'bookings.locationNotes': 'Location notes',
    'bookings.parking': 'Parking',
    'bookings.phone': 'Phone',
    'bookings.serviceLocation': 'Service location',
    'bookings.specialistNotes': 'Specialist notes',
    'bookings.whatsapp': 'WhatsApp',
    'common.any': 'Any',
    'common.clear': 'Clear',
    'earnings.decreasing': 'Decreasing',
    'errors.loadingFailed': 'Something went wrong while loading data.',
    'errors.serviceNotFound': 'Service not found.',
    'filters.ascending': 'Ascending',
    'help.contactMethodsWillBeAddedSoon': 'Contact methods will be added soon.',
    'help.faqsWillBeAddedSoon': 'FAQs will be added soon.',
    'help.noContactMethodsAvailable': 'No contact methods available yet.',
    'help.noFAQsAvailable': 'No FAQs available yet.',
    'messages.typing': 'Typing...',
    'notifications.caughtUp': 'You are all caught up!',
    'notifications.error.title': 'Notification error',
    'notifications.filter.unread': 'Unread',
    'notifications.markAsRead': 'Mark as read',
    'notifications.noNotifications': 'No notifications yet',
    'notifications.noNotificationsDescription': 'When you receive updates, they will appear here.',
    'notifications.subtitle': 'Stay up to date with your activity',
    'notifications.unread': 'Unread',
    'pagination.next': 'Next',
    'pagination.of': 'of',
    'pagination.previous': 'Previous',
    'pagination.results': 'results',
    'pagination.showing': 'Showing',
    'pagination.to': 'to',
    'reviews.anonymousUser': 'Anonymous user',
    'reviews.reviewSubmitted': 'Thank you! Your review has been submitted.',
    'search.distance': 'Distance',
    'search.location': 'Location',
    'search.locationPlaceholder': 'Enter a city or address',
    'search.minimumRating': 'Minimum rating',
    'search.sortBy.title': 'Sort by',
    'services.categoriesError': 'Unable to load categories right now.',
    'services.loadingCategories': 'Loading categories...',
    'specialtyForm.addCustomSpecialty': 'Add custom specialty',
    'specialtyForm.customSpecialtyHint': 'Describe the specialty you offer.',
    'specialtyForm.enterCustomSpecialty': 'Enter custom specialty',
    'specialtyForm.maxSelectionsReached': 'You have reached the maximum number of specialties.',
    'specialtyForm.searchSpecialties': 'Search specialties',
  };

  for (const [key, value] of Object.entries(fallbackEntries)) {
    ensure(key, value);
  }

  // Schedule translations
  ensure('schedule.monthlyView', 'Monthly View', 'ទិដ្ឋភាពប្រចាំខែ');
  ensure('schedule.weeklyView', 'Weekly View', 'ទិដ្ឋភាពប្រចាំសប្តាហ៍');
  ensure('schedule.timeSlotsAvailable', 'Time Slots Available', 'ម៉ោងដែលអាចប្រើបាន');
  ensure('schedule.noSlotsAvailable', 'No slots available', 'គ្មានម៉ោងទំនេរ');
  ensure('schedule.viewDetails', 'View Details', 'មើលព័ត៌មានលម្អិត');

  // Messages translations
  ensure('messages.noMessages', 'No messages yet', 'មិនទាន់មានសារ');
  ensure('messages.startConversation', 'Start a conversation', 'ចាប់ផ្តើមការសន្ទនា');
  ensure('messages.typeMessage', 'Type a message...', 'វាយសារ...');
  ensure('messages.sendMessage', 'Send Message', 'ផ្ញើសារ');

  // Reviews translations
  ensure('reviews.noReviews', 'No reviews yet', 'មិនទាន់មានការវាយតម្លៃ');
  ensure('reviews.writeReview', 'Write a Review', 'សរសេរការវាយតម្លៃ');
  ensure('reviews.rating', 'Rating', 'ការវាយតម្លៃ');
  ensure('reviews.helpful', 'Helpful', 'មានប្រយោជន៍');
  ensure('reviews.notHelpful', 'Not Helpful', 'គ្មានប្រយោជន៍');

  // Bookings translations
  ensure('bookings.pending', 'Pending', 'កំពុងរង់ចាំ');
  ensure('bookings.confirmed', 'Confirmed', 'បានបញ្ជាក់');
  ensure('bookings.inProgress', 'In Progress', 'កំពុងដំណើរការ');
  ensure('bookings.completed', 'Completed', 'បានបញ្ចប់');
  ensure('bookings.cancelled', 'Cancelled', 'បានលុបចោល');
  ensure('bookings.noShow', 'No Show', 'មិនបានមកដល់');

  // Dashboard translations
  ensure('dashboard.overview', 'Overview', 'ទិដ្ឋភាពទូទៅ');
  ensure('dashboard.statistics', 'Statistics', 'ស្ថិតិ');
  ensure('dashboard.recentActivity', 'Recent Activity', 'សកម្មភាពថ្មីៗ');

  // Finances translations
  ensure('finances.title', 'Finances', 'ហិរញ្ញវត្ថុ');
  ensure('finances.subtitle', 'Track your business expenses and profitability', 'តាមដានការចំណាយ និងប្រាក់ចំណេញអាជីវកម្មរបស់អ្នក');
  ensure('finances.addExpense', 'Add Expense', 'បន្ថែមការចំណាយ');
  ensure('finances.editExpense', 'Edit Expense', 'កែសម្រួលការចំណាយ');
  ensure('finances.totalExpenses', 'Total Expenses', 'ការចំណាយសរុប');
  ensure('finances.totalCount', 'Total Transactions', 'ចំនួនប្រតិបត្តិការសរុប');
  ensure('finances.avgMonthly', 'Avg Monthly', 'មធ្យមប្រចាំខែ');
  ensure('finances.totalIncome', 'Total Income', 'ប្រាក់ចំណូលសរុប');
  ensure('finances.netProfit', 'Net Profit', 'ប្រាក់ចំណេញសុទ្ធ');
  ensure('finances.byCategory', 'Expenses by Category', 'ការចំណាយតាមប្រភេទ');
  ensure('finances.recentExpenses', 'Recent Expenses', 'ការចំណាយថ្មីៗ');
  ensure('finances.noExpenses', 'No expenses found', 'រកមិនឃើញការចំណាយ');
  ensure('finances.category', 'Category', 'ប្រភេទ');
  ensure('finances.amount', 'Amount', 'ចំនួនទឹកប្រាក់');
  ensure('finances.description', 'Description', 'ការពិពណ៌នា');
  ensure('finances.date', 'Date', 'កាលបរិច្ឆេទ');
  ensure('finances.startDate', 'Start Date', 'កាលបរិច្ឆេទចាប់ផ្តើម');
  ensure('finances.endDate', 'End Date', 'កាលបរិច្ឆេទបញ្ចប់');
  ensure('finances.allCategories', 'All Categories', 'គ្រប់ប្រភេទ');
  ensure('finances.recurring', 'Recurring expense', 'ការចំណាយប្រចាំ');
  ensure('finances.frequency', 'Frequency', 'ប្រេកង់');
  ensure('finances.weekly', 'Weekly', 'ប្រចាំសប្តាហ៍');
  ensure('finances.monthly', 'Monthly', 'ប្រចាំខែ');
  ensure('finances.quarterly', 'Quarterly', 'ប្រចាំត្រីមាស');
  ensure('finances.yearly', 'Yearly', 'ប្រចាំឆ្នាំ');
  ensure('finances.update', 'Update', 'ធ្វើបច្ចុប្បន្នភាព');
  ensure('finances.add', 'Add', 'បន្ថែម');
  ensure('finances.cancel', 'Cancel', 'បោះបង់');
  ensure('finances.deleteConfirm', 'Are you sure you want to delete this expense?', 'តើអ្នកប្រាកដថាចង់លុបការចំណាយនេះ?');
  // Expense categories
  ensure('finances.category.rent', 'Rent', 'ការជួល');
  ensure('finances.category.utilities', 'Utilities', 'ប្រើប្រាស់សាធារណៈ');
  ensure('finances.category.consumables', 'Consumables', 'សម្ភារៈប្រើប្រាស់');
  ensure('finances.category.equipment', 'Equipment', 'ឧបករណ៍');
  ensure('finances.category.insurance', 'Insurance', 'ធានារ៉ាប់រង');
  ensure('finances.category.marketing', 'Marketing', 'ទីផ្សារ');
  ensure('finances.category.salaries', 'Salaries', 'ប្រាក់បៀវត្សរ៍');
  ensure('finances.category.other', 'Other', 'ផ្សេងទៀត');
  ensure('nav.finances', 'Finances', 'ហិរញ្ញវត្ថុ');

  // Earnings translations
  ensure('earnings.subtitle', 'Track your income, expenses, and profitability', 'តាមដានប្រាក់ចំណូល ការចំណាយ និងប្រាក់ចំណេញ');
  ensure('earnings.totalEarnings', 'Total Earnings', 'ប្រាក់ចំណូលសរុប');
  ensure('earnings.thisMonth', 'This Month', 'ខែនេះ');
  ensure('earnings.thisMonthExpenses', 'This Month Expenses', 'ការចំណាយខែនេះ');
  ensure('earnings.pending', 'Pending', 'កំពុងរង់ចាំ');
  ensure('earnings.lastPayout', 'Last Payout', 'ការទូទាត់ចុងក្រោយ');
  ensure('earnings.completedBookings', 'Completed Bookings', 'ការកក់បានបញ្ចប់');
  ensure('earnings.activeClients', 'Active Clients', 'អតិថិជនសកម្ម');
  ensure('earnings.averageBookingValue', 'Avg Booking Value', 'តម្លៃមធ្យមក្នុងមួយកក់');
  ensure('earnings.monthlyGrowth', 'Monthly Growth', 'កំណើនប្រចាំខែ');
  ensure('earnings.conversionRate', 'Conversion Rate', 'អត្រាបម្លែង');
  ensure('earnings.repeatCustomers', 'Repeat Customers', 'អតិថិជនដដែលៗ');
  ensure('earnings.peakHours', 'Peak Hours', 'ម៉ោងកំពូល');
  ensure('earnings.bestDay', 'Best Day', 'ថ្ងៃល្អបំផុត');
  ensure('earnings.avgSessionValue', 'Avg Session Value', 'តម្លៃមធ្យមក្នុងមួយវគ្គ');
  ensure('earnings.totalExpenses', 'Total Expenses', 'ការចំណាយសរុប');
  ensure('earnings.netProfit', 'Net Profit', 'ប្រាក់ចំណេញសុទ្ធ');
  ensure('earnings.thisMonthNetProfit', 'This Month Net Profit', 'ប្រាក់ចំណេញសុទ្ធខែនេះ');
  ensure('earnings.profitMargin', 'Profit Margin', 'អត្រាចំណេញ');
  ensure('earnings.monthlyEarnings', 'Monthly Earnings', 'ប្រាក់ចំណូលប្រចាំខែ');
  ensure('earnings.bookings', 'bookings', 'ការកក់');
  ensure('earnings.noData', 'No data', 'គ្មានទិន្នន័យ');
  ensure('earnings.noDataAvailable', 'No data available yet', 'មិនទាន់មានទិន្នន័យ');
  ensure('earnings.detailedAnalytics', 'Detailed Analytics', 'ការវិភាគលម្អិត');
  ensure('earnings.performanceMetrics', 'Performance Metrics', 'រង្វាស់សមត្ថភាព');
  ensure('earnings.timeAnalysis', 'Time Analysis', 'ការវិភាគពេលវេលា');
  ensure('earnings.growthInsights', 'Growth Insights', 'ការយល់ដឹងអំពីកំណើន');
  ensure('earnings.avgBookingDuration', 'Avg Booking Duration', 'រយៈពេលមធ្យមក្នុងមួយកក់');
  ensure('earnings.newCustomers', 'New Customers', 'អតិថិជនថ្មី');
  ensure('earnings.revenueTrend', 'Revenue Trend', 'និន្នាការប្រាក់ចំណូល');
  ensure('earnings.increasing', 'Increasing', 'កើនឡើង');
  ensure('earnings.decreasing', 'Decreasing', 'ថយចុះ');
  ensure('earnings.exportReport', 'Export Report', 'នាំចេញរបាយការណ៍');
  ensure('earnings.exporting', 'Exporting...', 'កំពុងនាំចេញ...');
  ensure('earnings.errorTitle', 'Error Loading Data', 'កំហុសក្នុងការផ្ទុកទិន្នន័យ');
  ensure('earnings.thisMonthShort', 'this month', 'ខែនេះ');
  ensure('earnings.duration.minutes', 'min', 'នាទី');
  ensure('earnings.timeFormat.afternoon', '2-5 PM', '២-៥ រសៀល');
  ensure('earnings.completed', 'Completed', 'បានបញ្ចប់');
  ensure('earnings.processing', 'Processing', 'កំពុងដំណើរការ');

  // Month translations
  ensure('month.january', 'Jan', 'មករា');
  ensure('month.february', 'Feb', 'កុម្ភៈ');
  ensure('month.march', 'Mar', 'មីនា');
  ensure('month.april', 'Apr', 'មេសា');
  ensure('month.may', 'May', 'ឧសភា');
  ensure('month.june', 'Jun', 'មិថុនា');
  ensure('month.july', 'Jul', 'កក្កដា');
  ensure('month.august', 'Aug', 'សីហា');
  ensure('month.september', 'Sep', 'កញ្ញា');
  ensure('month.october', 'Oct', 'តុលា');
  ensure('month.november', 'Nov', 'វិច្ឆិកា');
  ensure('month.december', 'Dec', 'ធ្នូ');

  return map;
};

const translations = createTranslations();

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return stored === 'kh' ? 'kh' : 'en';
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) {
        return key;
      }
      return entry[language] || entry.en || key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage: handleSetLanguage,
      t,
    }),
    [language, handleSetLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
