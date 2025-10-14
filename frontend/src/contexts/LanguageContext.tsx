import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import baseEnTranslations from './translations-en.json';

type Language = 'en' | 'kh';

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
      .replace(/MiyZap[iy]s/gi, 'Huddle')
      .replace(/Miyzapis/gi, 'Huddle')
      .replace(/VicheaPro/gi, 'Huddle');

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
  ensure('brand.name', 'Huddle');
  ensure('brand.tagline', 'Professional Services Marketplace');

  // Hero
  ensure('hero.title', 'Find Expert Services in Cambodia');
  ensure('hero.title1', 'Book trusted Cambodian specialists');
  ensure('hero.title2', 'Elevate every appointment with Huddle');
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
  ensure('currency.usd', 'US Dollar');
  ensure('currency.khr', 'Khmer Riel');

  // Theme
  ensure('settings.theme.light', 'Light');
  ensure('settings.theme.dark', 'Dark');
  ensure('settings.theme.system', 'System');

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
