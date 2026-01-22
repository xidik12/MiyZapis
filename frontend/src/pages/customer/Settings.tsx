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
import { ALLOWED_IMAGE_MIME_TYPES, IMAGE_FILE_ACCEPT, isAllowedImageFile } from '../../utils/fileValidation';
import { toast } from 'react-toastify';
import { Avatar } from '../../components/ui/Avatar';
import { LocationPicker } from '../../components/LocationPicker';
import SetPasswordModal from '../../components/auth/SetPasswordModal';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal';
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
} from '@/components/icons';


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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'aba' | 'khqr'>('card');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
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

  useEffect(() => {
    if (!showAddPaymentModal) {
      setPaymentType('card');
      setQrFile(null);
      setQrPreview(null);
    }
  }, [showAddPaymentModal]);

  useEffect(() => {
    return () => {
      if (qrPreview) {
        URL.revokeObjectURL(qrPreview);
      }
    };
  }, [qrPreview]);

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

  const handleSavePaymentMethod = async (paymentData: {
    type: 'card' | 'aba' | 'khqr';
    name?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    accountName?: string;
    accountNumber?: string;
    qrFile?: File | null;
  }) => {
    try {
      setLoading(true);

      let payload: Parameters<typeof PaymentMethodsService.addPaymentMethod>[0];
      if (paymentData.type === 'card') {
        const brand = paymentData.name?.toLowerCase() || '';
        payload = {
          type: 'CARD',
          cardLast4: paymentData.last4 || '',
          cardBrand: brand.includes('visa') ? 'visa' : brand.includes('master') ? 'mastercard' : 'card',
          cardExpMonth: paymentData.expiryMonth,
          cardExpYear: paymentData.expiryYear,
          nickname: paymentData.name,
        };
      } else {
        let qrImageUrl: string | undefined;
        if (paymentData.qrFile) {
          const uploaded = await fileUploadService.uploadFile(paymentData.qrFile, {
            type: 'document',
            maxSize: 5 * 1024 * 1024,
            allowedTypes: ALLOWED_IMAGE_MIME_TYPES,
          });
          qrImageUrl = uploaded.url;
        }

        const bankName = paymentData.type === 'aba' ? 'ABA' : 'KHQR';
        payload = {
          type: 'BANK_TRANSFER',
          bankName,
          accountName: paymentData.accountName,
          accountNumber: paymentData.accountNumber,
          qrImageUrl,
          nickname: paymentData.accountName || `${bankName} Account`,
        };
      }

      const newMethod = await PaymentMethodsService.addPaymentMethod(payload);
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
    if (!isAllowedImageFile(file)) {
      setUploadError(t('settings.profile.imageSelectError'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError(t('settings.profile.imageSizeError'));
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
      setUploadError(error.message || t('settings.profile.imageUploadError'));
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
      setUploadError(error.message || t('settings.profile.imageRemoveError'));
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
                      {t('settings.profile.photoLabel')}
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
                              accept={IMAGE_FILE_ACCEPT}
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
                          {t('settings.profile.photoHint')}
                        </p>
                        
                        {/* Upload Status Messages */}
                        {uploadError && (
                          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                            {uploadError}
                          </div>
                        )}
                        
                        {uploadSuccess && (
                          <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                            {t('settings.profile.photoUpdated')}
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
                      {t('settings.languagePreferences')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.interfaceLanguage')}
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as 'en' | 'kh')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="en">🇺🇸 English</option>
                          <option value="kh">🇰🇭 ខ្មែរ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.currency')}
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="USD">$ {t('currency.usd')}</option>
                          <option value="KHR">៛ {t('currency.khr')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                    {/* Password & Security */}
                  <div className="border-t pt-6">
                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                      {t('profile.passwordSecurity')}
                    </h4>

                    {/* Google OAuth Users - Set Password */}
                    {/* Debug logging - remove in production */}
                    {console.log('🔍 Customer Settings Blue Box Auth Debug:', {
                      authProvider: currentUser?.authProvider,
                      hasPassword: currentUser?.hasPassword,
                      condition: currentUser?.authProvider === 'google' && !currentUser?.hasPassword
                    })}
                    {(!currentUser?.passwordLastChanged && currentUser?.authProvider === 'google') && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {t('auth.setPassword.title')}
                            </h5>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              {t('auth.setPassword.description')}
                            </p>
                            <button
                              onClick={() => setShowSetPasswordModal(true)}
                              className="inline-flex items-center mt-3 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors"
                            >
                              {t('auth.setPassword.action')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Regular Users - Change Password */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t('profile.password')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('profile.lastChanged')}: {currentUser?.passwordLastChanged ? new Date(currentUser.passwordLastChanged).toLocaleDateString() : t('common.never')}
                        </p>
                      </div>
                      {/* Debug logging - remove in production */}
                      {console.log('🔍 Customer Settings Auth Debug:', {
                        authProvider: currentUser?.authProvider,
                        hasPassword: currentUser?.hasPassword,
                        passwordLastChanged: currentUser?.passwordLastChanged,
                        condition: currentUser?.authProvider === 'google' && !currentUser?.hasPassword
                      })}
                      {(!currentUser?.passwordLastChanged && currentUser?.authProvider === 'google') ? (
                        <button
                          onClick={() => setShowSetPasswordModal(true)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          {t('auth.setPassword.action')}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowChangePasswordModal(true)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          {t('customer.settings.changePassword')}
                        </button>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <p className="font-medium mb-2">{t('profile.passwordRequirements')}:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {t('profile.passwordReq.length')}</li>
                        <li>• {t('profile.passwordReq.uppercase')}</li>
                        <li>• {t('profile.passwordReq.lowercase')}</li>
                        <li>• {t('profile.passwordReq.number')}</li>
                        <li>• {t('profile.passwordReq.symbol')}</li>
                        <li>• {t('profile.passwordReq.english')}</li>
                      </ul>
                    </div>

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
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">{t('customer.settings.pushNotifications')}</h3>
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'kh')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="kh">🇰🇭 ខ្មែរ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('customer.settings.currencyLabel')}
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="USD">$ {t('currency.usd')}</option>
                        <option value="KHR">៛ {t('currency.khr')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('customer.settings.themeLabel')}
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="light">{t('customer.settings.lightTheme')}</option>
                        <option value="dark">{t('customer.settings.darkTheme')}</option>
                        <option value="system">{t('customer.settings.systemTheme')}</option>
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
                      {t('payment.addPaymentMethod')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCardIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('payments.emptyTitle')}</p>
                        <button 
                          onClick={handleAddPaymentMethod}
                          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center mx-auto"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          {t('payments.emptyCta')}
                        </button>
                      </div>
                    ) : (
                      paymentMethods.map((method) => {
                        const methodType = (method.type || '').toLowerCase();
                        const isCard = methodType.includes('card');
                        const bankLabel = method.bankName || (methodType.includes('khqr') ? 'KHQR' : methodType.includes('aba') ? 'ABA' : 'Bank');
                        const displayName = method.nickname || (isCard ? `${method.cardBrand || 'Card'} •••• ${method.cardLast4 || ''}` : `${bankLabel} Account`);
                        const detailLine = isCard
                          ? `**** **** **** ${method.cardLast4 || ''}${method.cardExpMonth && method.cardExpYear ? ` • ${method.cardExpMonth.toString().padStart(2, '0')}/${method.cardExpYear}` : ''}`
                          : `${t('payments.accountSuffix')} ${method.accountNumber?.slice(-4) || ''}`;

                        return (
                          <div key={method.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <CreditCardIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mr-3" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{detailLine}</p>
                                {method.isDefault && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    {t('payments.default')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {method.qrImageUrl && (
                                <img
                                  src={method.qrImageUrl}
                                  alt={`${bankLabel} QR`}
                                  className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-gray-600"
                                />
                              )}
                              <button className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
                                {t('profile.edit')}
                              </button>
                              <button
                                onClick={() => handleRemovePaymentMethod(method.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                              >
                                {t('profile.remove')}
                              </button>
                            </div>
                          </div>
                        );
                      })
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
                      {t('profile.addAddress')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPinIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('profile.noAddressesYet')}</p>
                        <button 
                          onClick={handleAddAddress}
                          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center mx-auto"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          {t('profile.addYourFirstAddress')}
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
                                  {t('profile.default')}
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
                            {t('profile.edit')}
                          </button>
                          <button
                            onClick={() => handleRemoveAddress(address.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                          >
                            {t('profile.remove')}
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
              {t('payment.addPaymentMethod')}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              if (paymentType === 'card') {
                handleSavePaymentMethod({
                  type: 'card',
                  name: String(formData.get('cardName') || ''),
                  last4: formData.get('cardNumber')?.toString().slice(-4) || '',
                });
              } else {
                handleSavePaymentMethod({
                  type: paymentType,
                  accountName: String(formData.get('accountName') || ''),
                  accountNumber: String(formData.get('accountNumber') || ''),
                  qrFile,
                });
              }
            }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {t('payments.paymentType')}
                  </label>
                  <select 
                    name="paymentType"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as 'card' | 'aba' | 'khqr')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="card">{t('payments.bankCard')}</option>
                    <option value="aba">{t('payments.abaBank')}</option>
                    <option value="khqr">{t('payments.khqr')}</option>
                  </select>
                </div>

                {paymentType === 'card' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {t('payments.cardName')}
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        placeholder={t('payments.cardNamePlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {t('payments.cardNumber')}
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder={t('payments.cardNumberPlaceholder')}
                        maxLength={19}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        onChange={(e) => {
                          let value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                          e.target.value = value;
                        }}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {t('payments.accountName')}
                      </label>
                      <input
                        type="text"
                        name="accountName"
                        placeholder={t('payments.accountNamePlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {t('payments.accountNumber')}
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        placeholder={t('payments.accountNumberPlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {t('payments.qrImage')}
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:border-primary-400">
                          <CameraIcon className="h-4 w-4" />
                          {t('payments.uploadQr')}
                          <input
                            type="file"
                            name="qrImage"
                            accept={IMAGE_FILE_ACCEPT}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setQrFile(file);
                              if (qrPreview) {
                                URL.revokeObjectURL(qrPreview);
                              }
                              setQrPreview(file ? URL.createObjectURL(file) : null);
                            }}
                            required
                          />
                        </label>
                        {qrPreview && (
                          <img
                            src={qrPreview}
                            alt={t('payments.qrPreviewAlt')}
                            className="h-12 w-12 rounded-md object-cover border border-gray-200 dark:border-gray-600"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  {t('payments.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                >
                  {t('payment.addPaymentMethod')}
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
              {t('addresses.addTitle')}
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
                    {t('addresses.pickOnMap')}
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
                    {t('addresses.typeLabel')}
                  </label>
                  <select 
                    name="addressType"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="home">{t('common.home')}</option>
                    <option value="work">{t('common.work')}</option>
                    <option value="other">{t('common.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {t('addresses.label')}
                  </label>
                  <input
                    type="text"
                    name="label"
                    placeholder={t('addresses.labelPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {t('addresses.street')}
                  </label>
                  <input
                    type="text"
                    name="street"
                    defaultValue={newAddressLocation.address}
                    placeholder={t('addresses.streetPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {t('addresses.city')}
                    </label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={newAddressLocation.city}
                      placeholder={t('addresses.cityPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {t('addresses.postalCode')}
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
                    {t('addresses.region')}
                  </label>
                  <input
                    type="text"
                    name="region"
                    defaultValue={newAddressLocation.region}
                    placeholder={t('addresses.regionPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {t('addresses.country')}
                  </label>
                  <select 
                    name="country"
                    defaultValue={newAddressLocation.country || 'Ukraine'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="Ukraine">{t('addresses.country.ukraine')}</option>
                    <option value="Poland">{t('addresses.country.poland')}</option>
                    <option value="Germany">{t('addresses.country.germany')}</option>
                    <option value="Other">{t('common.other')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                >
                  {t('addresses.addAction')}
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          // Refresh user data after successful password change
          window.location.reload();
        }}
      />
    </div>
  );
};

export default CustomerSettings;
