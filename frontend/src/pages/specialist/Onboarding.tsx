import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, updateUserProfile, getCurrentUser } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
// serviceService imported for potential future category loading
// import { serviceService } from '../../services/service.service';
import { fileUploadService } from '../../services/fileUpload.service';
import { isFeatureEnabled } from '../../config/features';
import { ProfessionDropdown } from '../../components/ui/ProfessionDropdown';
import { CategoryDropdown } from '../../components/ui/CategoryDropdown';
import { logger } from '@/utils/logger';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BasicInfoData {
  profession: string;
  customProfession: string;
  bio: string;
  phone: string;
}

interface ServiceData {
  name: string;
  description: string;
  duration: string;
  price: string;
  currency: string;
  category: string;
  customCategory: string;
}

interface ScheduleDay {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

type WeekSchedule = {
  [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: ScheduleDay;
};

// ---------------------------------------------------------------------------
// Step slide animation variants
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const SpecialistOnboarding: React.FC = () => {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  // Current step (0-indexed internally, displayed 1-indexed)
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const totalSteps = 5;

  // Loading / error
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ------ Step 1: Basic Info ------
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    profession: '',
    customProfession: '',
    bio: '',
    phone: user?.phoneNumber || '',
  });
  const [basicErrors, setBasicErrors] = useState<Record<string, string>>({});

