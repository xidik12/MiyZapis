import { useState, useEffect, useCallback, useRef } from 'react';
import { specialistService } from '../services/specialist.service';
import { userService } from '../services/user.service';
import { isFeatureEnabled } from '../config/features';
import { useAppSelector, useAppDispatch } from './redux';
import { selectUser, updateUserProfile } from '../store/slices/authSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '@/utils/logger';
import { toast } from 'react-toastify';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateIssued: string;
  expiryDate?: string;
  documentUrl?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  titleUk?: string;
  titleRu?: string;
  description: string;
  descriptionUk?: string;
  descriptionRu?: string;
  imageUrl: string;
  category: string;
  categoryUk?: string;
  categoryRu?: string;
  dateAdded: string;
}

export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  notes?: string;
}

export interface BusinessHours {
  monday: { isOpen: boolean; startTime: string; endTime: string };
  tuesday: { isOpen: boolean; startTime: string; endTime: string };
  wednesday: { isOpen: boolean; startTime: string; endTime: string };
  thursday: { isOpen: boolean; startTime: string; endTime: string };
  friday: { isOpen: boolean; startTime: string; endTime: string };
  saturday: { isOpen: boolean; startTime: string; endTime: string };
  sunday: { isOpen: boolean; startTime: string; endTime: string };
}

export interface NotificationSettings {
  emailBookings: boolean;
  emailReviews: boolean;
  emailMessages: boolean;
  pushBookings: boolean;
  pushReviews: boolean;
  pushMessages: boolean;
  smsBookings: boolean;
}

export interface PrivacySettings {
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
  allowDirectBooking: boolean;
  requireApproval: boolean;
}

export interface SpecialistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profession: string;
  bio: string;
  bioUk: string;
  bioRu: string;
  experience: number;
  education: string;
  educationUk: string;
  educationRu: string;
  certifications: Certification[];
  portfolio: PortfolioItem[];
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  serviceArea: {
    radius: number;
    cities: string[];
  };
  businessHours: BusinessHours;
  paymentMethods: string[];
  bankDetails: BankDetails;
  paymentQrCodeUrl: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  verification: {
    isVerified: boolean;
    verifiedDate: string;
    documentsSubmitted: string[];
  };
  socialMedia: {
    website?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  languages: string[];
  specialties: string[];
  preciseAddress?: string;
  businessPhone?: string;
  whatsappNumber?: string;
  locationNotes?: string;
  parkingInfo?: string;
  accessInstructions?: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_DAY = { isOpen: false, startTime: '09:00', endTime: '17:00' };

export const getEmptyProfile = (): SpecialistProfile => ({
  id: '1',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  profession: '',
  bio: '',
  bioUk: '',
  bioRu: '',
  experience: 0,
  education: '',
  educationUk: '',
  educationRu: '',
  certifications: [],
  portfolio: [],
  location: {
    address: '',
    city: '',
    region: '',
    country: '',
  },
  serviceArea: {
    radius: 0,
    cities: [],
  },
  businessHours: {
    monday: { ...DEFAULT_DAY },
    tuesday: { ...DEFAULT_DAY },
    wednesday: { ...DEFAULT_DAY },
    thursday: { ...DEFAULT_DAY },
    friday: { ...DEFAULT_DAY },
    saturday: { ...DEFAULT_DAY },
    sunday: { ...DEFAULT_DAY },
  },
  paymentMethods: [],
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swift: '',
    notes: '',
  },
  paymentQrCodeUrl: '',
  notifications: {
    emailBookings: false,
    emailReviews: false,
    emailMessages: false,
    pushBookings: false,
    pushReviews: false,
    pushMessages: false,
    smsBookings: false,
  },
  privacy: {
    showPhone: false,
    showEmail: false,
    showAddress: false,
    allowDirectBooking: false,
    requireApproval: true,
  },
  verification: {
    isVerified: false,
    verifiedDate: '',
    documentsSubmitted: [],
  },
  socialMedia: {
    website: '',
    instagram: '',
    facebook: '',
    linkedin: '',
  },
  languages: [],
  specialties: [],
  preciseAddress: '',
  businessPhone: '',
  whatsappNumber: '',
  locationNotes: '',
  parkingInfo: '',
  accessInstructions: '',
});

// ─── mergeProfileData ────────────────────────────────────────────────────────

/**
 * Safely parse a value that might be a JSON string, returning the parsed object
 * or the fallback if parsing fails or the value is falsy.
 */
const parseJsonField = (field: unknown, fallback: unknown): unknown => {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      logger.warn('Failed to parse JSON field:', field, e);
      return fallback;
    }
  }
  return field || fallback;
};

