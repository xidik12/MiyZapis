import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, updateUserProfile } from '../../store/slices/authSlice';
import { fileUploadService } from '../../services/fileUpload.service';
import { userService } from '../../services/user.service';
import { specialistService } from '../../services/specialist.service';
import { Avatar } from '../../components/ui/Avatar';
import SetPasswordModal from '../../components/auth/SetPasswordModal';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal';
// Removed SpecialistPageWrapper - layout is handled by SpecialistLayout
import { UserIcon, BellIcon, ShieldCheckIcon, CreditCardIcon, GlobeIcon as GlobeAltIcon, CalendarIcon, Cog6ToothIcon, EyeIcon, DeviceMobileIcon as DevicePhoneMobileIcon, EnvelopeIcon, CheckIcon, CameraIcon, TrashIcon, KeyIcon, LockClosedIcon } from '@/components/icons';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const SpecialistSettings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  
  // Web Push subscription management
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isDenied: isPushDenied,
    isLoading: isPushLoading,
    toggle: togglePushSubscription,
  } = usePushNotifications();

  // Profile image state
  const [profileImage, setProfileImage] = useState(user?.avatar || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security' | 'notifications' | 'privacy' | 'business' | 'language'>('profile');

  // Update profileImage when user avatar changes
  useEffect(() => {
    if (user?.avatar !== profileImage) {
      setProfileImage(user?.avatar || '');
    }
  }, [user?.avatar]);

  // Load specialist profile settings on mount
  useEffect(() => {
    const loadSpecialistSettings = async () => {
      try {
        const profile = await specialistService.getProfile();
        setSettings(prev => ({
          ...prev,
          accountSettings: {
            ...prev.accountSettings,
            autoAcceptBookings: profile.autoBooking ?? false,
          },
          business: {
            ...prev.business,
            cancellationWindow: (profile as any).cancellationWindowHours ?? 24,
          },
        }));
      } catch (error) {
        console.error('Error loading specialist settings:', error);
      }
    };
    loadSpecialistSettings();
  }, []);

  // Settings state
  const [settings, setSettings] = useState({
    // Account Settings
    accountSettings: {
      autoAcceptBookings: false,
      allowInstantBookings: true,
      requireVerification: true,
      showProfileInSearch: true,
    },
    
    // Notification Settings
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newBookingAlert: true,
      bookingReminders: true,
      paymentNotifications: true,
      reviewNotifications: true,
      marketingEmails: false,
    },
    
    // Privacy Settings
    privacy: {
      showPhoneNumber: false,
      showEmail: false,
      allowDirectMessages: true,
      showLastSeen: true,
      dataProcessingConsent: true,
      marketingConsent: false,
    },
    
    // Business Settings
    business: {
      acceptOnlinePayments: true,
      requireDeposit: false,
      depositPercentage: 20,
      cancellationWindow: 24,
      rescheduleLimit: 2,
      autoReviewReminder: true,
    },
  });

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

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
      setProfileImage(result.url);
      setUploadSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);

    } catch (error: any) {
      console.error('[Settings Avatar Upload] Upload failed:', error);
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
      setProfileImage('');
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

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    label, 
    description 
  }: { 
    enabled: boolean; 
    onChange: (value: boolean) => void; 
    label: string; 
    description?: string; 
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</h4>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  // State to track saving in progress
  const [isSaving, setIsSaving] = useState(false);

  // Handle saving all settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setUploadError('');

      // Save cancellation window and other business settings to the specialist profile
      await specialistService.updateProfile({
        cancellationWindowHours: settings.business.cancellationWindow,
        autoBooking: settings.accountSettings.autoAcceptBookings,
      } as any);

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setUploadError(
        language === 'uk' ? 'Помилка збереження налаштувань' :
        language === 'ru' ? 'Ошибка сохранения настроек' :
        'Failed to save settings'
      );
      setTimeout(() => setUploadError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    
      <div className="bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('settings.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('settings.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <nav className="space-y-1 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'profile'
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <UserIcon className="w-5 h-5 mr-3" />
                    {t('settings.profile') || 'Profile'}
                  </button>
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'account'
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Cog6ToothIcon className="w-5 h-5 mr-3" />
                    {t('settings.account')}
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'security'
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ShieldCheckIcon className="w-5 h-5 mr-3" />
                    {t('customer.settings.passwordSecurity')}
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'notifications'
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <BellIcon className="w-5 h-5 mr-3" />
                    {t('settings.notifications')}
                  </button>
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'privacy'
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ShieldCheckIcon className="w-5 h-5 mr-3" />
                    {t('settings.privacy')}
                  </button>
                  <button
                    onClick={() => setActiveTab('business')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'business'
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <CreditCardIcon className="w-5 h-5 mr-3" />
                    {t('settings.business')}
                  </button>
                  <button
                    onClick={() => setActiveTab('language')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'language'
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <GlobeAltIcon className="w-5 h-5 mr-3" />
                    {t('settings.language')}
                  </button>
                </nav>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                <div id="profile" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2" />
                      {t('settings.profile') || 'Profile'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.profileDescription') || 'Manage your profile photo and personal information'}
                    </p>
                  </div>
                  <div className="p-6">
                    {/* Profile Image Upload */}
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {language === 'uk' ? 'Фото профілю' : language === 'ru' ? 'Фото профиля' : 'Profile Photo'}
                      </label>
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <Avatar
                            src={profileImage}
                            alt={user?.firstName || 'Profile'}
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
                            <input
                              id="settings-avatar-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={isUploadingImage}
                            />
                            <label
                              htmlFor="settings-avatar-upload"
                              className={`cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition-colors ${isUploadingImage ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                            >
                              <CameraIcon className="w-4 h-4 inline mr-2" />
                              {isUploadingImage ?
                                (t('settings.upload.uploading') || 'Uploading...') :
                                (t('settings.upload.changePhoto') || 'Change Photo')
                              }
                            </label>
                            
                            {profileImage && (
                              <button
                                onClick={handleImageRemove}
                                disabled={isUploadingImage}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600"
                              >
                                <TrashIcon className="w-4 h-4 inline mr-2" />
                                {language === 'uk' ? 'Видалити' : language === 'ru' ? 'Удалить' : 'Remove'}
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
                            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
                              {uploadError}
                            </div>
                          )}
                          
                          {uploadSuccess && (
                            <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-200 dark:border-green-800">
                              {language === 'uk' ? 'Фото успішно оновлено!' : language === 'ru' ? 'Фото успешно обновлено!' : 'Photo updated successfully!'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Account Settings */}
                {activeTab === 'account' && (
                <div id="account" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <Cog6ToothIcon className="w-5 h-5 mr-2" />
                      {t('settings.account')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.accountDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    <ToggleSwitch
                      enabled={settings.accountSettings.autoAcceptBookings}
                      onChange={(value) => handleSettingChange('accountSettings', 'autoAcceptBookings', value)}
                      label={t('settings.autoAcceptBookings')}
                      description={t('settings.autoAcceptBookingsDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.accountSettings.allowInstantBookings}
                      onChange={(value) => handleSettingChange('accountSettings', 'allowInstantBookings', value)}
                      label={t('settings.allowInstantBookings')}
                      description={t('settings.allowInstantBookingsDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.accountSettings.requireVerification}
                      onChange={(value) => handleSettingChange('accountSettings', 'requireVerification', value)}
                      label={t('settings.requireVerification')}
                      description={t('settings.requireVerificationDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.accountSettings.showProfileInSearch}
                      onChange={(value) => handleSettingChange('accountSettings', 'showProfileInSearch', value)}
                      label={t('settings.showProfileInSearch')}
                      description={t('settings.showProfileInSearchDesc')}
                    />
                  </div>
                </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                <div id="security" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <ShieldCheckIcon className="w-5 h-5 mr-2" />
                      {t('customer.settings.passwordSecurity')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('customer.settings.securityDescription')}
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Password Management */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <KeyIcon className="w-4 h-4 mr-2" />
                        {t('customer.settings.passwordManagement')}
                      </h4>

                      {/* Google OAuth Users - Set Password */}
                      {(!user?.passwordLastChanged && user?.authProvider === 'google') && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start space-x-3">
                            <LockClosedIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {t('customer.settings.setPasswordTitle')}
                              </h5>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                {t('customer.settings.setPasswordDescription')}
                              </p>
                              <button
                                onClick={() => setShowSetPasswordModal(true)}
                                className="inline-flex items-center mt-3 px-3 py-2 border border-transparent text-sm font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors"
                              >
                                <KeyIcon className="w-4 h-4 mr-2" />
                                {t('customer.settings.setPassword')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Regular Users - Change Password */}
                      {(user?.passwordLastChanged || user?.authProvider !== 'google') && !(user?.authProvider === 'google' && !user?.passwordLastChanged) && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('customer.settings.password')}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('customer.settings.lastChanged')}: {user?.passwordLastChanged ? new Date(user.passwordLastChanged).toLocaleDateString() : t('customer.settings.never')}
                              </p>
                            </div>
                            <button
                              onClick={() => setShowChangePasswordModal(true)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                              <KeyIcon className="w-4 h-4 mr-2" />
                              {t('customer.settings.changePassword')}
                            </button>
                          </div>

                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <p className="font-medium mb-2">{t('customer.settings.passwordRequirements')}:</p>
                            <ul className="space-y-1 text-xs">
                              <li>• {t('customer.settings.passwordReq1')}</li>
                              <li>• {t('customer.settings.passwordReq2')}</li>
                              <li>• {t('customer.settings.passwordReq3')}</li>
                              <li>• {t('customer.settings.passwordReq4')}</li>
                              <li>• {t('customer.settings.passwordReq5')}</li>
                              <li>• {t('customer.settings.passwordReq6')}</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Account Recovery */}
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                        {t('customer.settings.accountRecovery')}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {t('customer.settings.recoveryEmail')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user?.email || t('customer.settings.notSet')}
                            </p>
                          </div>
                          <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                            {t('common.update')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                <div id="notifications" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <BellIcon className="w-5 h-5 mr-2" />
                      {t('settings.notifications')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.notificationsDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    <ToggleSwitch
                      enabled={settings.notifications.emailNotifications}
                      onChange={(value) => handleSettingChange('notifications', 'emailNotifications', value)}
                      label={t('settings.emailNotifications')}
                      description={t('settings.emailNotificationsDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.notifications.smsNotifications}
                      onChange={(value) => handleSettingChange('notifications', 'smsNotifications', value)}
                      label={t('settings.smsNotifications')}
                      description={t('settings.smsNotificationsDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.notifications.pushNotifications}
                      onChange={(value) => handleSettingChange('notifications', 'pushNotifications', value)}
                      label={t('settings.pushNotifications')}
                      description={t('settings.pushNotificationsDesc')}
                    />
                    {/* Web Push Subscription Toggle */}
                    {isPushSupported && (
                      <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {language === 'uk' ? 'Браузерні push-сповіщення' : language === 'ru' ? 'Браузерные push-уведомления' : 'Browser Push Notifications'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {language === 'uk' ? 'Отримуйте сповіщення навіть коли браузер згорнуто' : language === 'ru' ? 'Получайте уведомления даже когда браузер свёрнут' : 'Receive notifications even when the browser is minimized'}
                            </p>
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
                    <ToggleSwitch
                      enabled={settings.notifications.newBookingAlert}
                      onChange={(value) => handleSettingChange('notifications', 'newBookingAlert', value)}
                      label={t('settings.newBookingAlert')}
                      description={t('settings.newBookingAlertDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.notifications.bookingReminders}
                      onChange={(value) => handleSettingChange('notifications', 'bookingReminders', value)}
                      label={t('settings.bookingReminders')}
                      description={t('settings.bookingRemindersDesc')}
                    />
                  </div>
                </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                <div id="privacy" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <ShieldCheckIcon className="w-5 h-5 mr-2" />
                      {t('settings.privacy')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.privacyDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    <ToggleSwitch
                      enabled={settings.privacy.showPhoneNumber}
                      onChange={(value) => handleSettingChange('privacy', 'showPhoneNumber', value)}
                      label={t('settings.showPhoneNumber')}
                      description={t('settings.showPhoneNumberDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.privacy.showEmail}
                      onChange={(value) => handleSettingChange('privacy', 'showEmail', value)}
                      label={t('settings.showEmail')}
                      description={t('settings.showEmailDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.privacy.allowDirectMessages}
                      onChange={(value) => handleSettingChange('privacy', 'allowDirectMessages', value)}
                      label={t('settings.allowDirectMessages')}
                      description={t('settings.allowDirectMessagesDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.privacy.dataProcessingConsent}
                      onChange={(value) => handleSettingChange('privacy', 'dataProcessingConsent', value)}
                      label={t('settings.dataProcessingConsent')}
                      description={t('settings.dataProcessingConsentDesc')}
                    />
                  </div>
                </div>
                )}

                {/* Business Settings */}
                {activeTab === 'business' && (
                <div id="business" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <CreditCardIcon className="w-5 h-5 mr-2" />
                      {t('settings.business')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.businessDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    <ToggleSwitch
                      enabled={settings.business.acceptOnlinePayments}
                      onChange={(value) => handleSettingChange('business', 'acceptOnlinePayments', value)}
                      label={t('settings.acceptOnlinePayments')}
                      description={t('settings.acceptOnlinePaymentsDesc')}
                    />
                    <ToggleSwitch
                      enabled={settings.business.requireDeposit}
                      onChange={(value) => handleSettingChange('business', 'requireDeposit', value)}
                      label={t('settings.requireDeposit')}
                      description={t('settings.requireDepositDesc')}
                    />
                    
                    {/* Cancellation Window Setting */}
                    <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('settings.cancellationWindow')}
                      </label>
                      <select
                        value={settings.business.cancellationWindow}
                        onChange={(e) => handleSettingChange('business', 'cancellationWindow', parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={2}>{t('settings.hours2')}</option>
                        <option value={6}>{t('settings.hours6')}</option>
                        <option value={12}>{t('settings.hours12')}</option>
                        <option value={24}>{t('settings.hours24')}</option>
                        <option value={48}>{t('settings.hours48')}</option>
                      </select>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('settings.cancellationWindowDesc')}
                      </p>
                    </div>
                  </div>
                </div>
                )}

                {/* Language & Currency Settings */}
                {activeTab === 'language' && (
                <div id="language" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <GlobeAltIcon className="w-5 h-5 mr-2" />
                      {t('settings.language')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.languageDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('settings.interfaceLanguage')}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'uk' | 'ru' | 'en')}
                        className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="uk">🇺🇦 Українська</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="ru">🇷🇺 Русский</option>
                      </select>
                    </div>
                    
                    <div className="py-4">
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('settings.currency')}
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'UAH' | 'USD' | 'EUR')}
                        className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="UAH">₴ {t('currency.uah')}</option>
                        <option value="USD">$ {t('currency.usd')}</option>
                        <option value="EUR">€ {t('currency.eur')}</option>
                      </select>
                    </div>
                  </div>
                </div>
                )}

                {/* Save Button */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <div className="flex justify-end space-x-3">
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className={`px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSaving ? (t('common.saving') || 'Saving...') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>

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

export default SpecialistSettings;
