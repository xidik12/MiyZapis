import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProfessionDropdown } from '@/components/ui/ProfessionDropdown';
import {
  BriefcaseIcon,
  AcademicCapIcon,
  GlobeIcon as GlobeAltIcon,
  StarIcon,
  PlusIcon,
  XCircleIcon,
  WarningIcon as ExclamationTriangleIcon,
} from '@/components/icons';
import type { SpecialistProfile } from '@/hooks/useSpecialistProfile';

interface ProfessionalTabProps {
  profile: SpecialistProfile;
  onProfileChange: (field: string, value: unknown) => void;
  validationErrors: Record<string, string>;
  saving: boolean;
  onSave: () => Promise<void>;
}

const AVAILABLE_LANGUAGES = [
  { code: 'uk', label: 'Українська' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
] as const;

const LANGUAGE_DISPLAY: Record<string, string> = {
  uk: 'Українська',
  en: 'English',
  ru: 'Русский',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

const inputClassName =
  'w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200';

const ProfessionalTab: React.FC<ProfessionalTabProps> = ({
  profile,
  onProfileChange,
  validationErrors,
  saving,
  onSave,
}) => {
  const { t } = useLanguage();
  const [newSpecialty, setNewSpecialty] = useState('');

  // --- Languages ---
  const selectedLanguages: string[] = profile.languages || [];

  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    (lang) => !selectedLanguages.includes(lang.code)
  );

  const handleAddLanguage = (code: string) => {
    if (!selectedLanguages.includes(code)) {
      onProfileChange('languages', [...selectedLanguages, code]);
    }
  };

  const handleRemoveLanguage = (code: string) => {
    onProfileChange(
      'languages',
      selectedLanguages.filter((l) => l !== code)
    );
  };

  // --- Specialties ---
  const specialties: string[] = profile.specialties || [];

  const handleAddSpecialty = () => {
    const trimmed = newSpecialty.trim();
    if (trimmed && !specialties.includes(trimmed)) {
      onProfileChange('specialties', [...specialties, trimmed]);
      setNewSpecialty('');
    }
  };

  const handleSpecialtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSpecialty();
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    onProfileChange(
      'specialties',
      specialties.filter((s) => s !== specialty)
    );
  };

  return (
    <div className="space-y-6">
      {/* Profession */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <BriefcaseIcon className="w-4 h-4 text-primary-500" />
          {t('specialist.profession') || 'Profession'}
        </label>
        <ProfessionDropdown
          value={profile.profession || ''}
          onChange={(value) => onProfileChange('profession', value)}
          onCustomProfession={(customValue) =>
            onProfileChange('profession', customValue)
          }
          placeholder={
            t('professionForm.selectProfession') || 'Select a profession'
          }
          error={validationErrors.profession}
          allowCustom={true}
        />
        {validationErrors.profession && (
          <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {validationErrors.profession}
          </p>
        )}
      </div>

      {/* Years of Experience */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <BriefcaseIcon className="w-4 h-4 text-primary-500" />
          {t('specialist.experience') || 'Years of Experience'}
        </label>
        <input
          type="number"
          min={0}
          max={50}
          value={profile.experience ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onProfileChange(
              'experience',
              val === '' ? '' : Math.min(50, Math.max(0, Number(val)))
            );
          }}
          placeholder="0"
          className={`${inputClassName} ${
            validationErrors.experience
              ? 'border-red-500 dark:border-red-500'
              : ''
          }`}
        />
        {validationErrors.experience && (
          <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {validationErrors.experience}
          </p>
        )}
      </div>

      {/* Education */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <AcademicCapIcon className="w-4 h-4 text-primary-500" />
          {t('specialistProfile.education') || 'Education'}
        </label>
        <textarea
          rows={3}
          value={profile.education || ''}
          onChange={(e) => onProfileChange('education', e.target.value)}
          placeholder={
            t('specialistProfile.educationPlaceholder') ||
            'Describe your education background...'
          }
          className={`${inputClassName} resize-none ${
            validationErrors.education
              ? 'border-red-500 dark:border-red-500'
              : ''
          }`}
        />
        {validationErrors.education && (
          <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {validationErrors.education}
          </p>
        )}
      </div>

      {/* Languages */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <GlobeAltIcon className="w-4 h-4 text-primary-500" />
          {t('specialist.languages') || 'Languages'}
        </label>

        {/* Selected language tags */}
        {selectedLanguages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedLanguages.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium"
              >
                {LANGUAGE_DISPLAY[code] || code}
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(code)}
                  className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-200 transition-colors"
                  aria-label={`${t('common.remove') || 'Remove'} ${LANGUAGE_DISPLAY[code] || code}`}
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dropdown to add a language */}
        {availableToAdd.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                handleAddLanguage(e.target.value);
              }
            }}
            className={inputClassName}
          >
            <option value="">
              {t('specialist.addLanguage') || '+ Add language...'}
            </option>
            {availableToAdd.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        )}

        {validationErrors.languages && (
          <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {validationErrors.languages}
          </p>
        )}
      </div>

      {/* Specialties */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <StarIcon className="w-4 h-4 text-primary-500" />
          {t('specialist.specialties') || 'Specialties'}
        </label>

        {/* Specialty tags */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {specialties.map((specialty) => (
              <span
                key={specialty}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium"
              >
                {specialty}
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(specialty)}
                  className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 transition-colors"
                  aria-label={`${t('common.remove') || 'Remove'} ${specialty}`}
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input + Add button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            onKeyDown={handleSpecialtyKeyDown}
            placeholder={
              t('specialist.addSpecialtyPlaceholder') ||
              'Enter a specialty...'
            }
            className={`flex-1 ${inputClassName}`}
          />
          <button
            type="button"
            onClick={handleAddSpecialty}
            disabled={!newSpecialty.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <PlusIcon className="w-4 h-4" />
            {t('common.add') || 'Add'}
          </button>
        </div>

        {validationErrors.specialties && (
          <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {validationErrors.specialties}
          </p>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
        >
          {saving
            ? t('common.loading') || 'Saving...'
            : t('common.saveChanges') || 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ProfessionalTab;
