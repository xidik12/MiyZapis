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
  ensure('finances.addExpense', 'Add Expense', 'បន្ថែមការចំណាយ');
  ensure('finances.totalExpenses', 'Total Expenses', 'ការចំណាយសរុប');
  ensure('finances.totalIncome', 'Total Income', 'ប្រាក់ចំណូលសរុប');
  ensure('finances.netProfit', 'Net Profit', 'ប្រាក់ចំណេញសុទ្ធ');
  ensure('finances.byCategory', 'Expenses by Category', 'ការចំណាយតាមប្រភេទ');
  ensure('finances.recentExpenses', 'Recent Expenses', 'ការចំណាយថ្មីៗ');
  ensure('finances.category', 'Category', 'ប្រភេទ');
  ensure('finances.amount', 'Amount', 'ចំនួនទឹកប្រាក់');
  ensure('finances.description', 'Description', 'ការពិពណ៌នា');
  ensure('finances.date', 'Date', 'កាលបរិច្ឆេទ');
  ensure('nav.finances', 'Finances', 'ហិរញ្ញវត្ថុ');

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