/**
 * Merge raw API data (which may contain JSON-stringified fields and a nested
 * `specialist` object) into a fully-typed SpecialistProfile with all defaults
 * filled in.
 */
export const mergeProfileData = (apiData: Record<string, unknown>): SpecialistProfile => {
  const defaultProfile = getEmptyProfile();

  logger.debug('mergeProfileData input:', apiData);

  // The backend may nest specialist data under an `specialist` key
  const specialist: Record<string, unknown> =
    (apiData?.specialist as Record<string, unknown>) || apiData;

  const result: SpecialistProfile = {
    ...defaultProfile,

    // Preserve the real specialist ID
    id: (specialist?.id as string) || defaultProfile.id,

    // User data (flat from apiData)
    firstName: (apiData?.firstName as string) || '',
    lastName: (apiData?.lastName as string) || '',
    email: (apiData?.email as string) || '',
    phone:
      (apiData?.phone as string) ||
      ((specialist?.user as Record<string, unknown>)?.phoneNumber as string) ||
      '',

    // Specialist data (from nested specialist object)
    profession: (specialist?.businessName as string) || '',
    bio: (specialist?.bio as string) || '',
    bioUk: (specialist?.bioUk as string) || '',
    bioRu: (specialist?.bioRu as string) || '',
    experience: (specialist?.experience as number) || 0,
    education: (specialist?.education as string) || '',
    educationUk: (specialist?.educationUk as string) || '',
    educationRu: (specialist?.educationRu as string) || '',

    // Location-related extra fields
    preciseAddress:
      (specialist?.preciseAddress as string) ||
      ((specialist?.location as Record<string, unknown>)?.preciseAddress as string) ||
      '',
    businessPhone:
      (specialist?.businessPhone as string) ||
      ((specialist?.location as Record<string, unknown>)?.businessPhone as string) ||
      '',
    whatsappNumber: (specialist?.whatsappNumber as string) || '',
    locationNotes: (specialist?.locationNotes as string) || '',
    parkingInfo: (specialist?.parkingInfo as string) || '',
    accessInstructions: (specialist?.accessInstructions as string) || '',

    // Location data from specialist
    location: {
      address: (specialist?.address as string) || '',
      city: (specialist?.city as string) || '',
      region: (specialist?.state as string) || '',
      country: (specialist?.country as string) || '',
      latitude: (specialist?.latitude as number) || undefined,
      longitude: (specialist?.longitude as number) || undefined,
    },

    // Parse backend JSON strings and ensure arrays are always arrays
    languages: Array.isArray(specialist?.languages)
      ? specialist.languages
      : (parseJsonField(specialist?.languages, []) as string[]),

    specialties: Array.isArray(specialist?.specialties)
      ? specialist.specialties
      : (parseJsonField(specialist?.specialties, []) as string[]),

    paymentMethods: Array.isArray(specialist?.paymentMethods)
      ? specialist.paymentMethods
      : (parseJsonField(specialist?.paymentMethods, []) as string[]),

    bankDetails: specialist?.bankDetails
      ? (parseJsonField(specialist.bankDetails, defaultProfile.bankDetails) as BankDetails)
      : defaultProfile.bankDetails,

    paymentQrCodeUrl: (specialist?.paymentQrCodeUrl as string) || '',

    certifications: Array.isArray(specialist?.certifications)
      ? specialist.certifications
      : (parseJsonField(specialist?.certifications, []) as Certification[]),

    portfolio: Array.isArray(specialist?.portfolio)
      ? specialist.portfolio
      : (parseJsonField(specialist?.portfolioImages, []) as PortfolioItem[]),

    // Parse business hours — prefer workingHours key (backend convention)
    businessHours: specialist?.workingHours
      ? (parseJsonField(specialist.workingHours, defaultProfile.businessHours) as BusinessHours)
      : specialist?.businessHours
        ? typeof specialist.businessHours === 'string'
          ? (parseJsonField(specialist.businessHours, defaultProfile.businessHours) as BusinessHours)
          : {
              ...defaultProfile.businessHours,
              ...(specialist.businessHours as Partial<BusinessHours>),
            }
        : defaultProfile.businessHours,

    // Parse service area from JSON string
    serviceArea: specialist?.serviceArea
      ? (parseJsonField(specialist.serviceArea, defaultProfile.serviceArea) as typeof defaultProfile.serviceArea)
      : defaultProfile.serviceArea,

    // Parse notification settings from JSON string
    notifications: specialist?.notifications
      ? (parseJsonField(specialist.notifications, defaultProfile.notifications) as NotificationSettings)
      : defaultProfile.notifications,

    // Parse privacy settings from JSON string
    privacy: specialist?.privacy
      ? (parseJsonField(specialist.privacy, defaultProfile.privacy) as PrivacySettings)
      : defaultProfile.privacy,

    // Parse social media from JSON string
    socialMedia: specialist?.socialMedia
      ? (parseJsonField(specialist.socialMedia, defaultProfile.socialMedia) as typeof defaultProfile.socialMedia)
      : defaultProfile.socialMedia,

    // Verification details
    verification: {
      ...defaultProfile.verification,
      isVerified: (specialist?.isVerified as boolean) || false,
      verifiedDate: specialist?.verifiedDate
        ? new Date(specialist.verifiedDate as string).toISOString().split('T')[0]
        : '',
      documentsSubmitted: parseJsonField(specialist?.documentsSubmitted, []) as string[],
    },
  };

  logger.debug('mergeProfileData result:', result);
  return result;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseSpecialistProfileReturn {
  profile: SpecialistProfile;
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  validationErrors: Record<string, string>;
  handleProfileChange: (field: string, value: unknown) => void;
  handleSave: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

export function useSpecialistProfile(): UseSpecialistProfileReturn {
  const { language } = useLanguage();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  const [profile, setProfile] = useState<SpecialistProfile>(getEmptyProfile());
  const [, setOriginalProfile] = useState<SpecialistProfile>(getEmptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Prevent re-loading immediately after a successful save
  const justSavedRef = useRef(false);

  // ── Load / Reload ────────────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    if (justSavedRef.current) {
      justSavedRef.current = false;
      return;
    }

    try {
      setLoading(true);
      logger.debug('Starting profile load, user:', user);

      if (user && isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
        logger.debug('API feature enabled, fetching specialist profile...');
        try {
          const specialistData = await specialistService.getProfile();
          logger.debug('Raw data from backend getProfile:', specialistData);

          const specialist =
            (specialistData as unknown as Record<string, unknown>).specialist || specialistData;
          logger.debug('Extracted specialist data:', specialist);

          const profileInput: Record<string, unknown> = {
            ...(specialist as Record<string, unknown>),
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
            profession: (specialist as Record<string, unknown>).businessName || '',
            bio: (specialist as Record<string, unknown>).bio || '',
            experience: (specialist as Record<string, unknown>).experience || 0,
            preciseAddress: (specialist as Record<string, unknown>).preciseAddress || '',
            businessPhone: (specialist as Record<string, unknown>).businessPhone || '',
            location: {
              address: (specialist as Record<string, unknown>).address || '',
              city: (specialist as Record<string, unknown>).city || '',
              region: (specialist as Record<string, unknown>).state || '',
              country: (specialist as Record<string, unknown>).country || '',
            },
            verification: {
              isVerified: (specialist as Record<string, unknown>).isVerified || false,
              verifiedDate:
                (specialist as Record<string, unknown>).isVerified &&
                (specialist as Record<string, unknown>).verifiedDate
                  ? (specialist as Record<string, unknown>).verifiedDate
                  : (specialist as Record<string, unknown>).isVerified
                    ? new Date().toISOString().split('T')[0]
                    : '',
              documentsSubmitted: [],
            },
          };

          logger.debug('Profile input before merge:', profileInput);
          const merged = mergeProfileData(profileInput);
          logger.debug('Final merged profile:', merged);

          setProfile(merged);
          setOriginalProfile(merged);
          logger.debug('Profile loaded successfully');
        } catch (specialistError) {
          logger.warn('Specialist API not available, using user data only:', specialistError);
          const basic = mergeProfileData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
          });
          setProfile(basic);
          setOriginalProfile(basic);
        }
      } else {
        const basic = mergeProfileData({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: user?.phoneNumber || '',
        });
        setProfile(basic);
        setOriginalProfile(basic);
      }
    } catch (error) {
      logger.error('Error loading profile:', error);
      toast.error(
        language === 'uk'
          ? 'Не вдалося завантажити профіль'
          : language === 'ru'
            ? 'Не удалось загрузить профиль'
            : 'Failed to load profile',
      );
    } finally {
      setLoading(false);
    }
  }, [user, language]);

  // Auto-load on mount / when user changes
  useEffect(() => {
    loadProfile();
  }, [user?.id, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Change handler ────────────────────────────────────────────────────────

  const handleProfileChange = useCallback(
    (field: string, value: unknown) => {
      logger.debug(`Profile field changed: ${field} =`, value);

      setProfile((prev) => ({ ...prev, [field]: value }));
      setHasUnsavedChanges(true);

      // Clear the validation error for the changed field
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [validationErrors],
  );

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!profile.firstName?.trim()) {
      errors.firstName =
        language === 'uk'
          ? "Ім'я обов'язкове"
          : language === 'ru'
            ? 'Имя обязательно'
            : 'First name is required';
    }

    if (!profile.lastName?.trim()) {
      errors.lastName =
        language === 'uk'
          ? "Прізвище обов'язкове"
          : language === 'ru'
            ? 'Фамилия обязательна'
            : 'Last name is required';
    }

    if (!profile.email?.trim()) {
      errors.email =
        language === 'uk'
          ? "Email обов'язковий"
          : language === 'ru'
            ? 'Email обязателен'
            : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email =
        language === 'uk'
          ? 'Невірний формат email'
          : language === 'ru'
            ? 'Неверный формат email'
            : 'Invalid email format';
    }

    if (!profile.profession?.trim()) {
      errors.profession =
        language === 'uk'
          ? "Професія обов'язкова"
          : language === 'ru'
            ? 'Профессия обязательна'
            : 'Profession is required';
    }

    // Phone format (optional field, validated only when provided)
    if (profile.phone?.trim() && !/^[\d\s\-+()]+$/.test(profile.phone)) {
      errors.phone =
        language === 'uk'
          ? 'Невірний формат телефону'
          : language === 'ru'
            ? 'Неверный формат телефона'
            : 'Invalid phone format';
    }

    // Precise address (required)
    if (!profile.preciseAddress?.trim()) {
      errors.preciseAddress =
        language === 'uk'
          ? "Точна адреса обов'язкова"
          : language === 'ru'
            ? 'Точный адрес обязателен'
            : 'Precise address is required';
    }

    // Business phone (required)
    if (!profile.businessPhone?.trim()) {
      errors.businessPhone =
        language === 'uk'
          ? "Робочий телефон обов'язковий"
          : language === 'ru'
            ? 'Рабочий телефон обязателен'
            : 'Business phone is required';
    } else if (!/^[\d\s\-+()]+$/.test(profile.businessPhone)) {
      errors.businessPhone =
        language === 'uk'
          ? 'Невірний формат телефону'
          : language === 'ru'
            ? 'Неверный формат телефона'
            : 'Invalid phone format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [profile, language]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validate()) {
      // Build a human-readable summary of which required fields are missing
      const fieldLabel = (field: string): string => {
        const labels: Record<string, Record<string, string>> = {
          uk: {
            firstName: "Ім'я",
            lastName: 'Прізвище',
            email: 'Email',
            profession: 'Професія',
            preciseAddress: 'Точна адреса',
            businessPhone: 'Робочий телефон',
          },
          ru: {
            firstName: 'Имя',
            lastName: 'Фамилия',
            email: 'Email',
            profession: 'Профессия',
            preciseAddress: 'Точный адрес',
            businessPhone: 'Рабочий телефон',
          },
          en: {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            profession: 'Profession',
            preciseAddress: 'Precise Address',
            businessPhone: 'Business Phone',
          },
        };
        const lang = language === 'uk' || language === 'ru' ? language : 'en';
        return labels[lang][field] || field;
      };

      // Re-read errors after validate() has set them
      setValidationErrors((currentErrors) => {
        const fields = Object.keys(currentErrors);
        if (fields.length > 0) {
          const prefix =
            language === 'uk'
              ? "Будь ласка, заповніть обов'язкові поля"
              : language === 'ru'
                ? 'Пожалуйста, заполните обязательные поля'
                : 'Please fill in the required fields';
          toast.error(`${prefix}: ${fields.map(fieldLabel).join(', ')}`);
        } else {
          toast.error(
            language === 'uk'
              ? 'Будь ласка, виправте помилки у формі'
              : language === 'ru'
                ? 'Пожалуйста, исправьте ошибки в форме'
                : 'Please fix the errors in the form',
          );
        }
        return currentErrors;
      });
      return;
    }

    try {
      setSaving(true);

      if (isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
        // ── Build the specialist payload ──────────────────────────────────
        const specialistData = {
          businessName: profile.profession || `${profile.firstName} ${profile.lastName}`,
          bio: profile.bio || '',
          bioUk: profile.bioUk || '',
          bioRu: profile.bioRu || '',
          education: profile.education || '',
          educationUk: profile.educationUk || '',
          educationRu: profile.educationRu || '',
          specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
          experience: profile.experience || 0,
          languages: Array.isArray(profile.languages) ? profile.languages : [],
          address: profile.location?.address || '',
          city: profile.location?.city || '',
          state: profile.location?.region || '',
          country: profile.location?.country || '',
          latitude: profile.location?.latitude || null,
          longitude: profile.location?.longitude || null,
          timezone: 'UTC',
          workingHours: profile.businessHours || {},
          preciseAddress: profile.preciseAddress || '',
          businessPhone: profile.businessPhone || '',
          whatsappNumber: profile.whatsappNumber || '',
          locationNotes: profile.locationNotes || '',
          parkingInfo: profile.parkingInfo || '',
          accessInstructions: profile.accessInstructions || '',
          paymentMethods: Array.isArray(profile.paymentMethods) ? profile.paymentMethods : [],
          bankDetails: profile.bankDetails || {},
          paymentQrCodeUrl: profile.paymentQrCodeUrl || null,
          serviceArea: profile.serviceArea || { radius: 0, cities: [] },
          notifications: profile.notifications || {},
          privacy: profile.privacy || {},
          socialMedia: profile.socialMedia || {},
          portfolioImages: Array.isArray(profile.portfolio) ? profile.portfolio : [],
          certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        };

        logger.debug('Sending specialist data to backend:', specialistData);

        // ── Attempt update, fall back to create if not found ─────────────
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updateResult = await specialistService.updateProfile(specialistData as any);
          logger.debug('Backend response for specialist update:', updateResult);
        } catch (updateError: unknown) {
          const errMsg =
            updateError instanceof Error ? updateError.message : String(updateError);
          logger.error('Update failed:', updateError);

          if (errMsg.includes('SPECIALIST_NOT_FOUND') || errMsg.includes('not found')) {
            logger.debug('Specialist profile not found, attempting to create...');
            try {
              await specialistService.createProfile(specialistData);
              logger.debug('Specialist profile created successfully');
            } catch (createError) {
              logger.error('Failed to create specialist profile:', createError);
              throw createError;
            }
          } else {
            throw updateError;
          }
        }

        // ── Update user basic info if changed ────────────────────────────
        if (
          user &&
          (user.firstName !== profile.firstName ||
            user.lastName !== profile.lastName ||
            user.phoneNumber !== profile.phone)
        ) {
          const userUpdateData = {
            firstName: profile.firstName?.trim() || '',
            lastName: profile.lastName?.trim() || '',
            phoneNumber: profile.phone?.trim() || undefined,
          };

          logger.debug('Updating user profile with data:', userUpdateData);

          try {
            await userService.updateProfile(userUpdateData);
            logger.debug('User profile updated successfully');
            dispatch(updateUserProfile(userUpdateData));
          } catch (userError) {
            logger.error('Failed to update user info:', userError);
            // Non-fatal — let the specialist save still succeed
          }
        }

        // ── Reload from API to pick up any server-side changes ──────────
        try {
          const apiData = await specialistService.getProfile();
          logger.debug('Profile data after save reload:', apiData);

          const specialist =
            (apiData as unknown as Record<string, unknown>).specialist || apiData;

          const updatedProfile = mergeProfileData({
            ...(specialist as Record<string, unknown>),
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: user?.phoneNumber || '',
            profession: (specialist as Record<string, unknown>).businessName || '',
            bio: (specialist as Record<string, unknown>).bio || '',
            experience: (specialist as Record<string, unknown>).experience || 0,
          });

          logger.debug('Merged profile after save:', updatedProfile);
          setProfile(updatedProfile);
          setOriginalProfile(updatedProfile);
        } catch (reloadError) {
          logger.warn('Failed to reload profile after save:', reloadError);
          // Still treat the save as successful; use the local copy
          setOriginalProfile(profile);
        }
      } else {
        // Feature flag disabled — just persist locally
        setOriginalProfile(profile);
      }

      setHasUnsavedChanges(false);
      setValidationErrors({});
      justSavedRef.current = true;

      toast.success(
        language === 'uk'
          ? 'Профіль успішно збережено!'
          : language === 'ru'
            ? 'Профиль успешно сохранен!'
            : 'Profile saved successfully!',
      );
    } catch (error) {
      logger.error('Error saving profile:', error);
      toast.error(
        language === 'uk'
          ? 'Не вдалося зберегти зміни'
          : language === 'ru'
            ? 'Не удалось сохранить изменения'
            : 'Failed to save changes',
      );
    } finally {
      setSaving(false);
    }
  }, [profile, user, language, dispatch, validate]);

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    profile,
    loading,
    saving,
    hasUnsavedChanges,
    validationErrors,
    handleProfileChange,
    handleSave,
    reloadProfile: loadProfile,
  };
}
