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
    // Always set translations when provided to ensure Khmer translations are applied
    // Bug fix: Previous condition prevented Khmer translations from being set
    // if the English value matched what was already in the map
    map[key] = { en, kh: kh ?? en };
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
  ensure('settings.title', 'Settings', 'ការកំណត់');
  ensure('settings.subtitle', 'Manage your account settings and preferences', 'គ្រប់គ្រងការកំណត់ និងចំណង់ចំណូលចិត្ត');
  ensure('settings.profile', 'Profile', 'ប្រវត្តិរូប');
  ensure('settings.profileDescription', 'Manage your profile photo and personal information', 'គ្រប់គ្រងរូបថត និងព័ត៌មានផ្ទាល់ខ្លួន');
  ensure('settings.upload.uploading', 'Uploading...', 'កំពុងផ្ទុក...');
  ensure('settings.upload.changePhoto', 'Change Photo', 'ប្តូររូបថត');
  ensure('settings.account', 'Account', 'គណនី');
  ensure('settings.accountDescription', 'Manage your account settings', 'គ្រប់គ្រងការកំណត់គណនី');
  ensure('settings.autoAcceptBookings', 'Auto-accept bookings', 'ទទួលការកក់ដោយស្វ័យប្រវត្តិ');
  ensure('settings.autoAcceptBookingsDesc', 'Automatically accept new bookings', 'ទទួលការកក់ថ្មីដោយស្វ័យប្រវត្តិ');
  ensure('settings.allowInstantBookings', 'Allow instant bookings', 'អនុញ្ញាតការកក់ភ្លាមៗ');
  ensure('settings.allowInstantBookingsDesc', 'Let customers book instantly', 'អនុញ្ញាតឱ្យអតិថិជនកក់ភ្លាមៗ');
  ensure('settings.requireVerification', 'Require verification', 'ទាមទារការផ្ទៀងផ្ទាត់');
  ensure('settings.requireVerificationDesc', 'Require verified customers to book', 'ទាមទារអតិថិជនដែលបានផ្ទៀងផ្ទាត់មុនការកក់');
  ensure('settings.showProfileInSearch', 'Show profile in search', 'បង្ហាញប្រវត្តិរូបក្នុងការស្វែងរក');
  ensure('settings.showProfileInSearchDesc', 'Allow your profile to appear in search results', 'អនុញ្ញាតឱ្យប្រវត្តិរូបបង្ហាញក្នុងលទ្ធផលស្វែងរក');
  ensure('settings.notifications', 'Notifications', 'ការជូនដំណឹង');
  ensure('settings.notificationsDescription', 'Control how you receive updates', 'គ្រប់គ្រងរបៀបទទួលការជូនដំណឹង');
  ensure('settings.emailNotifications', 'Email notifications', 'ការជូនដំណឹងតាមអ៊ីមែល');
  ensure('settings.emailNotificationsDesc', 'Receive updates via email', 'ទទួលការជូនដំណឹងតាមអ៊ីមែល');
  ensure('settings.smsNotifications', 'SMS notifications', 'ការជូនដំណឹងតាម SMS');
  ensure('settings.smsNotificationsDesc', 'Receive updates via SMS', 'ទទួលការជូនដំណឹងតាម SMS');
  ensure('settings.pushNotifications', 'Push notifications', 'ការជូនដំណឹង Push');
  ensure('settings.pushNotificationsDesc', 'Receive push notifications', 'ទទួលការជូនដំណឹង Push');
  ensure('settings.newBookingAlert', 'New booking alerts', 'ការជូនដំណឹងការកក់ថ្មី');
  ensure('settings.newBookingAlertDesc', 'Get notified about new bookings', 'ទទួលបានការជូនដំណឹងអំពីការកក់ថ្មី');
  ensure('settings.bookingReminders', 'Booking reminders', 'ការរំលឹកការកក់');
  ensure('settings.bookingRemindersDesc', 'Send reminders before appointments', 'ផ្ញើការរំលឹកមុនពេលកក់');
  ensure('settings.privacy', 'Privacy', 'ភាពឯកជន');
  ensure('settings.privacyDescription', 'Manage your privacy preferences', 'គ្រប់គ្រងចំណូលចិត្តភាពឯកជន');
  ensure('settings.showPhoneNumber', 'Show phone number', 'បង្ហាញលេខទូរស័ព្ទ');
  ensure('settings.showPhoneNumberDesc', 'Display your phone number on your profile', 'បង្ហាញលេខទូរស័ព្ទនៅក្នុងប្រវត្តិរូប');
  ensure('settings.showEmail', 'Show email address', 'បង្ហាញអ៊ីមែល');
  ensure('settings.showEmailDesc', 'Display your email on your profile', 'បង្ហាញអ៊ីមែលនៅក្នុងប្រវត្តិរូប');
  ensure('settings.allowDirectMessages', 'Allow direct messages', 'អនុញ្ញាតសារផ្ទាល់');
  ensure('settings.allowDirectMessagesDesc', 'Let customers message you directly', 'អនុញ្ញាតឱ្យអតិថិជនផ្ញើសារផ្ទាល់');
  ensure('settings.dataProcessingConsent', 'Data processing consent', 'យល់ព្រមចំពោះការប្រើទិន្នន័យ');
  ensure('settings.dataProcessingConsentDesc', 'Allow data processing for recommendations', 'អនុញ្ញាតឱ្យប្រើទិន្នន័យសម្រាប់ការណែនាំ');
  ensure('settings.business', 'Business', 'អាជីវកម្ម');
  ensure('settings.businessDescription', 'Manage business preferences', 'គ្រប់គ្រងការកំណត់អាជីវកម្ម');
  ensure('settings.acceptOnlinePayments', 'Accept online payments', 'ទទួលការទូទាត់តាមអ៊ីនធឺណិត');
  ensure('settings.acceptOnlinePaymentsDesc', 'Allow customers to pay online', 'អនុញ្ញាតឱ្យអតិថិជនទូទាត់តាមអ៊ីនធឺណិត');
  ensure('settings.requireDeposit', 'Require deposit', 'ទាមទារប្រាក់កក់');
  ensure('settings.requireDepositDesc', 'Require a deposit for bookings', 'ទាមទារប្រាក់កក់សម្រាប់ការកក់');
  ensure('settings.cancellationWindow', 'Cancellation window', 'រយៈពេលបោះបង់');
  ensure('settings.hours2', '2 hours', '2 ម៉ោង');
  ensure('settings.hours6', '6 hours', '6 ម៉ោង');
  ensure('settings.hours12', '12 hours', '12 ម៉ោង');
  ensure('settings.hours24', '24 hours', '24 ម៉ោង');
  ensure('settings.hours48', '48 hours', '48 ម៉ោង');
  ensure('settings.cancellationWindowDesc', 'How long before an appointment customers can cancel', 'ចំនួនម៉ោងមុនពេលអតិថិជនអាចបោះបង់');
  ensure('settings.payment.removed', 'Payment method removed', 'បានលុបវិធីសាស្រ្តបង់ប្រាក់');
  ensure('settings.payment.removeError', 'Failed to remove payment method', 'មិនអាចលុបវិធីសាស្រ្តបង់ប្រាក់បានទេ');
  ensure('settings.payment.added', 'Payment method added', 'បានបន្ថែមវិធីសាស្រ្តបង់ប្រាក់');
  ensure('settings.payment.addError', 'Failed to add payment method', 'មិនអាចបន្ថែមវិធីសាស្រ្តបង់ប្រាក់បានទេ');
  ensure('settings.uploading', 'Uploading...', 'កំពុងផ្ទុក...');

  // Auth - Registration Account Types
  ensure('auth.register.individualSpecialist', 'Individual Specialist', 'អ្នកជំនាញបុគ្គល');
  ensure('auth.register.individualSpecialistDesc', 'I offer services independently', 'ខ្ញុំផ្តល់សេវាកម្មដោយឯករាជ្យ');
  ensure('auth.register.businessAccount', 'Business Account', 'គណនីអាជីវកម្ម');
  ensure('auth.register.businessAccountDesc', 'Clinic, salon, spa with multiple staff', 'គ្លីនិក សាឡុនសម្រស់ ស្ប៉ាជាមួយបុគ្គលិកច្រើន');
  ensure('auth.google.redirectLabel', 'Continue with Google (full page)', 'បន្តជាមួយ Google (ទំព័រពេញ)');
  ensure('auth.google.redirectHint', 'If popups are blocked, use the full page sign-in.', 'បើ popups ត្រូវបានរារាំង សូមប្រើការចូលជាមួយទំព័រពេញ។');
  ensure('auth.google.redirectLoading', 'Redirecting...', 'កំពុងបញ្ជូនបន្ត...');
  ensure('auth.logout', 'Log out', 'ចាកចេញ');

  // Customer navigation
  ensure('customer.nav.dashboard', 'Dashboard', 'ផ្ទាំងគ្រប់គ្រង');
  ensure('customer.nav.searchServices', 'Search Services', 'ស្វែងរកសេវាកម្ម');
  ensure('customer.nav.bookings', 'Bookings', 'ការកក់');
  ensure('customer.nav.favorites', 'Favorites', 'ចំណូលចិត្ត');
  ensure('customer.nav.reviews', 'Reviews', 'ការវាយតម្លៃ');
  ensure('customer.nav.messages', 'Messages', 'សារ');
  ensure('customer.nav.payments', 'Payments', 'ការទូទាត់');
  ensure('customer.nav.loyalty', 'Loyalty Points', 'ពិន្ទុភាពស្មោះត្រង់');
  ensure('customer.nav.referrals', 'Referrals', 'ការណែនាំ');
  ensure('customer.nav.profile', 'Profile', 'គណនី');
  ensure('customer.nav.settings', 'Settings', 'ការកំណត់');
  ensure('customer.customerLabel', 'Customer', 'អតិថិជន');
  ensure('customer.online', 'Online', 'អនឡាញ');

  // Profile + settings (Khmer overrides)
  ensure('profile.passwordSecurity', 'Password & Security', 'សុវត្ថិភាពពាក្យសម្ងាត់');
  ensure('profile.password', 'Password', 'ពាក្យសម្ងាត់');
  ensure('profile.lastChanged', 'Last changed', 'បានផ្លាស់ប្តូរចុងក្រោយ');
  ensure('profile.passwordRequirements', 'Password requirements', 'លក្ខខណ្ឌពាក្យសម្ងាត់');
  ensure('profile.passwordReq.length', 'At least 8 characters long', 'យ៉ាងហោចណាស់ 8 តួអក្សរ');
  ensure('profile.passwordReq.uppercase', 'One uppercase letter (A-Z)', 'អក្សរធំ 1 (A-Z)');
  ensure('profile.passwordReq.lowercase', 'One lowercase letter (a-z)', 'អក្សរតូច 1 (a-z)');
  ensure('profile.passwordReq.number', 'One number (0-9)', 'លេខ 1 (0-9)');
  ensure('profile.passwordReq.symbol', 'One symbol (!@#$%^&*)', 'និមិត្តសញ្ញា 1 (!@#$%^&*)');
  ensure('profile.passwordReq.english', 'English characters only', 'តែអក្សរអង់គ្លេស');
  ensure('profile.memberSince', 'Member since', 'សមាជិកតាំងពី');
  ensure('profile.addAddress', 'Add Address', 'បន្ថែមអាសយដ្ឋាន');
  ensure('profile.noAddressesYet', 'No addresses yet', 'មិនទាន់មានអាសយដ្ឋាន');
  ensure('profile.addYourFirstAddress', 'Add your first address', 'បន្ថែមអាសយដ្ឋានដំបូង');
  ensure('profile.default', 'Default', 'លំនាំដើម');
  ensure('profile.edit', 'Edit', 'កែសម្រួល');
  ensure('profile.remove', 'Remove', 'លុប');
  ensure('common.never', 'Never', 'មិនដែល');
  ensure('common.online', 'Online', 'អនឡាញ');
  ensure('actions.preview', 'Preview', 'មើលជាមុន');
  ensure('profile.unsavedChanges', 'Unsaved changes', 'មានការផ្លាស់ប្តូរមិនបានរក្សាទុក');
  ensure('common.loading', 'Loading...', 'កំពុងផ្ទុក...');

  // Auth - set password for Google users
  ensure('auth.setPassword.title', 'Set up password for your account', 'កំណត់ពាក្យសម្ងាត់សម្រាប់គណនី');
  ensure('auth.setPassword.description', 'You signed up with Google. Set a password to enable password reset and additional security options.', 'អ្នកបានចុះឈ្មោះដោយ Google។ សូមកំណត់ពាក្យសម្ងាត់ ដើម្បីអាចស្ដារពាក្យសម្ងាត់ និងជម្រើសសុវត្ថិភាពផ្សេងៗ។');
  ensure('auth.setPassword.action', 'Set Password', 'កំណត់ពាក្យសម្ងាត់');

  // Specialist profile helpers
  ensure('specialist.profession', 'Profession *', 'មុខរបរ *');
  ensure('specialist.professionNotSpecified', 'Profession not specified', 'មិនបានបញ្ជាក់មុខរបរ');
  ensure('specialist.verified', 'Verified', 'បានផ្ទៀងផ្ទាត់');
  ensure('professionForm.selectProfession', 'Select a profession', 'ជ្រើសរើសមុខរបរ');
  ensure('professionForm.searchProfessions', 'Search professions', 'ស្វែងរកមុខរបរ');
  ensure('professionForm.addCustomProfession', '+ Add custom profession', '+ បន្ថែមមុខរបរ​ផ្ទាល់ខ្លួន');
  ensure('professionForm.enterCustomProfession', 'Enter custom profession', 'បញ្ចូលមុខរបរផ្ទាល់ខ្លួន');
  ensure('specialtyForm.searchSpecialties', 'Search specialties', 'ស្វែងរកជំនាញពិសេស');

  // Customer settings
  ensure('customer.settings.pushNotifications', 'Push Notifications', 'ការជូនដំណឹង Push');
  ensure('customer.settings.smsNotifications', 'SMS Notifications', 'ការជូនដំណឹង SMS');
  ensure('customer.settings.profileVisibility', 'Profile Visibility', 'ភាពមើលឃើញប្រវត្តិរូប');
  ensure('customer.settings.publicProfile', 'Public', 'សាធារណៈ');
  ensure('customer.settings.privateProfile', 'Private', 'ឯកជន');
  ensure('customer.settings.showEmailProfile', 'Show email in profile', 'បង្ហាញអ៊ីមែលនៅក្នុងប្រវត្តិរូប');
  ensure('customer.settings.showPhoneProfile', 'Show phone number in profile', 'បង្ហាញលេខទូរស័ព្ទនៅក្នុងប្រវត្តិរូប');
  ensure('customer.settings.allowReviews', 'Allow others to leave reviews', 'អនុញ្ញាតឱ្យអ្នកដទៃទុកការវាយតម្លៃ');
  ensure('customer.settings.dataProcessing', 'Allow data processing for recommendations', 'អនុញ្ញាតការប្រើទិន្នន័យសម្រាប់ការណែនាំ');
  ensure('customer.settings.languageLabel', 'Language', 'ភាសា');
  ensure('customer.settings.currencyLabel', 'Currency', 'រូបិយប័ណ្ណ');
  ensure('customer.settings.themeLabel', 'Theme', 'ប្រធានបទ');
  ensure('customer.settings.lightTheme', 'Light', 'ពន្លឺ');
  ensure('customer.settings.darkTheme', 'Dark', 'ងងឹត');
  ensure('customer.settings.systemTheme', 'System', 'ប្រព័ន្ធ');

  // Settings - profile image
  ensure('settings.profile.imageSelectError', 'Please select an image file', 'សូមជ្រើសរើសឯកសាររូបភាព');
  ensure('settings.profile.imageSizeError', 'File size must be less than 5MB', 'ទំហំឯកសារត្រូវតិចជាង 5MB');
  ensure('settings.profile.imageUploadError', 'Failed to upload image', 'មិនអាចផ្ទុករូបភាពបានទេ');
  ensure('settings.profile.imageRemoveError', 'Failed to remove image', 'មិនអាចលុបរូបភាពបានទេ');
  ensure('settings.profile.photoLabel', 'Profile Photo', 'រូបថតប្រវត្តិរូប');
  ensure('settings.profile.photoHint', 'Maximum size: 5MB. Supported formats: JPG, PNG, WebP', 'ទំហំអតិបរមា: 5MB។ ទ្រង់ទ្រាយដែលគាំទ្រ: JPG, PNG, WebP');
  ensure('settings.profile.photoUpdated', 'Photo updated successfully!', 'បានធ្វើបច្ចុប្បន្នភាពរូបថតដោយជោគជ័យ!');

  // Addresses
  ensure('addresses.addTitle', 'Add Address', 'បន្ថែមអាសយដ្ឋាន');
  ensure('addresses.pickOnMap', 'Pick on map', 'ជ្រើសរើសលើផែនទី');
  ensure('addresses.typeLabel', 'Type', 'ប្រភេទ');
  ensure('addresses.label', 'Label', 'ស្លាក');
  ensure('addresses.labelPlaceholder', 'e.g. Home, Work', 'ឧ. ផ្ទះ, ការងារ');
  ensure('addresses.street', 'Street Address', 'ផ្លូវ/អាសយដ្ឋាន');
  ensure('addresses.streetPlaceholder', 'Enter street address', 'បញ្ចូលផ្លូវ ឬអាសយដ្ឋាន');
  ensure('addresses.city', 'City', 'ទីក្រុង');
  ensure('addresses.cityPlaceholder', 'Enter city', 'បញ្ចូលទីក្រុង');
  ensure('addresses.postalCode', 'Postal Code', 'លេខប្រៃសណីយ៍');
  ensure('addresses.region', 'Region/State', 'ខេត្ត/តំបន់');
  ensure('addresses.regionPlaceholder', 'Enter region', 'បញ្ចូលខេត្ត/តំបន់');
  ensure('addresses.country', 'Country', 'ប្រទេស');
  ensure('addresses.country.ukraine', 'Ukraine', 'អ៊ុយក្រែន');
  ensure('addresses.country.poland', 'Poland', 'ប៉ូឡូញ');
  ensure('addresses.country.germany', 'Germany', 'អាល្លឺម៉ង់');
  ensure('addresses.addAction', 'Add Address', 'បន្ថែមអាសយដ្ឋាន');
  ensure('common.home', 'Home', 'ផ្ទះ');
  ensure('common.work', 'Work', 'ការងារ');
  ensure('common.other', 'Other', 'ផ្សេងទៀត');
  ensure('common.cancel', 'Cancel', 'បោះបង់');

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
    'notifications.markAllRead': 'Mark all as read',
    'notifications.noNotifications': 'No notifications yet',
    'notifications.noNotificationsDescription': 'When you receive updates, they will appear here.',
    'notifications.subtitle': 'Stay up to date with your activity',
    'notifications.title': 'Notifications',
    'notifications.unread': 'Unread',
    'notifications.viewAll': 'View all notifications',
    'notifications.today': 'Today',
    'notifications.yesterday': 'Yesterday',
    'notifications.thisWeek': 'This Week',
    'notifications.earlier': 'Earlier',
    'notifications.new': 'new',
    'notifications.markAll': 'Mark all',
    'notifications.view': 'View',
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
  ensure('dashboard.booking.status.pending', 'Pending', 'កំពុងរង់ចាំ');
  ensure('dashboard.booking.status.confirmed', 'Confirmed', 'បានបញ្ជាក់');
  ensure('dashboard.booking.status.completed', 'Completed', 'បានបញ្ចប់');
  ensure('dashboard.booking.status.cancelled', 'Cancelled', 'បានលុបចោល');
  ensure('dashboard.booking.status.inProgress', 'In Progress', 'កំពុងដំណើរការ');
  ensure('dashboard.booking.status.noShow', 'No Show', 'មិនបានមកដល់');
  ensure('dashboard.booking.status.PENDING', 'Pending', 'កំពុងរង់ចាំ');
  ensure('dashboard.booking.status.CONFIRMED', 'Confirmed', 'បានបញ្ជាក់');
  ensure('dashboard.booking.status.COMPLETED', 'Completed', 'បានបញ្ចប់');
  ensure('dashboard.booking.status.CANCELLED', 'Cancelled', 'បានលុបចោល');
  ensure('dashboard.booking.status.IN_PROGRESS', 'In Progress', 'កំពុងដំណើរការ');
  ensure('dashboard.booking.status.NO_SHOW', 'No Show', 'មិនបានមកដល់');
  ensure('bookings.subtitle', 'Manage all your bookings and appointments in one place', 'គ្រប់គ្រងការកក់ និងការណាត់ជួបរបស់អ្នកទាំងអស់នៅកន្លែងតែមួយ');
  ensure('bookings.myServices', 'My Services', 'សេវាកម្មរបស់ខ្ញុំ');
  ensure('bookings.myBookings', 'My Bookings', 'ការកក់របស់ខ្ញុំ');
  ensure('bookings.total', 'Total', 'សរុប');
  ensure('bookings.search', 'Search', 'ស្វែងរក');
  ensure('bookings.searchPlaceholder', 'Search by customer or service', 'ស្វែងរកតាមអតិថិជន ឬសេវាកម្ម');
  ensure('bookings.status', 'Status', 'ស្ថានភាព');
  ensure('bookings.allStatus', 'All Status', 'ស្ថានភាពទាំងអស់');
  ensure('bookings.dateRange', 'Date Range', 'ចន្លោះកាលបរិច្ឆេទ');
  ensure('bookings.allDates', 'All Dates', 'កាលបរិច្ឆេទទាំងអស់');
  ensure('bookings.today', 'Today', 'ថ្ងៃនេះ');
  ensure('bookings.thisWeek', 'This Week', 'សប្តាហ៍នេះ');
  ensure('bookings.thisMonth', 'This Month', 'ខែនេះ');
  ensure('bookings.sortBy', 'Sort by', 'តម្រៀបតាម');
  ensure('bookings.date', 'Date', 'កាលបរិច្ឆេទ');
  ensure('bookings.amount', 'Amount', 'ចំនួនទឹកប្រាក់');
  ensure('bookings.type', 'Type', 'ប្រភេទ');
  ensure('bookings.actions', 'Actions', 'សកម្មភាព');
  ensure('bookings.customer', 'Customer', 'អតិថិជន');
  ensure('bookings.specialist', 'Specialist', 'អ្នកជំនាញ');
  ensure('bookings.dateTime', 'Date & Time', 'កាលបរិច្ឆេទ និងម៉ោង');
  ensure('bookings.service', 'Service', 'សេវាកម្ម');
  ensure('bookings.online', 'Online', 'អនឡាញ');
  ensure('bookings.inPerson', 'In-person', 'មុខតទៅមុខ');
  ensure('bookings.view', 'View', 'មើល');
  ensure('bookings.confirm', 'Confirm', 'បញ្ជាក់');
  ensure('bookings.complete', 'Complete', 'បញ្ចប់');
  ensure('bookings.cancel', 'Cancel', 'បោះបង់');
  ensure('bookings.clear', 'Clear', 'សម្អាត');
  ensure('bookings.selected', 'selected', 'បានជ្រើសរើស');
  ensure('bookings.cancelBooking', 'Cancel Booking', 'បោះបង់ការកក់');
  ensure('bookings.confirmCancelTitle', 'Cancel booking?', 'បោះបង់ការកក់?');
  ensure('bookings.confirmCancel', 'Are you sure you want to cancel this booking?', 'តើអ្នកប្រាកដថាចង់បោះបង់ការកក់នេះ?');
  ensure('bookings.leaveReview', 'Leave Review', 'ទុកការវាយតម្លៃ');
  ensure('bookings.reviewShort', 'Review', 'វាយតម្លៃ');
  ensure('bookings.paymentConfirmation', 'Payment Confirmation', 'ការបញ្ជាក់ការទូទាត់');
  ensure('bookings.completeBooking', 'Complete Booking', 'បញ្ចប់ការកក់');
  ensure('bookings.hasCustomerPaid', 'Has the customer paid for this service?', 'អតិថិជនបានបង់ប្រាក់សម្រាប់សេវាកម្មនេះហើយឬនៅ?');
  ensure('bookings.yesPaymentReceived', 'Yes, Payment Received', 'បាទ/ចាស បានទទួលការទូទាត់');
  ensure('bookings.noNotPaidYet', 'No, Not Paid Yet', 'ទេ មិនទាន់បង់ប្រាក់');
  ensure('bookings.onlyCompleteIfPaid', 'Only complete the booking if payment has been received from the customer.', 'សូមបញ្ចប់ការកក់បានតែពេលទទួលការទូទាត់ពីអតិថិជនរួច។');
  ensure('bookings.contactInformation', 'Contact information', 'ព័ត៌មានទំនាក់ទំនង');
  ensure('bookings.contactInfoNote', 'Contact details are shared once the booking is confirmed.', 'ព័ត៌មានទំនាក់ទំនងនឹងបង្ហាញក្រោយពីការកក់បានបញ្ជាក់។');
  ensure('bookings.address', 'Address', 'អាសយដ្ឋាន');
  ensure('bookings.phone', 'Phone', 'ទូរស័ព្ទ');
  ensure('bookings.whatsapp', 'WhatsApp', 'WhatsApp');
  ensure('bookings.locationNotes', 'Location notes', 'កំណត់ចំណាំទីតាំង');
  ensure('bookings.parking', 'Parking', 'កន្លែងចតរថយន្ត');
  ensure('bookings.accessInstructions', 'Access instructions', 'ការណែនាំការចូល');
  ensure('bookings.noBookingsFound', 'No bookings found', 'រកមិនឃើញការកក់');
  ensure('bookings.noBookingsDescription', 'Try adjusting your filters or search', 'សូមសាកល្បងកែសម្រួលតម្រង ឬការស្វែងរក');
  ensure('bookings.previous', 'Previous', 'មុន');
  ensure('bookings.next', 'Next', 'បន្ទាប់');
  ensure('bookings.showing', 'Showing', 'កំពុងបង្ហាញ');
  ensure('bookings.to', 'to', 'ដល់');
  ensure('bookings.of', 'of', 'ពី');
  ensure('bookings.results', 'results', 'លទ្ធផល');
  ensure('bookings.completionNotes', 'Completion Notes (Optional)', 'កំណត់ចំណាំបញ្ចប់ (ស្រេចចិត្ត)');

  // Notification grouping translations
  ensure('notifications.today', 'Today', 'ថ្ងៃនេះ');
  ensure('notifications.yesterday', 'Yesterday', 'ម្សិលមិញ');
  ensure('notifications.thisWeek', 'This Week', 'សប្តាហ៍នេះ');
  ensure('notifications.earlier', 'Earlier', 'មុននេះ');
  ensure('notifications.new', 'new', 'ថ្មី');
  ensure('notifications.markAll', 'Mark all', 'សម្គាល់ទាំងអស់');
  ensure('notifications.view', 'View', 'មើល');
  ensure('bookings.completionNotesPlaceholder', 'Add any notes about the completed service...', 'បន្ថែមកំណត់ចំណាំអំពីសេវាកម្មដែលបានបញ្ចប់...');
  ensure('bookings.completeFailed', 'Failed to complete booking', 'មិនអាចបញ្ចប់ការកក់បានទេ');
  ensure('bookings.cancelFailed', 'Failed to cancel booking. Please try again.', 'មិនអាចបោះបង់ការកក់បានទេ។ សូមព្យាយាមម្តងទៀត។');
  ensure('bookings.viewMode.kanbanTitle', 'Kanban View', 'ទិដ្ឋភាពកានបាន');
  ensure('bookings.viewMode.kanban', 'Kanban', 'កានបាន');
  ensure('bookings.viewMode.listTitle', 'List View', 'ទិដ្ឋភាពបញ្ជី');
  ensure('bookings.viewMode.list', 'List', 'បញ្ជី');
  ensure('bookingDetails.title', 'Booking Details', 'ព័ត៌មានការកក់');
  ensure('bookingDetails.customerInfo', 'Customer Information', 'ព័ត៌មានអតិថិជន');
  ensure('bookingDetails.specialistInfo', 'Specialist Information', 'ព័ត៌មានអ្នកជំនាញ');
  ensure('bookingDetails.name', 'Name', 'ឈ្មោះ');
  ensure('bookingDetails.contact', 'Contact', 'ទំនាក់ទំនង');
  ensure('bookingDetails.contactNotAvailable', 'Contact not available', 'មិនមានព័ត៌មានទំនាក់ទំនង');
  ensure('bookingDetails.serviceInfo', 'Service Information', 'ព័ត៌មានសេវាកម្ម');
  ensure('bookingDetails.duration', 'Duration', 'រយៈពេល');
  ensure('bookingDetails.appointmentDetails', 'Appointment Details', 'ព័ត៌មានការណាត់ជួប');
  ensure('bookingDetails.time', 'Time', 'ម៉ោង');
  ensure('bookingDetails.meetingLink', 'Meeting link', 'តំណប្រជុំ');
  ensure('bookingDetails.joinMeeting', 'Join meeting', 'ចូលប្រជុំ');
  ensure('bookingDetails.notes', 'Notes', 'កំណត់ចំណាំ');
  ensure('bookingDetails.statusManagement', 'Status Management', 'ការគ្រប់គ្រងស្ថានភាព');
  ensure('bookingDetails.updateStatus', 'Update Status', 'ធ្វើបច្ចុប្បន្នភាពស្ថានភាព');
  ensure('bookingDetails.sendMessage', 'Send Message', 'ផ្ញើសារ');
  ensure('bookingDetails.messagePlaceholder', 'Type your message...', 'វាយសាររបស់អ្នក...');
  ensure('bookingDetails.sendMessageButton', 'Send', 'ផ្ញើ');
  ensure('bookingDetails.template', 'Template', 'ពុម្ព');
  ensure('bookingDetails.customerActions', 'Customer Actions', 'សកម្មភាពអតិថិជន');
  ensure('messages.participantNotFound', 'Participant not found for this booking', 'រកមិនឃើញអ្នកចូលរួមសម្រាប់ការកក់នេះ');
  ensure('messages.messageSent', 'Message sent', 'បានផ្ញើសារ');
  ensure('messages.conversationNotFound', 'Unable to start or locate conversation for this booking', 'មិនអាចចាប់ផ្តើម ឬរកឃើញការសន្ទនាសម្រាប់ការកក់នេះបានទេ');
  ensure('messages.sendFailed', 'Failed to send message', 'មិនអាចផ្ញើសារ​បានទេ');
  ensure('labels.id', 'ID', 'លេខសម្គាល់');
  ensure('labels.customer', 'Customer', 'អតិថិជន');
  ensure('labels.amount', 'Amount', 'ចំនួនទឹកប្រាក់');
  ensure('labels.unknownCustomer', 'Unknown Customer', 'អតិថិជនមិនស្គាល់');
  ensure('labels.unknownSpecialist', 'Unknown Specialist', 'អ្នកជំនាញមិនស្គាល់');
  ensure('labels.unknownService', 'Unknown Service', 'សេវាកម្មមិនស្គាល់');
  ensure('actions.cancel', 'Cancel', 'បោះបង់');
  ensure('actions.back', 'Back', 'ត្រឡប់ក្រោយ');
  ensure('navigation.back', 'Back', 'ត្រឡប់ក្រោយ');
  ensure('customer.bookings.leaveReview', 'Leave Review', 'ទុកការវាយតម្លៃ');
  ensure('customer.bookings.bookAgain', 'Book Again', 'កក់ម្ដងទៀត');
  ensure('reviews.submissionFailed', 'Review submission failed', 'មិនអាចដាក់ការវាយតម្លៃបានទេ');
  ensure('reviews.submissionFailedTryAgain', 'Failed to submit review. Please try again.', 'មិនអាចដាក់ការវាយតម្លៃបានទេ។ សូមព្យាយាមម្តងទៀត។');
  ensure('common.error', 'Error', 'កំហុស');
  ensure('common.retry', 'Retry', 'ព្យាយាមម្តងទៀត');
  ensure('time.minutes', 'min', 'នាទី');
  // Payments translations
  ensure('payments.title', 'Payment Methods', 'វិធីសាស្រ្តបង់ប្រាក់');
  ensure('payments.subtitle', 'Manage your payment methods and transaction history', 'គ្រប់គ្រងវិធីសាស្រ្តបង់ប្រាក់ និងប្រវត្តិប្រតិបត្តិការ');
  ensure('payments.yourMethods', 'Your Payment Methods', 'វិធីសាស្រ្តបង់ប្រាក់របស់អ្នក');
  ensure('payments.emptyTitle', 'No payment methods added yet', 'មិនទាន់មានវិធីសាស្រ្តបង់ប្រាក់ទេ');
  ensure('payments.emptyDescription', 'Add a payment method for quick and convenient service bookings. Your data will be securely protected.', 'បន្ថែមវិធីសាស្រ្តបង់ប្រាក់ ដើម្បីកក់សេវាកម្មបានរហ័ស និងងាយស្រួល។ ទិន្នន័យរបស់អ្នកត្រូវបានការពារយ៉ាងសុវត្ថិភាព។');
  ensure('payments.emptyCta', 'Add Your First Payment Method', 'បន្ថែមវិធីសាស្រ្តបង់ប្រាក់ដំបូង');
  ensure('payments.accountSuffix', 'Account ••••', 'គណនី ••••');
  ensure('payments.default', 'Default', 'លំនាំដើម');
  ensure('payments.active', 'Active', 'សកម្ម');
  ensure('payments.makeDefault', 'Make Default', 'កំណត់ជាលំនាំដើម');
  ensure('payments.securityTitle', 'Your Data Security', 'សុវត្ថិភាពទិន្នន័យរបស់អ្នក');
  ensure('payments.securityDescription', 'We use state-of-the-art encryption methods to protect your payment data. Card numbers are stored encrypted and comply with PCI DSS standards.', 'យើងប្រើវិធីសាស្រ្តអ៊ិនគ្រីបកម្រិតខ្ពស់ ដើម្បីការពារទិន្នន័យបង់ប្រាក់របស់អ្នក។ លេខកាតត្រូវបានរក្សាទុកជាអ៊ិនគ្រីប និងអនុលោមតាមស្តង់ដារ PCI DSS។');
  ensure('payments.paymentType', 'Payment Type', 'ប្រភេទការទូទាត់');
  ensure('payments.bankCard', 'Bank Card', 'កាតធនាគារ');
  ensure('payments.abaBank', 'ABA Bank', 'ធនាគារ ABA');
  ensure('payments.khqr', 'KHQR', 'KHQR');
  ensure('payments.cardName', 'Card Name', 'ឈ្មោះកាត');
  ensure('payments.cardNamePlaceholder', 'Visa •••• 4242', 'Visa •••• 4242');
  ensure('payments.cardNumber', 'Card Number', 'លេខកាត');
  ensure('payments.cardNumberPlaceholder', '1234 5678 9012 3456', '1234 5678 9012 3456');
  ensure('payments.expiryMonth', 'Month', 'ខែ');
  ensure('payments.expiryYear', 'Year', 'ឆ្នាំ');
  ensure('payments.accountName', 'Account Name', 'ឈ្មោះគណនី');
  ensure('payments.accountNamePlaceholder', 'Account holder name', 'ឈ្មោះម្ចាស់គណនី');
  ensure('payments.accountNumber', 'Account Number', 'លេខគណនី');
  ensure('payments.accountNumberPlaceholder', 'e.g. 00123456789', 'ឧ. 00123456789');
  ensure('payments.qrImage', 'QR Image', 'រូបភាព QR');
  ensure('payments.uploadQr', 'Upload QR', 'បញ្ចូល QR');
  ensure('payments.qrPreviewAlt', 'QR preview', 'ពិនិត្យ QR');
  ensure('payments.cancel', 'Cancel', 'បោះបង់');
  ensure('payment.addPaymentMethod', 'Add Payment Method', 'បន្ថែមវិធីសាស្រ្តបង់ប្រាក់');
  ensure('booking.bankTransferTitle', 'ABA / KHQR Bank Transfer', 'ផ្ទេរប្រាក់ ABA / KHQR');
  ensure('booking.bankTransferMessage', 'Use the details below to pay the deposit or remaining balance.', 'សូមប្រើព័ត៌មានខាងក្រោម ដើម្បីបង់ប្រាក់កក់ ឬប្រាក់នៅសល់។');
  ensure('booking.bankTransferDepositDue', 'Deposit due now', 'ប្រាក់កក់ត្រូវបង់ឥឡូវនេះ');
  ensure('booking.bankTransferRemaining', 'Remaining after service', 'ប្រាក់នៅសល់បន្ទាប់ពីសេវាកម្ម');
  ensure('booking.bankTransferTotalDue', 'Amount due after service', 'ប្រាក់ត្រូវបង់បន្ទាប់ពីសេវាកម្ម');
  ensure('booking.bankTransferAccountName', 'Account name', 'ឈ្មោះគណនី');
  ensure('booking.bankTransferAccountNumber', 'Account number', 'លេខគណនី');
  ensure('booking.bankTransferNoAccounts', 'This specialist has not added ABA/KHQR details yet. Please choose another payment method or contact the specialist.', 'អ្នកជំនាញមិនទាន់បន្ថែមព័ត៌មាន ABA/KHQR ទេ។ សូមជ្រើសរើសវិធីទូទាត់ផ្សេង ឬទាក់ទងអ្នកជំនាញ។');
  ensure('booking.bankTransferReference', 'Include your name in the transfer note.', 'សូមបញ្ចូលឈ្មោះរបស់អ្នកក្នុងកំណត់សម្គាល់ការផ្ទេរប្រាក់។');
  ensure('booking.bankTransferContinue', 'Continue to confirmation', 'បន្តទៅការបញ្ជាក់');

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
  ensure('dashboard.nav.finances', 'Finances', 'ហិរញ្ញវត្ថុ');

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
