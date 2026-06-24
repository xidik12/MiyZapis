import React, { useState, useEffect} from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, updateUserProfile } from '../../store/slices/authSlice';
import { PaymentMethodRecord as PaymentMethod } from '../../types';
import { PaymentMethodsService } from '../../services/paymentMethods';
import { fileUploadService } from '../../services/fileUpload.service';
import { userService } from '../../services/user.service';
import { toast } from 'react-toastify';
import { Avatar } from '../../components/ui/Avatar';
import { InlineLoader } from '@/components/ui';
import { LocationPicker } from '../../components/LocationPicker';
import SetPasswordModal from '../../components/auth/SetPasswordModal';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal';
import TelegramLinkWidget from '../../components/auth/TelegramLinkWidget';
import { UserCircleIcon, BellIcon, ShieldCheckIcon, GlobeIcon as GlobeAltIcon, CreditCardIcon, MapPinIcon, DeviceMobileIcon as TrashIcon, PlusIcon, CameraIcon, LinkIcon } from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';
import PhoneVerifyButton from '@/components/common/PhoneVerifyButton';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import ConfirmModal from '@/components/ui/ConfirmModal';


interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  street: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

const CustomerSettings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  
  // Get actual user data from Redux store
  const currentUser = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  // Normalize an ISO/Date string to the yyyy-MM-dd a date input expects.
  const toDateInput = (value?: string | null): string => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  };

  const [user, setUser] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phoneNumber || '',
    dateOfBirth: toDateInput((currentUser as any)?.dateOfBirth),
    avatar: currentUser?.avatar || '',
  });

  // Profile image upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Web Push subscription management
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isDenied: isPushDenied,
    isLoading: isPushLoading,
    toggle: togglePushSubscription,
  } = usePushNotifications();

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailBookingConfirmation: true,
    emailReminders: true,
    emailPromotions: false,
    pushBookingConfirmation: true,
    pushReminders: true,
    pushPromotions: false,
    smsReminders: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'private',
    showEmail: false,
    showPhone: false,
    allowReviews: true,
    dataProcessing: true,
  });

  // Payment methods - start with empty array for new users
  const [_paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  // Addresses - persisted per-user in localStorage until backend endpoint exists
  const [addresses, setAddresses] = useState<Address[]>([]);
  const addressesStorageKey = currentUser?.id ? `mz.addresses.${currentUser.id}` : null;

  // Load saved addresses on mount/user change
  useEffect(() => {
    if (!addressesStorageKey) return;
    
    try {
      const raw = localStorage.getItem(addressesStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setAddresses(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved addresses:', e);
    }
  }, [addressesStorageKey]);

  // Persist addresses to localStorage on change
  useEffect(() => {
    if (!addressesStorageKey) return;
    
    try {
      localStorage.setItem(addressesStorageKey, JSON.stringify(addresses));
    } catch (e) {
      console.warn('Failed to save addresses:', e);
    }
  }, [addresses, addressesStorageKey]);

  const [activeSection, setActiveSection] = useState('account');
  const [_showChangePassword, _setShowChangePassword] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isUnlinkingTelegram, setIsUnlinkingTelegram] = useState(false);
  const [showUnlinkTelegramModal, setShowUnlinkTelegramModal] = useState(false);
  const [_showAddPaymentModal, _setShowAddPaymentModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressLocation, setNewAddressLocation] = useState<{ address: string; city: string; region: string; country: string; postalCode?: string; latitude?: number; longitude?: number; }>({ address: '', city: '', region: '', country: '' });

  // Load payment methods when component mounts
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setLoading(true);
        const methods = await PaymentMethodsService.getPaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        // Silent error for Settings page - user can still add new methods
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadPaymentMethods();
    }
  }, [currentUser]);

  // Sync user state when currentUser changes (e.g., after login or refresh)
  useEffect(() => {
    if (currentUser) {
      setUser({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || '',
        dateOfBirth: toDateInput((currentUser as any).dateOfBirth),
        avatar: currentUser.avatar || '',
      });
    }
  }, [currentUser]);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyChange = (key: keyof typeof privacy, value: unknown) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRemoveAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const handleAddAddress = () => {
    setShowAddAddressModal(true);
  };

  const handleSaveAddress = (addressData: Record<string, unknown>) => {
    // TODO: Integrate with address API when backend is ready
    const newAddress: Address = {
      id: Date.now().toString(),
      type: addressData.type as 'home' | 'work' | 'other',
      label: String(addressData.label || ''),
      street: String(addressData.street || newAddressLocation.address || ''),
      city: String(addressData.city || newAddressLocation.city || ''),
      region: String(addressData.region || newAddressLocation.region || ''),
      postalCode: String(addressData.postalCode || newAddressLocation.postalCode || ''),
      country: String(addressData.country || newAddressLocation.country || ''),
      isDefault: addresses.length === 0, // First address becomes default
      latitude: newAddressLocation.latitude,
      longitude: newAddressLocation.longitude,
    };
    setAddresses(prev => [...prev, newAddress]);
    setShowAddAddressModal(false);
    setNewAddressLocation({ address: '', city: '', region: '', country: '' });
  };

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setUploadError(
        language === 'uk' ? 'Будь ласка, оберіть файл зображення' :
        language === 'ru' ? 'Пожалуйста, выберите файл изображения' :
        'Please select an image file'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError(
        language === 'uk' ? 'Розмір файлу повинен бути менше 5МБ' :
        language === 'ru' ? 'Размер файла должен быть меньше 5МБ' :
        'File size must be less than 5MB'
      );
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadError('');
      setUploadSuccess(false);
      
      // Upload the image
      const result = await fileUploadService.uploadAvatar(file);
      
      // Update user profile with new avatar URL
      await userService.updateProfile({ avatar: result.url });
      
      // Update Redux store with only the avatar field
      dispatch(updateUserProfile({ avatar: result.url }));
      
      // Update local state
      setUser(prev => ({ ...prev, avatar: result.url }));
      setUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      setUploadError(
        (error as any).message ||
        (language === 'uk' ? 'Помилка завантаження зображення' :
         language === 'ru' ? 'Ошибка загрузки изображения' :
         'Failed to upload image')
      );
    } finally {
      setIsUploadingImage(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Handle profile image removal
  const handleImageRemove = async () => {
    try {
      setIsUploadingImage(true);
      setUploadError('');
      
      // Update user profile to remove avatar
      await userService.updateProfile({ avatar: undefined });

      // Update Redux store with only the avatar field
      dispatch(updateUserProfile({ avatar: undefined }));
      
      // Update local state
      setUser(prev => ({ ...prev, avatar: '' }));
      setUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error: unknown) {
      console.error('Error removing avatar:', error);
      setUploadError(
        (error as any).message ||
        (language === 'uk' ? 'Помилка видалення зображення' :
         language === 'ru' ? 'Ошибка удаления изображения' :
         'Failed to remove image')
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle account settings save
  const handleSaveAccountSettings = async () => {
    try {
      setLoading(true);

      // Update user profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await userService.updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phone,
        dateOfBirth: user.dateOfBirth || null,
        language: language,
        currency: currency,
      } as any);

      // Update Redux store
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatch(updateUserProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phone,
        dateOfBirth: user.dateOfBirth || null,
        language: language,
        currency: currency,
      } as any));

      // Show success message
      toast.success(
        language === 'uk' ? 'Налаштування успішно збережено' :
        language === 'ru' ? 'Настройки успешно сохранены' :
        'Settings saved successfully'
      );

    } catch (error: unknown) {
      console.error('Error saving account settings:', error);
      toast.error(
        (error as any).message ||
        (language === 'uk' ? 'Помилка збереження налаштувань' :
         language === 'ru' ? 'Ошибка сохранения настроек' :
         'Failed to save settings')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkTelegram = () => {
    setShowUnlinkTelegramModal(true);
  };

  const confirmUnlinkTelegram = async () => {
    try {
      setIsUnlinkingTelegram(true);
      await userService.unlinkTelegram();
      dispatch(updateUserProfile({ telegramId: undefined } as any));
      toast.success(
        language === 'uk' ? 'Telegram відключено' :
        language === 'ru' ? 'Telegram отключен' :
        'Telegram unlinked'
      );
    } catch (error: unknown) {
      toast.error((error as any).message || 'Failed to unlink Telegram');
    } finally {
      setIsUnlinkingTelegram(false);
      setShowUnlinkTelegramModal(false);
    }
  };

  const HELP = {
    en: {
      overview: 'All your account preferences in one place. Use the sidebar to jump between sections.\n\n• Account — edit your name, email, phone, date of birth, profile photo, and preferred language/currency.\n• Password & Security — set or change your password. Google-login users can add a password here.\n• Connected Accounts — link or unlink Google and Telegram for quick sign-in and notifications.\n• Notifications — choose which updates you receive by email, push (browser), or SMS.\n• Privacy — control whether your profile is public or private, and whether specialists can leave reviews about you.\n• Language & Currency — switch the interface language (Ukrainian / English / Russian) and the currency shown throughout the app (₴ UAH / $ USD / € EUR). Also set light/dark/system theme here.\n• Payment Methods — redirects to the dedicated Payments page.\n• Addresses — save home, work, or other addresses (stored locally on this device).',
    },
    uk: {
      overview: 'Усі налаштування акаунту в одному місці. Використовуйте бічне меню для переходу між розділами.\n\n• Акаунт — ім\'я, email, телефон, дата народження, фото профілю, мова та валюта.\n• Пароль та безпека — встановіть або змініть пароль. Користувачі Google можуть додати пароль тут.\n• Підключені акаунти — прив\'язка або відключення Google та Telegram для швидкого входу та сповіщень.\n• Сповіщення — оберіть, які оновлення отримувати: email, push (браузер) або SMS.\n• Конфіденційність — публічний чи приватний профіль, дозвіл залишати відгуки про вас.\n• Мова та валюта — мова інтерфейсу (🇺🇦/🇺🇸/🇷🇺), валюта (₴/$/€), світла/темна/системна тема.\n• Способи оплати — перехід на окрему сторінку оплати.\n• Адреси — збереження домашньої, робочої та інших адрес (зберігаються локально на цьому пристрої).',
    },
    ru: {
      overview: 'Все настройки аккаунта в одном месте. Используйте боковое меню для перехода между разделами.\n\n• Аккаунт — имя, email, телефон, дата рождения, фото профиля, язык и валюта.\n• Пароль и безопасность — установите или измените пароль. Пользователи Google могут добавить пароль здесь.\n• Подключённые аккаунты — привязка или отключение Google и Telegram для быстрого входа и уведомлений.\n• Уведомления — выберите, какие обновления получать: email, push (браузер) или SMS.\n• Конфиденциальность — публичный или приватный профиль, разрешение оставлять отзывы о вас.\n• Язык и валюта — язык интерфейса (🇺🇦/🇺🇸/🇷🇺), валюта (₴/$/€), светлая/тёмная/системная тема.\n• Способы оплаты — переход на отдельную страницу оплаты.\n• Адреса — сохранение домашнего, рабочего и других адресов (хранятся локально на этом устройстве).',
    },
  };
  const h = (HELP as any)[language] || HELP.en;

  const sections = [
    { id: 'account', label: t('customer.settings.account'), icon: UserCircleIcon },
    { id: 'password', label: t('customer.settings.passwordSecurity'), icon: ShieldCheckIcon },
    { id: 'accounts', label: t('customer.settings.connectedAccounts'), icon: LinkIcon },
    { id: 'notifications', label: t('customer.settings.notifications'), icon: BellIcon },
    { id: 'privacy', label: t('customer.settings.privacy'), icon: ShieldCheckIcon },
    { id: 'language', label: t('customer.settings.language'), icon: GlobeAltIcon },
    { id: 'payments', label: t('customer.settings.payments'), icon: CreditCardIcon },
    { id: 'addresses', label: t('customer.settings.addresses'), icon: MapPinIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('customer.settings.title')}
            </h1>
            <HelpTip title={language === 'uk' ? 'Налаштування' : language === 'ru' ? 'Настройки' : 'Settings'} content={h.overview} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('customer.settings.subtitle')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <nav className="bg-white dark:bg-gray-800 rounded-xl shadow border border-white/20 dark:border-gray-800">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => { setActiveSection(section.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-xl transition duration-200 active:scale-[0.96] ${
                      activeSection === section.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-r-2 border-primary-700 dark:border-primary-500'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-white/20 dark:border-gray-800">
              {/* Account Settings */}
              {activeSection === 'account' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                    {t('customer.settings.account')}
                  </h2>
                  
                  {/* Profile Picture */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      {t('profile.profilePhoto') || t('settings.profilePhoto') || 'Profile Photo'}
                    </label>
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <Avatar
                          src={user.avatar}
                          alt={user.firstName || 'Profile'}
                          size="xl"
                          className="border-4 border-gray-200 dark:border-gray-600"
                        />
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <InlineLoader size="md" color="white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-3">
                        <div className="flex space-x-3">
                          <input
                            id="customer-settings-avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isUploadingImage}
                          />
                          <label
                            htmlFor="customer-settings-avatar-upload"
                            className={`cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition duration-200 active:scale-[0.96] ${isUploadingImage ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                          >
                            <CameraIcon className="w-4 h-4 inline mr-2" />
                            {isUploadingImage ? (t('settings.upload.uploading') || 'Uploading...') : (t('settings.upload.changePhoto') || 'Change Photo')}
                          </label>
                          
                          {user.avatar && (
                            <button
                              onClick={handleImageRemove}
                              disabled={isUploadingImage}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-4 py-2 rounded-xl font-medium transition duration-200 active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600"
                            >
                              <TrashIcon className="w-4 h-4 inline mr-2" />
                              {t('actions.remove') || 'Remove'}
                            </button>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('settings.upload.maxSize') || 'Maximum size: 5MB. Supported formats: JPG, PNG, WebP'}
                        </p>
                        
                        {/* Upload Status Messages */}
                        {uploadError && (
                          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
                            {uploadError}
                          </div>
                        )}
                        
                        {uploadSuccess && (
                          <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-200 dark:border-green-800">
                            {t('settings.upload.photoUpdated') || 'Photo updated successfully!'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.firstName')}
                      </label>
                      <input
                        type="text"
                        value={user.firstName}
                        onChange={(e) => setUser(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.lastName')}
                      </label>
                      <input
                        type="text"
                        value={user.lastName}
                        onChange={(e) => setUser(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.email')}
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        onChange={(e) => setUser(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span>{t('profile.phone')}</span>
                        <PhoneVerifyButton isVerified={(currentUser as any)?.isPhoneVerified} />
                      </label>
                      <input
                        type="tel"
                        value={user.phone}
                        onChange={(e) => setUser(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('settings.dateOfBirth')}
                      </label>
                      <input
                        type="date"
                        value={user.dateOfBirth}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setUser(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t('settings.dateOfBirthHint')}
                      </p>
                    </div>
                  </div>

                  {/* Language Preference in Personal Information */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      {t('profile.languageSettings') || 'Language Settings'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.interfaceLanguage') || t('settings.interfaceLanguage') || 'Interface Language'}
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                        >
                          <option value="uk">🇺🇦 Українська</option>
                          <option value="en">🇺🇸 English</option>
                          <option value="ru">🇷🇺 Русский</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('customer.settings.currencyLabel') || 'Currency'}
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                        >
                          <option value="UAH">₴ {t('currency.uah')}</option>
                          <option value="USD">$ {t('currency.usd')}</option>
                          <option value="EUR">€ {t('currency.eur')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveAccountSettings}
                      disabled={loading}
                      className="bg-primary-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-700 transition duration-200 active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        language === 'uk' ? 'Збереження...' :
                        language === 'ru' ? 'Сохранение...' :
                        'Saving...'
                      ) : (
                        t('common.saveChanges')
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Password & Security Settings */}
              {activeSection === 'password' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <ShieldCheckIcon className="w-5 h-5 mr-2" />
                    {t('customer.settings.passwordSecurity')}
                  </h2>

                  {/* Google OAuth Users - Set Password */}
                  {(currentUser?.hasPassword === false || (!currentUser?.passwordLastChanged && currentUser?.authProvider === 'google')) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {t('customer.settings.setPasswordTitle')}
                          </h5>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {t('customer.settings.setPasswordDescription')}
                          </p>
                          <button
                            onClick={() => setShowSetPasswordModal(true)}
                            className="inline-flex items-center mt-3 px-3 py-2 border border-transparent text-sm font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 transition active:scale-[0.96]"
                          >
                            {t('customer.settings.setPassword')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regular Users - Change Password */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t('customer.settings.password')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('customer.settings.lastChanged')}: {currentUser?.passwordLastChanged ? new Date(currentUser.passwordLastChanged).toLocaleDateString() : t('customer.settings.never')}
                        </p>
                      </div>
                      {(!currentUser?.hasPassword) ? (
                        <button
                          onClick={() => setShowSetPasswordModal(true)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          {t('customer.settings.setPassword')}
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => setShowChangePasswordModal(true)}
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                          >
                            {t('customer.settings.changePassword')}
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const { authService } = await import('@/services/auth.service');
                                await authService.forgotPassword(currentUser.email);
                                toast.success(t('auth.resetEmailSent') || 'Password reset link sent to your email');
                              } catch {
                                toast.error(t('auth.resetEmailFailed') || 'Failed to send reset email. Try again.');
                              }
                            }}
                            className="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                          >
                            {t('auth.forgotPassword') || 'Forgot password?'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      {t('customer.settings.passwordRequirements')}
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{t('customer.settings.passwordReq1')}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{t('customer.settings.passwordReq2')}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{t('customer.settings.passwordReq3')}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{t('customer.settings.passwordReq4')}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{t('customer.settings.passwordReq5')}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{t('customer.settings.passwordReq6')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Connected Accounts */}
              {activeSection === 'accounts' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {t('customer.settings.connectedAccounts')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {t('customer.settings.connectedAccountsDescription')}
                  </p>

                  <div className="space-y-4">
                    {/* Login Method */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {(currentUser as any)?.authProvider === 'google' ? (
                            <div className="w-8 h-8 flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <ShieldCheckIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {(currentUser as any)?.authProvider === 'google'
                                ? t('customer.settings.googleConnected')
                                : t('customer.settings.emailConnected')
                              }
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {currentUser?.email}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {language === 'uk' ? 'Активний' : language === 'ru' ? 'Активен' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Telegram */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#54a9eb">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Telegram
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t('customer.settings.telegramLinkDescription')}
                            </p>
                          </div>
                        </div>
                        {currentUser?.telegramId ? (
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {t('customer.settings.telegramConnected')}
                            </span>
                            <button
                              onClick={handleUnlinkTelegram}
                              disabled={isUnlinkingTelegram}
                              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
                            >
                              {isUnlinkingTelegram
                                ? (language === 'uk' ? 'Відключення...' : language === 'ru' ? 'Отключение...' : 'Unlinking...')
                                : t('customer.settings.unlinkTelegram')
                              }
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              {t('customer.settings.telegramNotConnected')}
                            </span>
                          </div>
                        )}
                      </div>
                      {!currentUser?.telegramId && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <TelegramLinkWidget
                            onSuccess={async () => {
                              toast.success(
                                language === 'uk' ? 'Telegram підключено!' :
                                language === 'ru' ? 'Telegram подключен!' :
                                'Telegram linked!'
                              );
                              try {
                                const profile = await userService.getProfile();
                                dispatch(updateUserProfile(profile));
                              } catch {}
                            }}
                            onError={(error) => {
                              toast.error(error);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                    {t('customer.settings.notifications')}
                  </h2>

                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">{t('customer.settings.emailNotifications')}</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'emailBookingConfirmation', label: t('customer.settings.bookingConfirmations') },
                          { key: 'emailReminders', label: t('customer.settings.appointmentReminders') },
                          { key: 'emailPromotions', label: t('customer.settings.promotionsOffers') },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                            <button
                              onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notifications[key as keyof typeof notifications] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notifications[key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">{t('customer.settings.pushNotifications')}</h3>

                      {/* Master Push Subscription Toggle */}
                      {isPushSupported && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {language === 'uk' ? 'Увімкнути push-сповіщення' : language === 'ru' ? 'Включить push-уведомления' : 'Enable Push Notifications'}
                              </span>
                              {isPushDenied && (
                                <p className="text-xs text-red-500 mt-1">
                                  {language === 'uk' ? 'Сповіщення заблоковані в налаштуваннях браузера' : language === 'ru' ? 'Уведомления заблокированы в настройках браузера' : 'Notifications blocked in browser settings'}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={togglePushSubscription}
                              disabled={isPushLoading || isPushDenied}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isPushSubscribed ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                              } ${(isPushLoading || isPushDenied) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isPushSubscribed ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {[
                          { key: 'pushBookingConfirmation', label: t('customer.settings.bookingConfirmations') },
                          { key: 'pushReminders', label: t('customer.settings.appointmentReminders') },
                          { key: 'pushPromotions', label: t('customer.settings.promotionsOffers') },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                            <button
                              onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notifications[key as keyof typeof notifications] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notifications[key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SMS Notifications */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">{t('customer.settings.smsNotifications')}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{t('customer.settings.appointmentReminders')}</span>
                          <button
                            onClick={() => handleNotificationChange('smsReminders')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              notifications.smsReminders ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                notifications.smsReminders ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                    {t('customer.settings.privacy')}
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('customer.settings.profileVisibility')}
                      </label>
                      <select
                        value={privacy.profileVisibility}
                        onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      >
                        <option value="public">{t('customer.settings.publicProfile')}</option>
                        <option value="private">{t('customer.settings.privateProfile')}</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      {[
                        { key: 'showEmail', label: t('customer.settings.showEmailProfile') },
                        { key: 'showPhone', label: t('customer.settings.showPhoneProfile') },
                        { key: 'allowReviews', label: t('customer.settings.allowReviews') },
                        { key: 'dataProcessing', label: t('customer.settings.dataProcessing') },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                          <button
                            onClick={() => handlePrivacyChange(key as keyof typeof privacy, !privacy[key as keyof typeof privacy])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              privacy[key as keyof typeof privacy] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                privacy[key as keyof typeof privacy] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Language & Region */}
              {activeSection === 'language' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                    {t('customer.settings.language')}
                  </h2>

                  <div className="space-y-6">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('customer.settings.languageLabel')}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      >
                        <option value="uk">🇺🇦 Українська</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="ru">🇷🇺 Русский</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('customer.settings.currencyLabel')}
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      >
                        <option value="UAH">₴ {t('currency.uah')}</option>
                        <option value="USD">$ {t('currency.usd')}</option>
                        <option value="EUR">€ {t('currency.eur')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('customer.settings.themeLabel')}
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all duration-200"
                      >
                        <option value="light">{t('customer.settings.lightTheme')}</option>
                        <option value="dark">{t('customer.settings.darkTheme')}</option>
                        <option value="system">{t('customer.settings.systemTheme')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Methods - Redirect to dedicated page */}
              {activeSection === 'payments' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <CreditCardIcon className="h-16 w-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {t('customer.settings.payments')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      {language === 'uk'
                        ? 'Керуйте вашими способами оплати на спеціальній сторінці'
                        : language === 'ru'
                        ? 'Управляйте вашими способами оплаты на специальной странице'
                        : 'Manage your payment methods on the dedicated page'
                      }
                    </p>
                    <Link
                      to="/payments"
                      className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-700 transition active:scale-[0.96]"
                    >
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      {language === 'uk' ? 'Перейти до способів оплати' : language === 'ru' ? 'Перейти к способам оплаты' : 'Go to Payment Methods'}
                    </Link>
                  </div>
                </div>
              )}

              {/* Addresses */}
              {activeSection === 'addresses' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {t('customer.settings.addresses')}
                    </h2>
                    <button
                      onClick={handleAddAddress}
                      className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition active:scale-[0.96] flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {t('customer.settings.addAddress')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPinIcon className="h-12 w-12 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('customer.settings.noAddresses')}</p>
                        <button
                          onClick={handleAddAddress}
                          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition active:scale-[0.96] flex items-center mx-auto"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          {t('customer.settings.addFirstAddress')}
                        </button>
                      </div>
                    ) : (
                      addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-start">
                          <MapPinIcon className="h-8 w-8 text-gray-500 dark:text-gray-400 mr-3 mt-1" />
                          <div>
                            <div className="flex items-center mb-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100 mr-2">{address.label}</p>
                              {address.isDefault && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  {t('customer.settings.defaultAddress')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{address.street}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {address.city}, {address.postalCode}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{address.country}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
                            {t('customer.settings.editAddress')}
                          </button>
                          <button
                            onClick={() => handleRemoveAddress(address.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                          >
                            {t('customer.settings.removeAddress')}
                          </button>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <MapPinIcon className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
              {t('customer.settings.addAddress')}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleSaveAddress({
                type: formData.get('addressType'),
                label: formData.get('label'),
                street: formData.get('street') || newAddressLocation.address,
                city: formData.get('city') || newAddressLocation.city,
                region: formData.get('region') || newAddressLocation.region,
                postalCode: formData.get('postalCode') || newAddressLocation.postalCode,
                country: formData.get('country') || newAddressLocation.country || 'Ukraine'
              });
            }}>
              <div className="space-y-5">
                {/* Pick on Map */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Вибрати на карті' : language === 'ru' ? 'Выбрать на карте' : 'Pick on Map'}
                  </label>
                  <LocationPicker
                    location={{
                      address: newAddressLocation.address,
                      city: newAddressLocation.city,
                      region: newAddressLocation.region,
                      country: newAddressLocation.country,
                      postalCode: newAddressLocation.postalCode,
                      latitude: newAddressLocation.latitude,
                      longitude: newAddressLocation.longitude,
                    }}
                    onLocationChange={(loc) => setNewAddressLocation(loc)}
                  />
                  {(!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Google Maps key not configured; manual entry only.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Тип адреси' : language === 'ru' ? 'Тип адреса' : 'Address Type'}
                  </label>
                  <select 
                    name="addressType"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="home">{language === 'uk' ? 'Дім' : language === 'ru' ? 'Дом' : 'Home'}</option>
                    <option value="work">{language === 'uk' ? 'Робота' : language === 'ru' ? 'Работа' : 'Work'}</option>
                    <option value="other">{language === 'uk' ? 'Інше' : language === 'ru' ? 'Другое' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Назва' : language === 'ru' ? 'Название' : 'Label'}
                  </label>
                  <input
                    type="text"
                    name="label"
                    placeholder={language === 'uk' ? 'Моя адреса' : language === 'ru' ? 'Мой адрес' : 'My Address'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Вулиця' : language === 'ru' ? 'Улица' : 'Street Address'}
                  </label>
                  <input
                    type="text"
                    name="street"
                    defaultValue={newAddressLocation.address}
                    placeholder={language === 'uk' ? 'вул. Хрещатик, 1' : language === 'ru' ? 'ул. Крещатик, 1' : '123 Main Street'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {language === 'uk' ? 'Місто' : language === 'ru' ? 'Город' : 'City'}
                    </label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={newAddressLocation.city}
                      placeholder={language === 'uk' ? 'Київ' : language === 'ru' ? 'Киев' : 'Kyiv'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {language === 'uk' ? 'Поштовий код' : language === 'ru' ? 'Почтовый код' : 'Postal Code'}
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      defaultValue={newAddressLocation.postalCode}
                      placeholder="01001"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Регіон / Область' : language === 'ru' ? 'Регион / Область' : 'Region / State'}
                  </label>
                  <input
                    type="text"
                    name="region"
                    defaultValue={newAddressLocation.region}
                    placeholder={language === 'uk' ? 'Київська область' : language === 'ru' ? 'Киевская область' : 'Kyiv Oblast'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Країна' : language === 'ru' ? 'Страна' : 'Country'}
                  </label>
                  <select 
                    name="country"
                    defaultValue={newAddressLocation.country || 'Ukraine'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="Ukraine">{language === 'uk' ? 'Україна' : language === 'ru' ? 'Украина' : 'Ukraine'}</option>
                    <option value="Poland">{language === 'uk' ? 'Польща' : language === 'ru' ? 'Польша' : 'Poland'}</option>
                    <option value="Germany">{language === 'uk' ? 'Німеччина' : language === 'ru' ? 'Германия' : 'Germany'}</option>
                    <option value="Other">{language === 'uk' ? 'Інше' : language === 'ru' ? 'Другое' : 'Other'}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-xl transition active:scale-[0.96]"
                >
                  {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition active:scale-[0.96] shadow-sm"
                >
                  {t('customer.settings.addAddress')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Set Password Modal */}
      <SetPasswordModal
        isOpen={showSetPasswordModal}
        onClose={() => setShowSetPasswordModal(false)}
        onSuccess={() => {
          // Delay reload to let the user see the success message
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          // Delay reload to let the user see the success message
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }}
      />

      <ConfirmModal
        open={showUnlinkTelegramModal}
        title={t('customer.settings.telegramUnlinkConfirm') || 'Unlink Telegram?'}
        message={
          language === 'uk' ? 'Ви впевнені, що хочете відключити Telegram?' :
          language === 'ru' ? 'Вы уверены, что хотите отключить Telegram?' :
          'Are you sure you want to unlink your Telegram account?'
        }
        confirmText={
          language === 'uk' ? 'Відключити' :
          language === 'ru' ? 'Отключить' :
          'Unlink'
        }
        loading={isUnlinkingTelegram}
        variant="danger"
        onConfirm={confirmUnlinkTelegram}
        onCancel={() => setShowUnlinkTelegramModal(false)}
      />
    </div>
  );
};

export default CustomerSettings;
