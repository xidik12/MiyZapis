import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, updateUserProfile } from '../../store/slices/authSlice';
import { PaymentMethod } from '../../types';
import { PaymentMethodsService } from '../../services/paymentMethods';
import { fileUploadService } from '../../services/fileUpload.service';
import { userService } from '../../services/user.service';
import { toast } from 'react-toastify';
import { Avatar } from '../../components/ui/Avatar';
import { LocationPicker } from '../../components/LocationPicker';
import SetPasswordModal from '../../components/auth/SetPasswordModal';
import { 
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CreditCardIcon,
  MapPinIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CameraIcon
} from '@heroicons/react/24/outline';


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
  const [user, setUser] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    avatar: currentUser?.avatar || '',
  });

  // Profile image upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
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

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyChange = (key: keyof typeof privacy, value: any) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRemovePaymentMethod = async (id: string) => {
    try {
      setLoading(true);
      await PaymentMethodsService.deletePaymentMethod(id);
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      toast.success(t('settings.payment.removed') || 'Payment method removed');
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      toast.error(t('settings.payment.removeError') || 'Failed to remove payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
  };

  const handleAddAddress = () => {
    setShowAddAddressModal(true);
  };

  const handleSavePaymentMethod = async (paymentData: any) => {
    try {
      setLoading(true);
      const newMethod = await PaymentMethodsService.addPaymentMethod({
        type: 'CARD', // Default to card type
        cardLast4: paymentData.last4 || '',
        cardBrand: paymentData.name?.toLowerCase().includes('visa') ? 'visa' : 'mastercard',
        cardExpMonth: paymentData.expiryMonth,
        cardExpYear: paymentData.expiryYear,
        nickname: paymentData.name,
      });
      
      setPaymentMethods(prev => [...prev, newMethod]);
      setShowAddPaymentModal(false);
      toast.success(t('settings.payment.added') || 'Payment method added');
    } catch (error) {
      console.error('Failed to add payment method:', error);
      toast.error(t('settings.payment.addError') || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = (addressData: any) => {
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
      const updatedUser = await userService.updateProfile({ avatar: result.url });
      
      // Update Redux store with only the avatar field
      dispatch(updateUserProfile({ avatar: result.url }));
      
      // Update local state
      setUser(prev => ({ ...prev, avatar: result.url }));
      setUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setUploadError(
        error.message ||
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
      const updatedUser = await userService.updateProfile({ avatar: null });
      
      // Update Redux store with only the avatar field
      dispatch(updateUserProfile({ avatar: null }));
      
      // Update local state
      setUser(prev => ({ ...prev, avatar: '' }));
      setUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      setUploadError(
        error.message ||
        (language === 'uk' ? 'Помилка видалення зображення' :
         language === 'ru' ? 'Ошибка удаления изображения' :
         'Failed to remove image')
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const sections = [
    { id: 'account', label: t('customer.settings.account'), icon: UserCircleIcon },
    { id: 'notifications', label: t('customer.settings.notifications'), icon: BellIcon },
    { id: 'privacy', label: t('customer.settings.privacy'), icon: ShieldCheckIcon },
    { id: 'language', label: t('customer.settings.language'), icon: GlobeAltIcon },
    { id: 'payments', label: t('customer.settings.payments'), icon: CreditCardIcon },
    { id: 'addresses', label: t('customer.settings.addresses'), icon: MapPinIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('customer.settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('customer.settings.subtitle')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow border border-white/20 dark:border-gray-700/50">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-white/20 dark:border-gray-700/50">
              {/* Account Settings */}
              {activeSection === 'account' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                    {t('customer.settings.account')}
                  </h2>
                  
                  {/* Profile Picture */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      {language === 'uk' ? 'Фото профілю' : language === 'ru' ? 'Фото профиля' : 'Profile Photo'}
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
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-3">
                        <div className="flex space-x-3">
                          <label className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={isUploadingImage}
                            />
                            <CameraIcon className="w-4 h-4 inline mr-2" />
                            {isUploadingImage ? (t('settings.upload.uploading') || 'Uploading...') : (t('settings.upload.changePhoto') || 'Change Photo')}
                          </label>
                          
                          {user.avatar && (
                            <button
                              onClick={handleImageRemove}
                              disabled={isUploadingImage}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600"
                            >
                              <TrashIcon className="w-4 h-4 inline mr-2" />
                              {t('actions.remove') || 'Remove'}
                            </button>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {language === 'uk' ? 'Максимальний розмір: 5МБ. Підтримуються формати: JPG, PNG, WebP' :
                           language === 'ru' ? 'Максимальный размер: 5МБ. Поддерживаемые форматы: JPG, PNG, WebP' :
                           'Maximum size: 5MB. Supported formats: JPG, PNG, WebP'}
                        </p>
                        
                        {/* Upload Status Messages */}
                        {uploadError && (
                          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                            {uploadError}
                          </div>
                        )}
                        
                        {uploadSuccess && (
                          <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                            {language === 'uk' ? 'Фото успішно оновлено!' : language === 'ru' ? 'Фото успешно обновлено!' : 'Photo updated successfully!'}
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.phone')}
                      </label>
                      <input
                        type="tel"
                        value={user.phone}
                        onChange={(e) => setUser(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Language Preference in Personal Information */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      {language === 'uk' ? 'Налаштування мови' : language === 'ru' ? 'Настройки языка' : 'Language Settings'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Мова інтерфейсу' : language === 'ru' ? 'Язык интерфейса' : 'Interface Language'}
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="uk">🇺🇦 Українська</option>
                          <option value="ru">🇷🇺 Русский</option>
                          <option value="en">🇺🇸 English</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Валюта' : language === 'ru' ? 'Валюта' : 'Currency'}
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="UAH">₴ {t('currency.uah')}</option>
                          <option value="USD">$ {t('currency.usd')}</option>
                          <option value="EUR">€ {t('currency.eur')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Password & Security */}
                  <div className="border-t pt-6">
                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                      Password & Security
                    </h4>

                    {/* Google OAuth Users - Set Password */}
                    {/* Debug logging - remove in production */}
                    {console.log('🔍 Customer Settings Blue Box Auth Debug:', {
                      authProvider: currentUser?.authProvider,
                      hasPassword: currentUser?.hasPassword,
                      condition: currentUser?.authProvider === 'google' && !currentUser?.hasPassword
                    })}
                    {!currentUser?.passwordLastChanged && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Set up password for your account
                            </h5>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              You signed up with Google. Set a password to enable password reset and additional security options.
                            </p>
                            <button
                              onClick={() => setShowSetPasswordModal(true)}
                              className="inline-flex items-center mt-3 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors"
                            >
                              Set Password
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Regular Users - Change Password */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Password
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Last changed: {currentUser?.passwordLastChanged ? new Date(currentUser.passwordLastChanged).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      {/* Debug logging - remove in production */}
                      {console.log('🔍 Customer Settings Auth Debug:', {
                        authProvider: currentUser?.authProvider,
                        hasPassword: currentUser?.hasPassword,
                        passwordLastChanged: currentUser?.passwordLastChanged,
                        condition: currentUser?.authProvider === 'google' && !currentUser?.hasPassword
                      })}
                      {!currentUser?.passwordLastChanged ? (
                        <button
                          onClick={() => setShowSetPasswordModal(true)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          Set Password
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowChangePassword(!showChangePassword)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          {t('customer.settings.changePassword')}
                        </button>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <p className="font-medium mb-2">Password requirements:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• At least 8 characters long</li>
                        <li>• One uppercase letter (A-Z)</li>
                        <li>• One lowercase letter (a-z)</li>
                        <li>• One number (0-9)</li>
                        <li>• One symbol (!@#$%^&*)</li>
                        <li>• English characters only</li>
                      </ul>
                    </div>

                    {showChangePassword && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.currentPassword')}
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.newPassword')}
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.confirmPassword')}
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors">
                      {t('common.saveChanges')}
                    </button>
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
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Push Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'pushBookingConfirmation', label: 'Booking confirmations' },
                          { key: 'pushReminders', label: 'Appointment reminders' },
                          { key: 'pushPromotions', label: 'Promotions and offers' },
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
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">SMS Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Appointment reminders</span>
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
                        Profile Visibility
                      </label>
                      <select
                        value={privacy.profileVisibility}
                        onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      {[
                        { key: 'showEmail', label: 'Show email in profile' },
                        { key: 'showPhone', label: 'Show phone number in profile' },
                        { key: 'allowReviews', label: 'Allow others to leave reviews' },
                        { key: 'dataProcessing', label: 'Allow data processing for recommendations' },
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
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="uk">🇺🇦 Українська</option>
                        <option value="ru">🇷🇺 Русский</option>
                        <option value="en">🇺🇸 English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="UAH">₴ {t('currency.uah')}</option>
                        <option value="USD">$ {t('currency.usd')}</option>
                        <option value="EUR">€ {t('currency.eur')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              {activeSection === 'payments' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {t('customer.settings.payments')}
                    </h2>
                    <button 
                      onClick={handleAddPaymentMethod}
                      className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </button>
                  </div>

                  <div className="space-y-4">
                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCardIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No payment methods added yet</p>
                        <button 
                          onClick={handleAddPaymentMethod}
                          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center mx-auto"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Your First Payment Method
                        </button>
                      </div>
                    ) : (
                      paymentMethods.map((method) => (
                      <div key={method.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCardIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{method.nickname || `${method.cardBrand} •••• ${method.cardLast4}`}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              **** **** **** {method.cardLast4}
                              {method.cardExpMonth && method.cardExpYear && (
                                <span className="ml-2">
                                  Expires {method.cardExpMonth.toString().padStart(2, '0')}/{method.cardExpYear}
                                </span>
                              )}
                            </p>
                            {method.isDefault && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemovePaymentMethod(method.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      ))
                    )}
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
                      className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Address
                    </button>
                  </div>

                  <div className="space-y-4">
                    {addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPinIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No addresses added yet</p>
                        <button 
                          onClick={handleAddAddress}
                          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center mx-auto"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-start">
                          <MapPinIcon className="h-8 w-8 text-gray-500 dark:text-gray-400 mr-3 mt-1" />
                          <div>
                            <div className="flex items-center mb-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100 mr-2">{address.label}</p>
                              {address.isDefault && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  Default
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
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveAddress(address.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                          >
                            Remove
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

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <CreditCardIcon className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
              {language === 'uk' ? 'Додати спосіб оплати' : language === 'ru' ? 'Добавить способ оплаты' : 'Add Payment Method'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleSavePaymentMethod({
                type: 'card',
                name: formData.get('cardName'),
                last4: formData.get('cardNumber')?.toString().slice(-4) || ''
              });
            }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Тип оплати' : language === 'ru' ? 'Тип оплаты' : 'Payment Type'}
                  </label>
                  <select 
                    name="paymentType"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="card">{language === 'uk' ? 'Банківська картка' : language === 'ru' ? 'Банковская карта' : 'Bank Card'}</option>
                    <option value="privat">PrivatBank</option>
                    <option value="mono">Monobank</option>
                    <option value="ukrsib">UkrSibbank</option>
                    <option value="oschadbank">Oschadbank</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Назва картки' : language === 'ru' ? 'Название карты' : 'Card Name'}
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    placeholder={language === 'uk' ? 'Моя картка Visa' : language === 'ru' ? 'Моя карта Visa' : 'My Visa Card'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Номер картки' : language === 'ru' ? 'Номер карты' : 'Card Number'}
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    onChange={(e) => {
                      // Format card number with spaces
                      let value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                      e.target.value = value;
                    }}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                >
                  {language === 'uk' ? 'Додати спосіб оплати' : language === 'ru' ? 'Добавить способ оплаты' : 'Add Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <MapPinIcon className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
              {language === 'uk' ? 'Додати адресу' : language === 'ru' ? 'Добавить адрес' : 'Add Address'}
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {language === 'uk' ? 'Місто' : language === 'ru' ? 'Город' : 'City'}
                    </label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={newAddressLocation.city}
                      placeholder={language === 'uk' ? 'Київ' : language === 'ru' ? 'Киев' : 'Kyiv'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'uk' ? 'Країна' : language === 'ru' ? 'Страна' : 'Country'}
                  </label>
                  <select 
                    name="country"
                    defaultValue={newAddressLocation.country || 'Ukraine'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                >
                  {language === 'uk' ? 'Додати адресу' : language === 'ru' ? 'Добавить адрес' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      <SetPasswordModal
        isOpen={showSetPasswordModal}
        onClose={() => setShowSetPasswordModal(false)}
        onSuccess={() => {
          // Refresh user data after successful password set
          window.location.reload();
        }}
      />
    </div>
  );
};

export default CustomerSettings;
