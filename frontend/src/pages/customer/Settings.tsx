import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
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
  PlusIcon
} from '@heroicons/react/24/outline';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  name: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const CustomerSettings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  
  // Get actual user data from Redux store
  const currentUser = useAppSelector(selectUser);
  const [user, setUser] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    avatar: currentUser?.avatar || '',
  });

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

  // Addresses - start with empty array for new users
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [activeSection, setActiveSection] = useState('account');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

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

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
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

  const handleSavePaymentMethod = (paymentData: any) => {
    // TODO: Integrate with payment API when backend is ready
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: paymentData.type,
      name: paymentData.name,
      last4: paymentData.last4 || '',
      isDefault: paymentMethods.length === 0, // First method becomes default
    };
    setPaymentMethods(prev => [...prev, newMethod]);
    setShowAddPaymentModal(false);
  };

  const handleSaveAddress = (addressData: any) => {
    // TODO: Integrate with address API when backend is ready
    const newAddress: Address = {
      id: Date.now().toString(),
      type: addressData.type,
      label: addressData.label,
      street: addressData.street,
      city: addressData.city,
      postalCode: addressData.postalCode,
      country: addressData.country,
      isDefault: addresses.length === 0, // First address becomes default
    };
    setAddresses(prev => [...prev, newAddress]);
    setShowAddAddressModal(false);
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
                  <div className="flex items-center mb-6">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <div className="ml-4">
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
                        {t('profile.changePhoto')}
                      </button>
                      <button className="ml-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
                        {t('common.remove')}
                      </button>
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

                  {/* Change Password */}
                  <div className="border-t pt-6">
                    <button
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    >
                      {t('customer.settings.changePassword')}
                    </button>
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
                            <p className="font-medium text-gray-900 dark:text-gray-100">{method.name}</p>
                            {method.expiryMonth && method.expiryYear && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                              </p>
                            )}
                            {method.isDefault && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                      <div key={address.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-start justify-between">
                        <div className="flex items-start">
                          <MapPinIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mr-3 mt-1" />
                          <div>
                            <div className="flex items-center mb-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100 mr-2">{address.label}</p>
                              {address.isDefault && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{address.street}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Add Payment Method
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Type
                  </label>
                  <select 
                    name="paymentType"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="card">Bank Card</option>
                    <option value="privat">PrivatBank</option>
                    <option value="mono">Monobank</option>
                    <option value="ukrsib">UkrSibbank</option>
                    <option value="oschadbank">Oschadbank</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Card Name
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    placeholder="Visa •••• 4242"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    onChange={(e) => {
                      // Format card number with spaces
                      let value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                      e.target.value = value;
                    }}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Add Address
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleSaveAddress({
                type: formData.get('addressType'),
                label: formData.get('label'),
                street: formData.get('street'),
                city: formData.get('city'),
                postalCode: formData.get('postalCode'),
                country: formData.get('country') || 'Ukraine'
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Type
                  </label>
                  <select 
                    name="addressType"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Label
                  </label>
                  <input
                    type="text"
                    name="label"
                    placeholder="Home"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    placeholder="вул. Хрещатик, 1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Київ"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="01001"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select 
                    name="country"
                    defaultValue="Ukraine"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Ukraine">Ukraine</option>
                    <option value="Poland">Poland</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSettings;