  // ------ Step 2: First Service ------
  const [serviceData, setServiceData] = useState<ServiceData>({
    name: '',
    description: '',
    duration: '60',
    price: '',
    currency: currency || 'UAH',
    category: '',
    customCategory: '',
  });
  const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});

  // ------ Step 3: Availability ------
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    saturday: { enabled: false, startTime: '10:00', endTime: '15:00' },
    sunday: { enabled: false, startTime: '10:00', endTime: '15:00' },
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // ------ Step 4: Avatar ------
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ------ Onboarding complete tracking ------
  const [profileSaved, setProfileSaved] = useState(false);
  const [serviceSaved, setServiceSaved] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // Pre-fill from existing profile if available
  useEffect(() => {
    if (user) {
      setBasicInfo((prev) => ({
        ...prev,
        phone: user.phoneNumber || prev.phone,
      }));
    }
  }, [user]);

  // -----------------------------------------------------------------------
  // Validation helpers
  // -----------------------------------------------------------------------

  const validateBasicInfo = (): boolean => {
    const errors: Record<string, string> = {};
    const profession = basicInfo.customProfession || basicInfo.profession;
    if (!profession.trim()) {
      errors.profession = t('onboarding.professionRequired') || 'Please select or enter your profession';
    }
    if (!basicInfo.bio.trim() || basicInfo.bio.trim().length < 10) {
      errors.bio = t('onboarding.bioRequired') || 'Please write a short bio (at least 10 characters)';
    }
    if (!basicInfo.phone.trim()) {
      errors.phone = t('onboarding.phoneRequired') || 'Phone number is required';
    }
    setBasicErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateService = (): boolean => {
    const errors: Record<string, string> = {};
    if (!serviceData.name.trim() || serviceData.name.trim().length < 3) {
      errors.name = t('onboarding.serviceNameRequired') || 'Service name must be at least 3 characters';
    }
    if (!serviceData.description.trim() || serviceData.description.trim().length < 10) {
      errors.description = t('onboarding.serviceDescRequired') || 'Description must be at least 10 characters';
    }
    const dur = parseInt(serviceData.duration);
    if (!serviceData.duration || isNaN(dur) || dur < 15) {
      errors.duration = t('onboarding.durationMin') || 'Duration must be at least 15 minutes';
    }
    const price = parseFloat(serviceData.price);
    if (!serviceData.price || isNaN(price) || price <= 0) {
      errors.price = t('onboarding.priceRequired') || 'Price must be greater than 0';
    }
    const cat = serviceData.customCategory || serviceData.category;
    if (!cat.trim()) {
      errors.category = t('onboarding.categoryRequired') || 'Please select or enter a category';
    }
    setServiceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSchedule = (): boolean => {
    const hasAtLeastOneDay = Object.values(schedule).some((d) => d.enabled);
    if (!hasAtLeastOneDay) {
      setScheduleError(t('onboarding.scheduleRequired') || 'Please enable at least one working day');
      return false;
    }
    setScheduleError(null);
    return true;
  };

  // -----------------------------------------------------------------------
  // Save helpers
  // -----------------------------------------------------------------------

  const saveBasicInfo = async () => {
    if (!validateBasicInfo()) return false;
    setSaving(true);
    setError(null);
    try {
      const profession = basicInfo.customProfession || basicInfo.profession;

      if (isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
        await specialistService.updateProfile({
          profession,
          bio: basicInfo.bio,
          phone: basicInfo.phone,
        } as any);
      }

      // Update redux
      dispatch(updateUserProfile({ phoneNumber: basicInfo.phone } as any));
      setProfileSaved(true);
      return true;
    } catch (err: unknown) {
      const err = err instanceof Error ? err : new Error(String(err));
      logger.error('Onboarding: failed to save basic info', err);
      setError(err.message || 'Failed to save profile information');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveService = async () => {
    if (!validateService()) return false;
    setSaving(true);
    setError(null);
    try {
      if (isFeatureEnabled('ENABLE_SPECIALIST_SERVICES_API')) {
        const category = serviceData.customCategory || serviceData.category;
        await specialistService.createService({
          name: serviceData.name,
          description: serviceData.description,
          duration: parseInt(serviceData.duration),
          basePrice: parseFloat(serviceData.price),
          currency: serviceData.currency,
          category,
          isActive: true,
        } as any);
      }
      setServiceSaved(true);
      return true;
    } catch (err: unknown) {
      const err = err instanceof Error ? err : new Error(String(err));
      logger.error('Onboarding: failed to create service', err);
      setError(err.message || 'Failed to create service');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    if (!validateSchedule()) return false;
    setSaving(true);
    setError(null);
    try {
      if (isFeatureEnabled('ENABLE_SPECIALIST_SCHEDULE_API')) {
        // Build working hours object from the schedule
        const workingHours: Record<string, { isOpen: boolean; startTime: string; endTime: string }> = {};
        (Object.keys(schedule) as Array<keyof WeekSchedule>).forEach((day) => {
          workingHours[day] = {
            isOpen: schedule[day].enabled,
            startTime: schedule[day].startTime,
            endTime: schedule[day].endTime,
          };
        });

        // Save working hours via profile update
        await specialistService.updateProfile({
          workingHours,
        } as any);

        // Generate availability blocks for each enabled day (next 4 weeks)
        const enabledDays = (Object.keys(schedule) as Array<keyof WeekSchedule>).filter(
          (day) => schedule[day].enabled
        );

        if (enabledDays.length > 0) {
          // Attempt to generate from working hours if backend supports it
          try {
            await specialistService.generateAvailabilityFromWorkingHours();
          } catch (genErr) {
            logger.warn('Could not auto-generate availability blocks, creating manually', genErr);
            // Fallback: create individual blocks for the next 4 weeks
            const dayNameToNumber: Record<string, number> = {
              sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
              thursday: 4, friday: 5, saturday: 6,
            };

            const today = new Date();
            for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
              for (const day of enabledDays) {
                const targetDayNum = dayNameToNumber[day];
                const date = new Date(today);
                // Find next occurrence of this weekday
                const diff = (targetDayNum - date.getDay() + 7) % 7 + weekOffset * 7;
                date.setDate(date.getDate() + diff);

                if (date < today) continue; // skip past dates

                const dateStr = date.toISOString().split('T')[0];
                const startDateTime = `${dateStr}T${schedule[day].startTime}:00.000Z`;
                const endDateTime = `${dateStr}T${schedule[day].endTime}:00.000Z`;

                try {
                  await specialistService.createAvailabilityBlock({
                    startDateTime,
                    endDateTime,
                    isAvailable: true,
                    reason: 'Working hours',
                    recurring: true,
                    recurringDays: [day],
                  });
                } catch (blockErr) {
                  logger.warn(`Failed to create block for ${day} week ${weekOffset}`, blockErr);
                }
              }
            }
          }
        }
      }
      setScheduleSaved(true);
      return true;
    } catch (err: unknown) {
      const err = err instanceof Error ? err : new Error(String(err));
      logger.error('Onboarding: failed to save schedule', err);
      setError(err.message || 'Failed to save schedule');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAvatar = async () => {
    if (!avatarFile) return true; // Optional step, skip if no file
    setSaving(true);
    setError(null);
    try {
      if (isFeatureEnabled('ENABLE_FILE_UPLOADS')) {
        const result = await fileUploadService.uploadAvatar(avatarFile);
        // Update profile with new avatar URL
        if (isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
          await specialistService.updateProfile({ avatar: result.url } as any);
        }
        dispatch(updateUserProfile({ avatar: result.url } as any));
        dispatch(getCurrentUser());
      }
      return true;
    } catch (err: unknown) {
      const err = err instanceof Error ? err : new Error(String(err));
      logger.error('Onboarding: failed to upload avatar', err);
      setError(err.message || 'Failed to upload avatar');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  const goNext = async () => {
    setError(null);

    let success = true;

    // Validate and save the current step
    switch (step) {
      case 0:
        success = await saveBasicInfo();
        break;
      case 1:
        success = await saveService();
        break;
      case 2:
        success = await saveSchedule();
        break;
      case 3:
        success = await saveAvatar();
        break;
      case 4:
        // Done step -> go to dashboard
        navigate('/specialist/dashboard');
        return;
    }

    if (success && step < totalSteps - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    setError(null);
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const skipAvatar = () => {
    setError(null);
    setDirection(1);
    setStep(4);
  };

  // -----------------------------------------------------------------------
  // Avatar handling
  // -----------------------------------------------------------------------

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('onboarding.invalidImageType') || 'Please select a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('onboarding.imageTooLarge') || 'Image must be smaller than 5 MB');
      return;
    }

    setAvatarFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // -----------------------------------------------------------------------
  // Day label helper
  // -----------------------------------------------------------------------

  const dayLabel = (day: string): string => {
    const key = `schedule.${day}`;
    const translated = t(key);
    // If t() returns the key itself (no translation found), capitalize the day name
    if (translated === key) {
      return day.charAt(0).toUpperCase() + day.slice(1);
    }
    return translated;
  };

  // -----------------------------------------------------------------------
  // Render steps
  // -----------------------------------------------------------------------

  const renderProgressBar = () => (
    <div className="mb-8">
      {/* Step counter */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t('onboarding.step') || 'Step'} {step + 1} / {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
          {Math.round(((step + 1) / totalSteps) * 100)}%
        </span>
      </div>
      {/* Progress track */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full"
          initial={false}
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>
      {/* Step labels */}
      <div className="flex justify-between mt-2">
        {[
          t('onboarding.stepInfo') || 'Info',
          t('onboarding.stepService') || 'Service',
          t('onboarding.stepSchedule') || 'Schedule',
          t('onboarding.stepPhoto') || 'Photo',
          t('onboarding.stepDone') || 'Done',
        ].map((label, i) => (
          <span
            key={i}
            className={`text-xs font-medium ${
              i <= step
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );

  // ---------- Step 1: Welcome & Basic Info ----------
  const renderStepBasicInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('onboarding.welcomeTitle') || 'Welcome to MiyZapys!'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('onboarding.welcomeSubtitle') || "Let's set up your specialist profile in a few quick steps."}
        </p>
      </div>

      {/* Profession */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('onboarding.profession') || 'Your Profession / Specialty'} *
        </label>
        <ProfessionDropdown
          value={basicInfo.profession}
          onChange={(val) => {
            setBasicInfo((prev) => ({ ...prev, profession: val, customProfession: '' }));
            setBasicErrors((prev) => { const e = { ...prev }; delete e.profession; return e; });
          }}
          onCustomProfession={(val) => {
            setBasicInfo((prev) => ({ ...prev, customProfession: val, profession: val }));
            setBasicErrors((prev) => { const e = { ...prev }; delete e.profession; return e; });
          }}
          placeholder={t('onboarding.selectProfession') || 'Select your profession'}
          error={basicErrors.profession}
          allowCustom
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('onboarding.bio') || 'Short Bio / About You'} *
        </label>
        <textarea
          value={basicInfo.bio}
          onChange={(e) => {
            setBasicInfo((prev) => ({ ...prev, bio: e.target.value }));
            if (e.target.value.trim().length >= 10) {
              setBasicErrors((prev) => { const er = { ...prev }; delete er.bio; return er; });
            }
          }}
          placeholder={t('onboarding.bioPlaceholder') || 'Tell clients about yourself, your experience, and what makes you stand out...'}
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border ${
            basicErrors.bio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 resize-none`}
        />
        <div className="flex justify-between mt-1">
          {basicErrors.bio && <p className="text-sm text-red-500">{basicErrors.bio}</p>}
          <p className={`text-xs ml-auto ${basicInfo.bio.length > 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {basicInfo.bio.length}/500
          </p>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('onboarding.phone') || 'Phone Number'} *
        </label>
        <input
          type="tel"
          value={basicInfo.phone}
          onChange={(e) => {
            setBasicInfo((prev) => ({ ...prev, phone: e.target.value }));
            if (e.target.value.trim()) {
              setBasicErrors((prev) => { const er = { ...prev }; delete er.phone; return er; });
            }
          }}
          placeholder={t('onboarding.phonePlaceholder') || '+380 XX XXX XXXX'}
          className={`w-full px-4 py-3 rounded-xl border ${
            basicErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
        />
        {basicErrors.phone && <p className="mt-1 text-sm text-red-500">{basicErrors.phone}</p>}
      </div>
    </div>
  );

  // ---------- Step 2: First Service ----------
  const renderStepService = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('onboarding.serviceTitle') || 'Create Your First Service'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('onboarding.serviceSubtitle') || 'Define the service you offer so clients can start booking.'}
        </p>
      </div>

      {/* Service Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('serviceForm.serviceName') || 'Service Name'} *
        </label>
        <input
          type="text"
          value={serviceData.name}
          onChange={(e) => {
            setServiceData((prev) => ({ ...prev, name: e.target.value }));
            if (e.target.value.trim().length >= 3) {
              setServiceErrors((prev) => { const er = { ...prev }; delete er.name; return er; });
            }
          }}
          placeholder={t('serviceForm.serviceNamePlaceholder') || 'e.g., Haircut & Styling'}
          className={`w-full px-4 py-3 rounded-xl border ${
            serviceErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
        />
        {serviceErrors.name && <p className="mt-1 text-sm text-red-500">{serviceErrors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('serviceForm.description') || 'Description'} *
        </label>
        <textarea
          value={serviceData.description}
          onChange={(e) => {
            setServiceData((prev) => ({ ...prev, description: e.target.value }));
            if (e.target.value.trim().length >= 10) {
              setServiceErrors((prev) => { const er = { ...prev }; delete er.description; return er; });
            }
          }}
          placeholder={t('serviceForm.descriptionPlaceholder') || 'Describe what this service includes...'}
          rows={3}
          className={`w-full px-4 py-3 rounded-xl border ${
            serviceErrors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 resize-none`}
        />
        {serviceErrors.description && <p className="mt-1 text-sm text-red-500">{serviceErrors.description}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('serviceForm.category') || 'Category'} *
        </label>
        <CategoryDropdown
          value={serviceData.category}
          onChange={(val) => {
            setServiceData((prev) => ({ ...prev, category: val, customCategory: '' }));
            setServiceErrors((prev) => { const e = { ...prev }; delete e.category; return e; });
          }}
          onCustomCategory={(val) => {
            setServiceData((prev) => ({ ...prev, customCategory: val, category: val }));
            setServiceErrors((prev) => { const e = { ...prev }; delete e.category; return e; });
          }}
          placeholder={t('serviceForm.selectCategory') || 'Select a category'}
          error={serviceErrors.category}
          allowCustom
        />
      </div>

      {/* Price + Duration row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('serviceForm.price') || 'Price'} *
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={serviceData.price}
              onChange={(e) => {
                setServiceData((prev) => ({ ...prev, price: e.target.value }));
                const p = parseFloat(e.target.value);
                if (!isNaN(p) && p > 0) {
                  setServiceErrors((prev) => { const er = { ...prev }; delete er.price; return er; });
                }
              }}
              min="0"
              step="0.01"
              placeholder="0.00"
              className={`flex-1 px-4 py-3 rounded-xl border ${
                serviceErrors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
            />
            <select
              value={serviceData.currency}
              onChange={(e) => setServiceData((prev) => ({ ...prev, currency: e.target.value }))}
              className="px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
            >
              <option value="UAH">UAH</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          {serviceErrors.price && <p className="mt-1 text-sm text-red-500">{serviceErrors.price}</p>}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('serviceForm.duration') || 'Duration (minutes)'} *
          </label>
          <select
            value={serviceData.duration}
            onChange={(e) => {
              setServiceData((prev) => ({ ...prev, duration: e.target.value }));
              setServiceErrors((prev) => { const er = { ...prev }; delete er.duration; return er; });
            }}
            className={`w-full px-4 py-3 rounded-xl border ${
              serviceErrors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
          </select>
          {serviceErrors.duration && <p className="mt-1 text-sm text-red-500">{serviceErrors.duration}</p>}
        </div>
      </div>
    </div>
  );

  // ---------- Step 3: Availability ----------
  const renderStepSchedule = () => {
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('onboarding.scheduleTitle') || 'Set Your Availability'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('onboarding.scheduleSubtitle') || 'Choose which days you work and your business hours.'}
          </p>
        </div>

        {scheduleError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
            {scheduleError}
          </div>
        )}

        <div className="space-y-3">
          {dayKeys.map((day) => (
            <div
              key={day}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                schedule[day].enabled
                  ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              {/* Day toggle */}
              <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                <input
                  type="checkbox"
                  checked={schedule[day].enabled}
                  onChange={(e) => {
                    setSchedule((prev) => ({
                      ...prev,
                      [day]: { ...prev[day], enabled: e.target.checked },
                    }));
                    if (e.target.checked) setScheduleError(null);
                  }}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span
                  className={`text-sm font-medium ${
                    schedule[day].enabled
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {dayLabel(day)}
                </span>
              </label>

              {/* Time pickers */}
              {schedule[day].enabled && (
                <div className="flex items-center gap-2 sm:ml-auto">
                  <input
                    type="time"
                    value={schedule[day].startTime}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], startTime: e.target.value },
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <span className="text-gray-500 dark:text-gray-400 text-sm">-</span>
                  <input
                    type="time"
                    value={schedule[day].endTime}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], endTime: e.target.value },
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setSchedule((prev) => {
                const updated = { ...prev };
                (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).forEach((d) => {
                  updated[d] = { enabled: true, startTime: '09:00', endTime: '17:00' };
                });
                (['saturday', 'sunday'] as const).forEach((d) => {
                  updated[d] = { ...updated[d], enabled: false };
                });
                return updated;
              });
              setScheduleError(null);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t('onboarding.presetWeekdays') || 'Mon-Fri, 9-17'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSchedule((prev) => {
                const updated = { ...prev };
                (Object.keys(updated) as Array<keyof WeekSchedule>).forEach((d) => {
                  updated[d] = { enabled: true, startTime: '09:00', endTime: '18:00' };
                });
                return updated;
              });
              setScheduleError(null);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t('onboarding.presetAllDays') || 'Every day, 9-18'}
          </button>
        </div>
      </div>
    );
  };

  // ---------- Step 4: Avatar ----------
  const renderStepAvatar = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('onboarding.photoTitle') || 'Add a Profile Photo'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('onboarding.photoSubtitle') || 'A profile photo helps clients recognize and trust you. This step is optional.'}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {/* Preview circle */}
        <div className="relative">
          <div className="w-40 h-40 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
          {avatarPreview && (
            <button
              type="button"
              onClick={removeAvatar}
              className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
              title={t('common.remove') || 'Remove'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Upload button */}
        <div className="flex flex-col items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {avatarPreview
              ? (t('onboarding.changePhoto') || 'Change Photo')
              : (t('onboarding.uploadPhoto') || 'Upload Photo')
            }
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            JPEG, PNG, or WebP. Max 5 MB.
          </p>
        </div>
      </div>
    </div>
  );

  // ---------- Step 5: Done ----------
  const renderStepDone = () => (
    <div className="text-center space-y-6 py-4">
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="mx-auto w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
      >
        <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('onboarding.doneTitle') || "You're All Set!"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {t('onboarding.doneSubtitle') || 'Your profile is ready. Clients can now discover and book your services. You can always update your settings later.'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
        <div className={`p-4 rounded-xl border ${profileSaved ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
          <div className={`text-2xl mb-1 ${profileSaved ? 'text-green-600' : 'text-gray-400'}`}>
            {profileSaved ? (
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('onboarding.profileLabel') || 'Profile'}</p>
        </div>
        <div className={`p-4 rounded-xl border ${serviceSaved ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
          <div className={`text-2xl mb-1 ${serviceSaved ? 'text-green-600' : 'text-gray-400'}`}>
            {serviceSaved ? (
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('onboarding.serviceLabel') || 'Service'}</p>
        </div>
        <div className={`p-4 rounded-xl border ${scheduleSaved ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
          <div className={`text-2xl mb-1 ${scheduleSaved ? 'text-green-600' : 'text-gray-400'}`}>
            {scheduleSaved ? (
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('onboarding.scheduleLabel') || 'Schedule'}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <button
          onClick={() => navigate('/specialist/dashboard')}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {t('onboarding.goToDashboard') || 'Go to Dashboard'}
        </button>
        <button
          onClick={() => navigate('/specialist/services')}
          className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          {t('onboarding.manageServices') || 'Manage Services'}
        </button>
        <button
          onClick={() => navigate('/specialist/schedule')}
          className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          {t('onboarding.viewSchedule') || 'View Schedule'}
        </button>
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Determine which step render function to call
  // -----------------------------------------------------------------------

  const stepContent = [renderStepBasicInfo, renderStepService, renderStepSchedule, renderStepAvatar, renderStepDone];

  // -----------------------------------------------------------------------
  // Main return
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-start sm:items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8">
          {/* Progress */}
          {renderProgressBar()}

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* Animated step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {stepContent[step]()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          {step < totalSteps - 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* Back button */}
              <div>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={saving}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {t('common.back') || 'Back'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Skip button (only for avatar step) */}
                {step === 3 && (
                  <button
                    type="button"
                    onClick={skipAvatar}
                    disabled={saving}
                    className="px-5 py-2.5 text-gray-500 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {t('common.skip') || 'Skip'}
                  </button>
                )}

                {/* Next / Save button */}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={saving}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {saving
                    ? (t('common.saving') || 'Saving...')
                    : step === 3
                      ? (t('onboarding.uploadAndContinue') || 'Upload & Continue')
                      : (t('common.next') || 'Next')
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          {t('onboarding.footerHint') || 'You can update all of these settings later from your profile and settings pages.'}
        </p>
      </div>
    </div>
  );
};

export default SpecialistOnboarding;
