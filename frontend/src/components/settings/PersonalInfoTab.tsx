import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LocationPicker } from '@/components/LocationPicker';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@/components/icons';
import { WarningIcon as ExclamationTriangleIcon } from '@/components/icons';
import type { SpecialistProfile } from '@/hooks/useSpecialistProfile';

interface PersonalInfoTabProps {
  profile: SpecialistProfile;
  onProfileChange: (field: string, value: unknown) => void;
  validationErrors: Record<string, string>;
  saving: boolean;
  onSave: () => Promise<void>;
}

const inputClassName =
  'w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200';

const inputErrorClassName =
  'w-full px-4 py-3 rounded-xl border border-error-300 dark:border-error-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-error-500 focus:ring-error-500 transition-all duration-200';

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  profile,
  onProfileChange,
  validationErrors,
  saving,
  onSave,
}) => {
  const { language, t } = useLanguage();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCircleIcon className="h-7 w-7 text-primary-500" />
            {language === 'uk'
              ? 'Особиста інформація'
              : language === 'ru'
                ? 'Личная информация'
                : 'Personal Information'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'uk'
              ? 'Основні дані вашого профілю'
              : language === 'ru'
                ? 'Основные данные вашего профиля'
                : 'Basic information about you'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* First Name / Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'uk' ? "Ім'я *" : language === 'ru' ? 'Имя *' : 'First Name *'}
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={profile.firstName || ''}
              onChange={(e) => onProfileChange('firstName', e.target.value)}
              autoComplete="given-name"
              className={validationErrors.firstName ? inputErrorClassName : inputClassName}
              placeholder={
                language === 'uk'
                  ? "Введіть ім'я"
                  : language === 'ru'
                    ? 'Введите имя'
                    : 'Enter first name'
              }
            />
            {validationErrors.firstName && (
              <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {validationErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'uk'
                ? 'Прізвище *'
                : language === 'ru'
                  ? 'Фамилия *'
                  : 'Last Name *'}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={profile.lastName || ''}
              onChange={(e) => onProfileChange('lastName', e.target.value)}
              autoComplete="family-name"
              className={validationErrors.lastName ? inputErrorClassName : inputClassName}
              placeholder={
                language === 'uk'
                  ? 'Введіть прізвище'
                  : language === 'ru'
                    ? 'Введите фамилию'
                    : 'Enter last name'
              }
            />
            {validationErrors.lastName && (
              <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {validationErrors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email / Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'uk'
                ? 'Електронна пошта *'
                : language === 'ru'
                  ? 'Электронная почта *'
                  : 'Email *'}
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email || ''}
                onChange={(e) => onProfileChange('email', e.target.value)}
                autoComplete="email"
                className={`pl-11 pr-4 ${
                  validationErrors.email
                    ? 'py-3 rounded-xl border border-error-300 dark:border-error-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-error-500 focus:ring-error-500 transition-all duration-200 w-full'
                    : 'py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200 w-full'
                }`}
                placeholder={
                  language === 'uk'
                    ? 'example@email.com'
                    : language === 'ru'
                      ? 'example@email.com'
                      : 'example@email.com'
                }
              />
            </div>
            {validationErrors.email && (
              <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'uk' ? 'Телефон' : language === 'ru' ? 'Телефон' : 'Phone'}
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => onProfileChange('phone', e.target.value)}
                autoComplete="tel"
                className={`pl-11 pr-4 ${
                  validationErrors.phone
                    ? 'py-3 rounded-xl border border-error-300 dark:border-error-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-error-500 focus:ring-error-500 transition-all duration-200 w-full'
                    : 'py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200 w-full'
                }`}
                placeholder="+380 XX XXX XXXX"
              />
            </div>
            {validationErrors.phone && (
              <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {validationErrors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {language === 'uk' ? 'Про себе' : language === 'ru' ? 'О себе' : 'Bio'}
          </label>
          <textarea
            id="bio"
            name="bio"
            value={profile.bio || ''}
            onChange={(e) => onProfileChange('bio', e.target.value)}
            rows={4}
            className={`${inputClassName} resize-none`}
            placeholder={
              language === 'uk'
                ? 'Розкажіть про себе...'
                : language === 'ru'
                  ? 'Расскажите о себе...'
                  : 'Tell us about yourself...'
            }
          />
        </div>

        {/* Location Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPinIcon className="inline h-4 w-4 mr-1 text-gray-400" />
            {language === 'uk'
              ? 'Розташування'
              : language === 'ru'
                ? 'Местоположение'
                : 'Location'}
          </label>
          <LocationPicker
            location={profile.location || { address: '', city: '', region: '', country: '' }}
            onLocationChange={(newLocation) => onProfileChange('location', newLocation)}
            className="border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600"
          />
        </div>

        {/* Contact Information for Confirmed Bookings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Precise Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.preciseAddress') ||
                'Precise Address (Shown only to confirmed customers)'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.preciseAddress || ''}
              onChange={(e) => onProfileChange('preciseAddress', e.target.value)}
              placeholder={
                t('specialist.preciseAddressPlaceholder') ||
                'Apt 5B, Building A, 123 Main Street'
              }
              className={
                validationErrors.preciseAddress ? inputErrorClassName : inputClassName
              }
            />
            {validationErrors.preciseAddress && (
              <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {validationErrors.preciseAddress}
              </p>
            )}
          </div>

          {/* Business Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.businessPhone') || 'Business Phone'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={profile.businessPhone || ''}
              onChange={(e) => onProfileChange('businessPhone', e.target.value)}
              placeholder={t('specialist.phonePlaceholder') || '+1 (555) 123-4567'}
              className={
                validationErrors.businessPhone ? inputErrorClassName : inputClassName
              }
            />
            {validationErrors.businessPhone && (
              <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {validationErrors.businessPhone}
              </p>
            )}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.whatsappNumber') || 'WhatsApp Number'} (
              {t('common.optional') || 'Optional'})
            </label>
            <input
              type="tel"
              value={profile.whatsappNumber || ''}
              onChange={(e) => onProfileChange('whatsappNumber', e.target.value)}
              placeholder={t('specialist.phonePlaceholder') || '+1 (555) 123-4567'}
              className={inputClassName}
            />
          </div>

          {/* Location Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.locationNotes') || 'Location Notes'}
            </label>
            <textarea
              value={profile.locationNotes || ''}
              onChange={(e) => onProfileChange('locationNotes', e.target.value)}
              placeholder={
                t('specialist.locationNotesPlaceholder') ||
                'Special instructions for finding the location...'
              }
              rows={3}
              className={`${inputClassName} resize-none`}
            />
          </div>

          {/* Parking Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.parkingInfo') || 'Parking Information'}
            </label>
            <textarea
              value={profile.parkingInfo || ''}
              onChange={(e) => onProfileChange('parkingInfo', e.target.value)}
              placeholder={
                t('specialist.parkingInfoPlaceholder') ||
                'Parking instructions, costs, restrictions...'
              }
              rows={3}
              className={`${inputClassName} resize-none`}
            />
          </div>

          {/* Access Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.accessInstructions') || 'Access Instructions'}
            </label>
            <textarea
              value={profile.accessInstructions || ''}
              onChange={(e) => onProfileChange('accessInstructions', e.target.value)}
              placeholder={
                t('specialist.accessInstructionsPlaceholder') ||
                'Building access codes, buzzer instructions, etc...'
              }
              rows={3}
              className={`${inputClassName} resize-none`}
            />
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {language === 'uk'
                  ? 'Повідомлення про конфіденційність'
                  : language === 'ru'
                    ? 'Уведомление о конфиденциальности'
                    : 'Privacy Notice'}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {language === 'uk'
                  ? 'Ця детальна контактна інформація буде надана клієнтам лише після підтвердження бронювання. Публічні профілі показуватимуть лише ваше загальне місто/район для захисту конфіденційності.'
                  : language === 'ru'
                    ? 'Эта подробная контактная информация будет предоставлена клиентам только после подтверждения бронирования. В публичных профилях будет отображаться только ваш общий город/район для защиты конфиденциальности.'
                    : 'This detailed contact information will only be shared with customers after their booking is confirmed. Public profiles will only show your general city/area for privacy protection.'}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            )}
            {saving
              ? language === 'uk'
                ? 'Збереження...'
                : language === 'ru'
                  ? 'Сохранение...'
                  : 'Saving...'
              : language === 'uk'
                ? 'Зберегти зміни'
                : language === 'ru'
                  ? 'Сохранить изменения'
                  : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
