import React, { useState, useEffect, useRef } from 'react';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, updateUserProfile } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
import { userService } from '../../services/user.service';
import { fileUploadService } from '../../services/fileUpload.service';
import { isFeatureEnabled } from '../../config/features';
import { ProfessionDropdown } from '../../components/ui/ProfessionDropdown';
import { LocationPicker } from '../../components/LocationPicker';
import { getAbsoluteImageUrl } from '../../utils/imageUrl';
import { logger } from '@/utils/logger';
import OptimizedImage from '../../components/ui/OptimizedImage';
import { Avatar } from '../../components/ui/Avatar';
import AutoMigrateAvatar from '../../components/AutoMigrateAvatar';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, EyeIcon, PencilSquareIcon, UserCircleIcon, MapPinIcon, ClockIcon, CreditCardIcon, GlobeAltIcon, AcademicCapIcon, StarIcon, PhotoIcon, DocumentCheckIcon, PhoneIcon, EnvelopeIcon, BriefcaseIcon, BuildingOfficeIcon, CameraIcon, TrashIcon, PlusIcon, ArrowDownTrayIcon, Cog6ToothIcon, ShieldCheckIcon } from '@/components/icons';

interface SpecialistProfile {
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
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateIssued: string;
  expiryDate?: string;
  documentUrl?: string;
}

interface PortfolioItem {
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

interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  notes?: string;
}

interface BusinessHours {
  monday: { isOpen: boolean; startTime: string; endTime: string; };
  tuesday: { isOpen: boolean; startTime: string; endTime: string; };
  wednesday: { isOpen: boolean; startTime: string; endTime: string; };
  thursday: { isOpen: boolean; startTime: string; endTime: string; };
  friday: { isOpen: boolean; startTime: string; endTime: string; };
  saturday: { isOpen: boolean; startTime: string; endTime: string; };
  sunday: { isOpen: boolean; startTime: string; endTime: string; };
}

interface NotificationSettings {
  emailBookings: boolean;
  emailReviews: boolean;
  emailMessages: boolean;
  pushBookings: boolean;
  pushReviews: boolean;
  pushMessages: boolean;
  smsBookings: boolean;
}

interface PrivacySettings {
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
  allowDirectBooking: boolean;
  requireApproval: boolean;
}

const getEmptyProfile = (): SpecialistProfile => ({
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
    monday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
    tuesday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
    wednesday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
    thursday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
    friday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
    saturday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
    sunday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
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
});

// Safe merge function that ensures all required fields exist
const mergeProfileData = (apiData: any): SpecialistProfile => {
  const defaultProfile = getEmptyProfile();
  
  logger.debug('🔄 mergeProfileData input:', apiData);
  logger.debug('🔄 defaultProfile:', defaultProfile);
  
  // Extract specialist data from nested structure
  const specialist = apiData?.specialist || apiData;
  
  // Parse JSON strings if they exist (backend stores some fields as JSON strings)
  const parseJsonField = (field: any, fallback: any) => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        logger.warn('⚠️ Failed to parse JSON field:', field, e);
        return fallback;
      }
    }
    return field || fallback;
  };
  
  const result = {
    ...defaultProfile,
    // Preserve the real specialist ID
    id: specialist?.id || defaultProfile.id,
    // User data (flat from apiData)
    firstName: apiData?.firstName || '',
    lastName: apiData?.lastName || '',
    email: apiData?.email || '',
    phone: apiData?.phone || specialist?.user?.phoneNumber || '',
    // Specialist data (from nested specialist object)
    profession: specialist?.businessName || '',
    bio: specialist?.bio || '',
    experience: specialist?.experience || 0,
    education: specialist?.education || '',
    preciseAddress: specialist?.preciseAddress || specialist?.location?.preciseAddress || '',
    businessPhone: specialist?.businessPhone || specialist?.location?.businessPhone || '',
    // Location data from specialist
    location: {
      address: specialist?.address || '',
      city: specialist?.city || '',
      region: specialist?.state || '',
      country: specialist?.country || '',
    },
    // Parse backend JSON strings and ensure arrays are always arrays
    languages: Array.isArray(specialist?.languages) ? specialist.languages : parseJsonField(specialist?.languages, []),
    specialties: Array.isArray(specialist?.specialties) ? specialist.specialties : parseJsonField(specialist?.specialties, []),
    paymentMethods: Array.isArray(specialist?.paymentMethods) ? specialist.paymentMethods : parseJsonField(specialist?.paymentMethods, []),
    bankDetails: specialist?.bankDetails ? parseJsonField(specialist.bankDetails, defaultProfile.bankDetails) : defaultProfile.bankDetails,
    paymentQrCodeUrl: specialist?.paymentQrCodeUrl || '',
    certifications: Array.isArray(specialist?.certifications) ? specialist.certifications : parseJsonField(specialist?.certifications, []),
    portfolio: Array.isArray(specialist?.portfolio) ? specialist.portfolio : parseJsonField(specialist?.portfolioImages, []),
    // Parse business hours from JSON string if needed - prioritize workingHours from backend
    businessHours: specialist?.workingHours ? parseJsonField(specialist.workingHours, defaultProfile.businessHours) : (specialist?.businessHours ? (typeof specialist.businessHours === 'string' ? parseJsonField(specialist.businessHours, defaultProfile.businessHours) : { ...defaultProfile.businessHours, ...specialist.businessHours }) : defaultProfile.businessHours),
    // Parse service area from JSON string
    serviceArea: specialist?.serviceArea ? parseJsonField(specialist.serviceArea, defaultProfile.serviceArea) : defaultProfile.serviceArea,
    // Parse notification settings from JSON string
    notifications: specialist?.notifications ? parseJsonField(specialist.notifications, defaultProfile.notifications) : defaultProfile.notifications,
    // Parse privacy settings from JSON string  
    privacy: specialist?.privacy ? parseJsonField(specialist.privacy, defaultProfile.privacy) : defaultProfile.privacy,
    // Parse social media from JSON string
    socialMedia: specialist?.socialMedia ? parseJsonField(specialist.socialMedia, defaultProfile.socialMedia) : defaultProfile.socialMedia,
    // Verification details
    verification: { 
      ...defaultProfile.verification,
      isVerified: specialist?.isVerified || false,
      verifiedDate: specialist?.verifiedDate ? new Date(specialist.verifiedDate).toISOString().split('T')[0] : '',
      documentsSubmitted: parseJsonField(specialist?.documentsSubmitted, [])
    },
  };
  
  logger.debug('🔄 mergeProfileData result:', result);
  return result;
};

const SpecialistProfile: React.FC = () => {
  const { language, t } = useLanguage();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  
  // State management
  const [profile, setProfile] = useState<SpecialistProfile>(getEmptyProfile());
  const [originalProfile, setOriginalProfile] = useState<SpecialistProfile>(getEmptyProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false); // Flag to prevent reload immediately after save
  
  // Success/Error message states
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [isUploadingPaymentQr, setIsUploadingPaymentQr] = useState(false);
  const [paymentQrError, setPaymentQrError] = useState('');
  const specialtyInputRef = useRef<HTMLInputElement | null>(null);
  
  // Avatar upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'business' | 'payment' | 'portfolio'>('personal');

  // Success/Error message handlers
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setTimeout(() => setSuccessMessage(''), 300);
    }, 4000);
  };

  const showErrorNotification = (message: string) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => {
      setShowErrorMessage(false);
      setTimeout(() => setErrorMessage(''), 300);
    }, 4000);
  };

  // Fix verification date formatting - v2.0
  const formatVerificationDate = (date: string) => {
    if (!date || date === '' || date === 'Invalid Date') return null;
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj.toLocaleDateString(language === 'kh' ? 'km-KH' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'uk':
        return t('language.ukrainian');
      case 'en':
        return t('language.english');
      case 'ru':
        return t('language.russian');
      case 'de':
        return t('language.german');
      case 'fr':
        return t('language.french');
      case 'es':
        return t('language.spanish');
      default:
        return code;
    }
  };

  const getDayLabel = (day: string) => {
    switch (day) {
      case 'monday':
        return t('schedule.monday');
      case 'tuesday':
        return t('schedule.tuesday');
      case 'wednesday':
        return t('schedule.wednesday');
      case 'thursday':
        return t('schedule.thursday');
      case 'friday':
        return t('schedule.friday');
      case 'saturday':
        return t('schedule.saturday');
      case 'sunday':
        return t('schedule.sunday');
      default:
        return day;
    }
  };

  // Calculate profile completion
  const getProfileCompletion = () => {
    let completedFields = 0;
    let totalFields = 0;

    // Basic info fields
    const basicFields = ['firstName', 'lastName', 'email', 'phone', 'profession', 'bio'];
    basicFields.forEach(field => {
      totalFields++;
      if (profile[field as keyof SpecialistProfile] && String(profile[field as keyof SpecialistProfile]).trim()) {
        completedFields++;
      }
    });

    // Location
    totalFields += 2;
    if (profile.location?.address && profile.location?.city) completedFields += 2;

    // Business hours (at least one day)
    totalFields++;
    const hasWorkingDays = profile.businessHours ? Object.values(profile.businessHours).some(day => day.isOpen) : false;
    if (hasWorkingDays) completedFields++;

    // Experience
    totalFields++;
    if (profile.experience && profile.experience > 0) completedFields++;

    // Languages
    totalFields++;
    if (profile.languages?.length > 0) completedFields++;

    // Specialties
    totalFields++;
    if (profile.specialties?.length > 0) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  // Load profile data
  useEffect(() => {
    // Skip loading if we just saved to prevent unnecessary reload
    if (justSaved) {
      setJustSaved(false);
      return;
    }

    const loadProfile = async () => {
      try {
        logger.debug('📥 Starting profile load, user:', user);
        setLoading(true);
        
        if (user && isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
          logger.debug('📡 API feature enabled, fetching specialist profile...');
          try {
            const specialistData = await specialistService.getProfile();
            logger.debug('📡 Raw data from backend getProfile:', specialistData);
            
            // Extract specialist data from nested response
            const specialist = specialistData.specialist || specialistData;
            logger.debug('📦 Extracted specialist data:', specialist);
            
            const profileInput = {
              // Use nested specialist data
              ...specialist,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phone: user.phoneNumber || '',
              profession: specialist.businessName || '',
              bio: specialist.bio || '',
              experience: specialist.experience || 0,
              preciseAddress: specialist.preciseAddress || '',
              businessPhone: specialist.businessPhone || '',
              location: {
                address: specialist.address || '',
                city: specialist.city || '',
                region: specialist.state || '',
                country: specialist.country || '',
              },
              verification: {
                isVerified: specialist.isVerified || false,
                verifiedDate: specialist.isVerified && specialist.verifiedDate
                  ? specialist.verifiedDate
                  : specialist.isVerified
                  ? new Date().toISOString().split('T')[0]
                  : '',
                documentsSubmitted: [],
              },
            };
            
            logger.debug('📥 Profile input before merge:', profileInput);
            const updatedProfile = mergeProfileData(profileInput);
            logger.debug('📥 Final merged profile:', updatedProfile);
            
            setProfile(updatedProfile);
            setOriginalProfile(updatedProfile);
            logger.debug('✅ Profile loaded successfully');
          } catch (specialistError) {
            logger.warn('Specialist API not available, using user data only:', specialistError);
            const basicProfile = mergeProfileData({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phone: user.phoneNumber || '',
            });
            setProfile(basicProfile);
            setOriginalProfile(basicProfile);
          }
        } else {
          const basicProfile = mergeProfileData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: user?.phoneNumber || '',
          });
          setProfile(basicProfile);
          setOriginalProfile(basicProfile);
        }
      } catch (error) {
        logger.error('Error loading profile:', error);
        showErrorNotification(t('profile.error.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, language]); // Only depend on user ID, not the entire user object

  // Handle profile changes
  const handleProfileChange = (field: string, value: any) => {
    logger.debug(`📝 Profile field changed: ${field} =`, value);
    setProfile(prev => {
      const newProfile = {
        ...prev,
        [field]: value
      };
      logger.debug('📝 New profile state:', newProfile);
      return newProfile;
    });
    setHasUnsavedChanges(true);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate profile data
  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profile.firstName?.trim()) {
      errors.firstName = t('profile.validation.firstNameRequired');
    }
    if (!profile.lastName?.trim()) {
      errors.lastName = t('profile.validation.lastNameRequired');
    }
    if (!profile.email?.trim()) {
      errors.email = t('profile.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email = t('profile.validation.emailInvalid');
    }
    if (!profile.profession?.trim()) {
      errors.profession = t('profile.validation.professionRequired');
    }

    // Validate phone if provided
    if (profile.phone && profile.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(profile.phone)) {
      errors.phone = t('profile.validation.phoneInvalid');
    }

    // Validate precise address (required)
    if (!profile.preciseAddress?.trim()) {
      errors.preciseAddress = t('profile.validation.preciseAddressRequired');
    }

    // Validate business phone (required)
    if (!profile.businessPhone?.trim()) {
      errors.businessPhone = t('profile.validation.businessPhoneRequired');
    } else if (!/^[\d\s\-\+\(\)]+$/.test(profile.businessPhone)) {
      errors.businessPhone = t('profile.validation.phoneInvalid');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save profile
  const handleSave = async () => {
    if (!validateProfile()) {
      // Show specific validation errors
      const errorFields = Object.keys(validationErrors);
      const requiredFieldLabels: Record<string, string> = {
        firstName: t('profile.firstName'),
        lastName: t('profile.lastName'),
        email: t('profile.email'),
        profession: t('profile.profession'),
        preciseAddress: t('profile.preciseAddress'),
        businessPhone: t('profile.businessPhone'),
      };
      const errorMessage = errorFields.length > 0
        ? t('profile.validation.requiredFields').replace(
            '{fields}',
            errorFields.map(field => requiredFieldLabels[field] || field).join(', ')
          )
        : t('profile.validation.formErrors');
          
      showErrorNotification(errorMessage);
      return;
    }

    try {
      setSaving(true);
      
      if (isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
        try {
          // Prepare the specialist profile data for API - only fields backend accepts
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
            timezone: 'UTC', // Default timezone
            workingHours: profile.businessHours || {},
            preciseAddress: profile.preciseAddress || '',
            businessPhone: profile.businessPhone || '',
            paymentMethods: Array.isArray(profile.paymentMethods) ? profile.paymentMethods : [],
            bankDetails: profile.bankDetails || {},
            paymentQrCodeUrl: profile.paymentQrCodeUrl || null,
            serviceArea: profile.serviceArea || { radius: 0, cities: [] },
            notifications: profile.notifications || {},
            privacy: profile.privacy || {},
            socialMedia: profile.socialMedia || {},
            portfolioImages: Array.isArray(profile.portfolio) ? profile.portfolio : [],
            certifications: Array.isArray(profile.certifications) ? profile.certifications : []
          };

          logger.debug('💾 Sending specialist data to backend:', specialistData);
          logger.debug('💾 Current profile state before save:', profile);

          // Call the API to update the specialist profile
          try {
            const updateResult = await specialistService.updateProfile(specialistData);
            logger.debug('✅ Backend response for specialist update:', updateResult);
          } catch (updateError: any) {
            logger.error('❌ Update failed, error:', updateError);
            // If specialist profile doesn't exist, try to create it first
            if (updateError.message?.includes('SPECIALIST_NOT_FOUND') || updateError.message?.includes('not found')) {
              logger.debug('Specialist profile not found, attempting to create...');
              try {
                await specialistService.createProfile(specialistData);
                logger.debug('Specialist profile created successfully');
              } catch (createError: any) {
                logger.error('Failed to create specialist profile:', createError);
                throw createError;
              }
            } else {
              throw updateError;
            }
          }
          
          // Also update user basic info if it changed
          if (user && (
            user.firstName !== profile.firstName ||
            user.lastName !== profile.lastName ||
            user.phoneNumber !== profile.phone
          )) {
            // Update user info via user service
            const userUpdateData = {
              firstName: profile.firstName?.trim() || '',
              lastName: profile.lastName?.trim() || '',
              phoneNumber: profile.phone?.trim() || null
            };
            
            logger.debug('Updating user profile with data:', userUpdateData);
            
            try {
              // Import userService dynamically to avoid circular dependencies
              const { userService } = await import('../../services/user.service');
              await userService.updateProfile(userUpdateData);
              logger.debug('User profile updated successfully');
              
              // Update Redux store so changes persist
              dispatch(updateUserProfile(userUpdateData));
            } catch (userError: any) {
              logger.error('Failed to update user info:', userError);
              logger.error('Error details:', userError.message);
              // Don't throw error here - let specialist profile save continue
            }
          }
          
        } catch (apiError: any) {
          logger.error('API call failed:', apiError);
          throw new Error(apiError.message || 'Failed to save profile');
        }
      }
      
      // Success - reload profile data to get the latest from server
      if (isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
        try {
          // Reload the profile from the API to ensure we have the latest data
          const apiData = await specialistService.getProfile();
          logger.debug('Profile data after save reload:', apiData);
          
          // Extract specialist data from nested response
          const specialist = apiData.specialist || apiData;
          logger.debug('📦 Extracted specialist after save:', specialist);
          
          const updatedProfile = mergeProfileData({
            ...specialist,
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: user?.phoneNumber || '',
            profession: specialist.businessName || '',
            bio: specialist.bio || '',
            experience: specialist.experience || 0,
          });
          logger.debug('Merged profile after save:', updatedProfile);
          setProfile(updatedProfile);
          setOriginalProfile(updatedProfile);
        } catch (reloadError) {
          logger.warn('Failed to reload profile after save:', reloadError);
          // Still continue with success, just use local data
          setOriginalProfile(profile);
        }
      } else {
        setOriginalProfile(profile);
      }
      
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setValidationErrors({});
      setJustSaved(true); // Prevent unnecessary reload after save

      showSuccessNotification(t('profile.saveSuccess'));
      
    } catch (error) {
      logger.error('Error saving profile:', error);
      showErrorNotification(t('profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('🎯 [AVATAR UPLOAD] File selected:', file ? { name: file.name, size: file.size, type: file.type } : 'NO FILE');

    if (!file) return;

    // Warn user if they're replacing a Google avatar
    if (user?.avatar && (user.avatar.includes('googleusercontent.com') || user.avatar.includes('google.com'))) {
      console.log('⚠️ [AVATAR UPLOAD] Showing Google avatar replacement confirmation');
      const { confirm } = await import('../../components/ui/Confirm');
      const confirmed = await confirm({
        title: t('profile.confirm.replaceAvatar.title'),
        message: t('profile.confirm.replaceAvatar.message'),
        confirmText: t('profile.confirm.replaceAvatar.confirm'),
        cancelText: t('profile.confirm.replaceAvatar.cancel'),
      });
      console.log('✅ [AVATAR UPLOAD] User confirmed:', confirmed);
      if (!confirmed) {
        event.target.value = ''; // Reset file input
        return;
      }
    }

    // Validate file type and size
    console.log('🔍 [AVATAR UPLOAD] Validating file type:', file.type);
    if (!file.type.startsWith('image/')) {
      console.error('❌ [AVATAR UPLOAD] Invalid file type:', file.type);
      showErrorNotification(t('settings.profile.imageSelectError'));
      return;
    }

    console.log('🔍 [AVATAR UPLOAD] Validating file size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      console.error('❌ [AVATAR UPLOAD] File too large:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
      showErrorNotification(t('settings.profile.imageSizeError'));
      return;
    }

    try {
      console.log('🚀 [AVATAR UPLOAD] Starting upload process...');
      setIsUploadingAvatar(true);

      console.log('📤 [AVATAR UPLOAD] Calling fileUploadService.uploadAvatar...');
      // Upload the image
      const result = await fileUploadService.uploadAvatar(file);
      console.log('✅ [AVATAR UPLOAD] Upload successful, result:', result);

      console.log('💾 [AVATAR UPLOAD] Updating user profile with new avatar URL...');
      // Update user profile with new avatar URL
      await userService.updateProfile({ avatar: result.url });
      console.log('✅ [AVATAR UPLOAD] Profile updated');

      // Update Redux store so changes persist
      dispatch(updateUserProfile({ avatar: result.url }));
      console.log('✅ [AVATAR UPLOAD] Redux store updated');

      showSuccessNotification(t('settings.profile.photoUpdated'));

      // Clear the file input
      event.target.value = '';
      console.log('🎉 [AVATAR UPLOAD] Complete!');

    } catch (error: any) {
      console.error('❌ [AVATAR UPLOAD] Error occurred:', error);
      console.error('❌ [AVATAR UPLOAD] Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        apiError: error.apiError
      });
      logger.error('❌ Avatar upload error:', error);
      showErrorNotification(
        error.message || t('settings.profile.imageUploadError')
      );
    } finally {
      console.log('🏁 [AVATAR UPLOAD] Cleanup: Setting isUploadingAvatar to false');
      setIsUploadingAvatar(false);
    }
  };

  // Handle portfolio image upload
  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showErrorNotification(t('settings.profile.imageSelectError'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showErrorNotification(t('settings.profile.imageSizeError'));
      return;
    }

    try {
      setIsUploadingPortfolio(true);
      logger.debug('📸 Uploading portfolio image:', file.name, 'Size:', file.size);
      
      const result = await specialistService.uploadPortfolioImage(file);
      logger.debug('✅ Portfolio image uploaded, imageUrl length:', result.imageUrl?.length);
      logger.debug('🔍 Image URL preview:', result.imageUrl?.substring(0, 100) + '...');
      
      // Add the new image to the portfolio
      const newPortfolioItem = {
        id: `portfolio_${Date.now()}`,
        imageUrl: result.imageUrl,
        title: file.name || '',
        description: '',
        tags: []
      };
      
      logger.debug('💼 New portfolio item:', newPortfolioItem);
      
      const updatedPortfolio = [...profile.portfolio, newPortfolioItem];
      logger.debug('📋 Updated portfolio array:', updatedPortfolio.length, 'items');
      handleProfileChange('portfolio', updatedPortfolio);
      
      showSuccessNotification(t('profile.portfolio.added'));

      // Clear the file input
      event.target.value = '';
      
    } catch (error: any) {
      logger.error('❌ Portfolio upload error:', error);
      showErrorNotification(
        error.message || t('settings.profile.imageUploadError')
      );
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  const handleBankDetailsChange = (field: keyof BankDetails, value: string) => {
    if (!isEditing) return;
    handleProfileChange('bankDetails', {
      ...(profile.bankDetails || {}),
      [field]: value,
    });
  };

  const handlePaymentQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Profile Payment QR Upload] handlePaymentQrUpload triggered', { event });
    const file = event.target.files?.[0];
    console.log('[Profile Payment QR Upload] File selected:', file);
    if (!file) {
      console.log('[Profile Payment QR Upload] No file selected, returning');
      return;
    }

    if (!file.type.startsWith('image/')) {
      console.log('[Profile Payment QR Upload] Invalid file type:', file.type);
      setPaymentQrError(t('settings.profile.imageSelectError'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.log('[Profile Payment QR Upload] File too large:', file.size);
      setPaymentQrError(t('settings.profile.imageSizeError'));
      return;
    }

    try {
      console.log('[Profile Payment QR Upload] Starting upload...');
      setIsUploadingPaymentQr(true);
      setPaymentQrError('');
      console.log('[Profile Payment QR Upload] Calling fileUploadService.uploadPaymentQr');
      const result = await fileUploadService.uploadPaymentQr(file);
      console.log('[Profile Payment QR Upload] Upload result:', result);
      handleProfileChange('paymentQrCodeUrl', result.url);
      showSuccessNotification(t('profile.paymentQr.uploaded'));
      event.target.value = '';
      console.log('[Profile Payment QR Upload] Upload complete');
    } catch (error: any) {
      console.error('[Profile Payment QR Upload] Upload failed:', error);
      setPaymentQrError(
        error.message || t('profile.paymentQr.uploadFailed')
      );
    } finally {
      console.log('[Profile Payment QR Upload] Cleanup');
      setIsUploadingPaymentQr(false);
    }
  };

  const handlePaymentQrRemove = () => {
    if (!isEditing) return;
    handleProfileChange('paymentQrCodeUrl', '');
  };

  // Handle cancel editing
  const handleCancelEdit = async () => {
    if (hasUnsavedChanges) {
      const { confirm } = await import('../../components/ui/Confirm');
      const ok = await confirm({
        title: t('profile.confirm.cancelEdit.title'),
        message: t('profile.confirm.cancelEdit.message'),
        confirmText: t('profile.confirm.cancelEdit.confirm'),
        cancelText: t('profile.confirm.cancelEdit.cancel'),
      });
      if (ok) {
        setProfile(originalProfile);
        setHasUnsavedChanges(false);
        setIsEditing(false);
        setValidationErrors({});
      }
    } else {
      setIsEditing(false);
    }
  };

  if (loading) {
    const subtitle = t('profile.loading');
    return (<FullScreenHandshakeLoader title={t('common.loading')} subtitle={subtitle} />);
  }

  const completionPercentage = getProfileCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Auto-migrate Google avatars */}
      <AutoMigrateAvatar 
        showStatus={true} 
        onMigrationComplete={(success, newAvatarUrl) => {
          if (success && newAvatarUrl) {
            setProfile(prev => ({ ...prev, avatar: newAvatarUrl }));
          }
        }}
      />
      
      {/* Success/Error Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-[92vw]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-success-200 dark:border-success-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-success-800 dark:text-success-200 font-semibold text-sm mb-1">
                {t('common.success')}
              </p>
              <p className="text-success-700 dark:text-success-300 text-xs">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-[92vw]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-error-200 dark:border-error-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center flex-shrink-0">
              <XCircleIcon className="h-6 w-6 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <p className="text-error-800 dark:text-error-200 font-semibold text-sm mb-1">
                {t('common.error')}
              </p>
              <p className="text-error-700 dark:text-error-300 text-xs">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Modern Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 sm:gap-8">
            {/* Profile Info Section */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 min-w-0">
              {/* Modern Avatar */}
              <div className="relative group">
                {user?.avatar ? (
                  <Avatar
                    src={user.avatar}
                    alt={profile.firstName || t('profile.avatarAlt')}
                    size="custom"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg ring-4 ring-white dark:ring-gray-800"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-800">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                {isEditing && (
                  <>
                    <input
                      id="specialist-profile-avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={handleAvatarUpload}
                    />
                    <label
                      htmlFor="specialist-profile-avatar-upload"
                      className={`absolute -bottom-2 -right-2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <CameraIcon className="h-4 w-4" />
                    </label>
                  </>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-lg sm:text-xl text-primary-600 dark:text-primary-400 font-medium mb-3 break-words">
                      {profile.profession || t('specialist.professionNotSpecified') || 'Profession not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                  {/* Profile Completion */}
                  <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="min-w-0 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 break-words">
                      {completionPercentage}% {t('profile.complete') || 'complete'}
                    </span>
                  </div>
                  
                  {/* Verification Badge */}
                  {profile.verification?.isVerified && (
                    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300 rounded-xl border border-success-200 dark:border-success-800">
                      <DocumentCheckIcon className="h-5 w-5" />
                      <span className="min-w-0 font-medium text-sm break-words">
                        {t('specialist.verified') || 'Verified'}
                      </span>
                      {formatVerificationDate(profile.verification?.verifiedDate) && (
                        <span className="min-w-0 text-xs opacity-75 ml-1 break-words">
                          ({formatVerificationDate(profile.verification?.verifiedDate)})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Unsaved Changes Warning */}
                  {hasUnsavedChanges && (
                    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300 rounded-xl border border-warning-200 dark:border-warning-800">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="min-w-0 font-medium text-sm break-words">
                        {t('profile.unsavedChanges') || 'Unsaved changes'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isEditing && (
                <button 
                  onClick={() => {
                    if (user?.userType === 'specialist') {
                      // Open specialist's public profile in a new tab - use specialist profile ID
                      const specialistId = (profile as any).id || user.id;
                      const publicProfileUrl = `/specialist/${specialistId}`;
                      logger.debug('🔍 Opening preview for specialist ID:', specialistId);
                      window.open(publicProfileUrl, '_blank');
                    } else {
                      logger.warn('User is not a specialist');
                      showErrorNotification(
                        t('profile.previewUnavailable')
                      );
                    }
                  }}
                  className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <EyeIcon className="h-4 w-4" />
                  {t('actions.preview')}
                </button>
              )}
              <button
                onClick={() => {
                  if (isEditing) {
                    handleCancelEdit();
                  } else {
                    setIsEditing(true);
                    setOriginalProfile(profile);
                  }
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto ${
                  isEditing
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isEditing ? (
                  <>
                    <XCircleIcon className="h-5 w-5" />
                    {t('actions.cancel')}
                  </>
                ) : (
                  <>
                    <PencilSquareIcon className="h-5 w-5" />
                    {t('actions.edit')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 sm:sticky sm:top-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('profile.sections.title')}
              </h3>
              <nav className="space-y-2">
                {[
                  { id: 'personal', name: t('profile.sections.personal'), icon: UserCircleIcon },
                  { id: 'professional', name: t('profile.sections.professional'), icon: BriefcaseIcon },
                  { id: 'business', name: t('profile.sections.business'), icon: BuildingOfficeIcon },
                  { id: 'payment', name: t('profile.sections.payment'), icon: CreditCardIcon },
                  { id: 'portfolio', name: t('profile.sections.portfolio'), icon: PhotoIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 flex items-center gap-3 min-w-0 ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium break-words min-w-0">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                        {t('profile.section.personal.title')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                        {t('profile.section.personal.subtitle')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.firstName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={profile.firstName || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleProfileChange('firstName', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                            validationErrors.firstName 
                              ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
                              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                          } ${
                            !isEditing 
                              ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          } disabled:cursor-not-allowed dark:border-gray-600`}
                          placeholder={t('profile.firstNamePlaceholder')}
                          autoComplete="given-name"
                        />
                        {validationErrors.firstName && (
                          <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            {validationErrors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.lastName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={profile.lastName || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleProfileChange('lastName', e.target.value)}
                          autoComplete="family-name"
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                            validationErrors.lastName 
                              ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
                              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                          } ${
                            !isEditing 
                              ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          } disabled:cursor-not-allowed dark:border-gray-600`}
                          placeholder={t('profile.lastNamePlaceholder')}
                        />
                        {validationErrors.lastName && (
                          <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            {validationErrors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.email')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={profile.email || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleProfileChange('email', e.target.value)}
                            autoComplete="email"
                            className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                              validationErrors.email 
                                ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
                                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                            } ${
                              !isEditing 
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } disabled:cursor-not-allowed dark:border-gray-600`}
                            placeholder={t('profile.emailPlaceholder')}
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
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.phone')}
                        </label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={profile.phone || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                            autoComplete="tel"
                            className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                              validationErrors.phone 
                                ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
                                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                            } ${
                              !isEditing 
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } disabled:cursor-not-allowed dark:border-gray-600`}
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
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.bio')}
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={profile.bio || ''}
                        disabled={!isEditing}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                          !isEditing 
                            ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        } disabled:cursor-not-allowed dark:border-gray-600 resize-none`}
                        placeholder={t('profile.bioPlaceholder')}
                      />
                    </div>

                    {/* Location Picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.location')}
                      </label>
                      {isEditing ? (
                        <LocationPicker
                          location={profile.location || { address: '', city: '', region: '', country: '' }}
                          onLocationChange={(newLocation) => handleProfileChange('location', newLocation)}
                          className="border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                          <div className="flex flex-wrap items-center gap-2">
                            <MapPinIcon className="h-5 w-5 text-gray-400" />
                            <span className="min-w-0 break-words">
                              {profile.location?.address || profile.location?.city ? 
                                [profile.location.address, profile.location.city, profile.location.region, profile.location.country]
                                  .filter(Boolean).join(', ') 
                                : t('profile.locationNotSpecified')
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact Information for Confirmed Bookings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.preciseAddressLabel')} <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={profile.preciseAddress || ''}
                              onChange={(e) => handleProfileChange('preciseAddress', e.target.value)}
                              placeholder={t('profile.preciseAddressPlaceholder')}
                              className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                                validationErrors.preciseAddress
                                  ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
                                  : 'dark:border-gray-600'
                              }`}
                            />
                            {validationErrors.preciseAddress && (
                              <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                {validationErrors.preciseAddress}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <div className="flex flex-wrap items-center gap-2">
                              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                              <span className="min-w-0 break-words">{profile.preciseAddress || t('common.notSpecified')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.businessPhone')} <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <>
                            <input
                              type="tel"
                              value={profile.businessPhone || ''}
                              onChange={(e) => handleProfileChange('businessPhone', e.target.value)}
                              placeholder={t('profile.businessPhonePlaceholder')}
                              className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                                validationErrors.businessPhone
                                  ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
                                  : 'dark:border-gray-600'
                              }`}
                            />
                            {validationErrors.businessPhone && (
                              <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                {validationErrors.businessPhone}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <div className="flex flex-wrap items-center gap-2">
                              <PhoneIcon className="h-5 w-5 text-gray-400" />
                              <span className="min-w-0 break-words">{profile.businessPhone || t('common.notSpecified')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.whatsappNumber')}
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={profile.whatsappNumber || ''}
                            onChange={(e) => handleProfileChange('whatsappNumber', e.target.value)}
                            placeholder={t('profile.whatsappPlaceholder')}
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <div className="flex flex-wrap items-center gap-2">
                              <PhoneIcon className="h-5 w-5 text-green-500" />
                              <span className="min-w-0 break-words">{profile.whatsappNumber || t('common.notSpecified')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('bookings.locationNotes')}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={profile.locationNotes || ''}
                            onChange={(e) => handleProfileChange('locationNotes', e.target.value)}
                            placeholder={t('profile.locationNotesPlaceholder')}
                            rows={3}
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <span className="break-words">{profile.locationNotes || t('profile.locationNotesEmpty')}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('bookings.parking')}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={profile.parkingInfo || ''}
                            onChange={(e) => handleProfileChange('parkingInfo', e.target.value)}
                            placeholder={t('profile.parkingInfoPlaceholder')}
                            rows={3}
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <span className="break-words">{profile.parkingInfo || t('profile.parkingInfoEmpty')}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('bookings.accessInstructions')}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={profile.accessInstructions || ''}
                            onChange={(e) => handleProfileChange('accessInstructions', e.target.value)}
                            placeholder={t('profile.accessInstructionsPlaceholder')}
                            rows={3}
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <span className="break-words">{profile.accessInstructions || t('profile.accessInstructionsEmpty')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                      <div className="flex items-start">
                        <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {t('profile.privacyNotice.title')}
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {t('profile.privacyNotice.body')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Tab */}
              {activeTab === 'professional' && (
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                        {t('profile.section.professional.title')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                        {t('profile.section.professional.subtitle')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Profession */}
                    <div>
                      <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('specialist.profession') || 'Profession *'}
                      </label>
                      {isEditing ? (
                        <ProfessionDropdown
                          value={profile.profession || ''}
                          onChange={(value) => handleProfileChange('profession', value)}
                          onCustomProfession={(customValue) => handleProfileChange('profession', customValue)}
                          placeholder={t('professionForm.selectProfession') || 'Select a profession'}
                          error={validationErrors.profession}
                          allowCustom={true}
                        />
                      ) : (
                        <div className="relative">
                          <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="profession"
                            name="profession"
                            type="text"
                            value={profile.profession || ''}
                            disabled={true}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:cursor-not-allowed dark:border-gray-600 border-gray-300"
                            placeholder={t('specialist.professionNotSpecified') || 'Profession not specified'}
                          />
                        </div>
                      )}
                      {validationErrors.profession && (
                        <p className="text-error-600 text-sm mt-1 flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          {validationErrors.profession}
                        </p>
                      )}
                    </div>

                    {/* Experience */}
                    <div>
                      <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.yearsExperience')}
                      </label>
                      <input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        max="50"
                        value={profile.experience === 0 ? '' : profile.experience || ''}
                        disabled={!isEditing}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          handleProfileChange('experience', value);
                        }}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                          !isEditing 
                            ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        } disabled:cursor-not-allowed dark:border-gray-600`}
                        placeholder="5"
                      />
                    </div>

                    {/* Education */}
                    <div>
                      <label htmlFor="education" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.education')}
                      </label>
                      <div className="relative">
                        <AcademicCapIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea
                          id="education"
                          name="education"
                          value={profile.education || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleProfileChange('education', e.target.value)}
                          rows={3}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                            !isEditing 
                              ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          } disabled:cursor-not-allowed dark:border-gray-600 resize-none`}
                          placeholder={t('profile.educationPlaceholder')}
                        />
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.languages')}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.languages?.map((lang, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 rounded-xl text-sm font-medium"
                          >
                            <GlobeAltIcon className="h-4 w-4" />
                            {getLanguageLabel(lang)}
                            {isEditing && (
                              <button
                                onClick={() => {
                                  const newLanguages = profile.languages?.filter((_, i) => i !== index) || [];
                                  handleProfileChange('languages', newLanguages);
                                }}
                                className="text-primary-500 hover:text-primary-700"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value && !(profile.languages || []).includes(e.target.value)) {
                                handleProfileChange('languages', [...(profile.languages || []), e.target.value]);
                              }
                              e.target.value = '';
                            }}
                            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                          >
                            <option value="">{t('profile.languages.add')}</option>
                            <option value="uk">{getLanguageLabel('uk')}</option>
                            <option value="en">{getLanguageLabel('en')}</option>
                            <option value="ru">{getLanguageLabel('ru')}</option>
                            <option value="de">{getLanguageLabel('de')}</option>
                            <option value="fr">{getLanguageLabel('fr')}</option>
                            <option value="es">{getLanguageLabel('es')}</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Specialties */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.specialties')}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.specialties?.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-secondary-100 text-secondary-700 dark:bg-secondary-900/20 dark:text-secondary-300 rounded-xl text-sm font-medium"
                          >
                            <StarIcon className="h-4 w-4" />
                            {specialty}
                            {isEditing && (
                              <button
                                onClick={() => {
                                  const newSpecialties = profile.specialties?.filter((_, i) => i !== index) || [];
                                  handleProfileChange('specialties', newSpecialties);
                                }}
                                className="text-secondary-500 hover:text-secondary-700"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder={t('profile.specialties.addPlaceholder')}
                            ref={specialtyInputRef}
                            className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = (e.target as HTMLInputElement).value.trim();
                                if (value && !(profile.specialties || []).includes(value)) {
                                  handleProfileChange('specialties', [...(profile.specialties || []), value]);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const value = specialtyInputRef.current?.value.trim();
                              if (value && !(profile.specialties || []).includes(value)) {
                                handleProfileChange('specialties', [...(profile.specialties || []), value]);
                                if (specialtyInputRef.current) {
                                  specialtyInputRef.current.value = '';
                                }
                              }
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Business Tab */}
              {activeTab === 'business' && (
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                        {t('profile.section.business.title')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                        {t('profile.section.business.subtitle')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Business Hours */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" />
                        {t('profile.businessHours')}
                      </h3>
                      <div className="space-y-3">
                        {profile.businessHours && Object.entries(profile.businessHours).map(([day, hours]) => (
                          <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className="w-full sm:w-24">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {getDayLabel(day)}
                              </span>
                            </div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={hours.isOpen}
                                disabled={!isEditing}
                                onChange={(e) => {
                                  if (isEditing) {
                                    const newBusinessHours = {
                                      ...profile.businessHours,
                                      [day]: {
                                        isOpen: e.target.checked,
                                        startTime: hours.startTime || '09:00',
                                        endTime: hours.endTime || '17:00'
                                      }
                                    };
                                    handleProfileChange('businessHours', newBusinessHours);
                                  }
                                }}
                                className="rounded text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {t('schedule.open')}
                              </span>
                            </label>
                            {hours.isOpen && (
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <input
                                    type="time"
                                    value={hours.startTime || '09:00'}
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      if (isEditing) {
                                        const newBusinessHours = {
                                          ...profile.businessHours,
                                          [day]: {
                                            isOpen: hours.isOpen,
                                            startTime: e.target.value,
                                            endTime: hours.endTime || '17:00'
                                          }
                                        };
                                        handleProfileChange('businessHours', newBusinessHours);
                                      }
                                    }}
                                    className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded-xl text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                                  />
                                  <span className="hidden sm:inline text-gray-500">-</span>
                                  <input
                                    type="time"
                                    value={hours.endTime || '17:00'}
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      if (isEditing) {
                                        const newBusinessHours = {
                                          ...profile.businessHours,
                                          [day]: {
                                            isOpen: hours.isOpen,
                                            startTime: hours.startTime || '09:00',
                                            endTime: e.target.value
                                          }
                                        };
                                        handleProfileChange('businessHours', newBusinessHours);
                                      }
                                    }}
                                    className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded-xl text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                                  />
                                </div>
                                {(() => {
                                  // Check if both times are defined before processing
                                  if (!hours.startTime || !hours.endTime) return null;

                                  const [startHour, startMinute] = hours.startTime.split(':').map(Number);
                                  const [endHour, endMinute] = hours.endTime.split(':').map(Number);
                                  const startMinutes = startHour * 60 + startMinute;
                                  const endMinutes = endHour * 60 + endMinute;
                                  const crossesMidnight = endMinutes <= startMinutes;

                                  if (crossesMidnight) {
                                    return (
                                      <div className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1 mt-1 break-words">
                                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>
                                          {t('profile.businessHours.crossesMidnightWarning')}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Service Area */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPinIcon className="h-5 w-5" />
                        {t('profile.serviceArea')}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('profile.serviceArea.radius')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={profile.serviceArea?.radius === 0 ? '' : profile.serviceArea?.radius || ''}
                            disabled={!isEditing}
                            onChange={(e) => {
                              if (isEditing) {
                                const radius = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                const newServiceArea = {
                                  ...(profile.serviceArea || { radius: 0, cities: [] }),
                                  radius: radius
                                };
                                handleProfileChange('serviceArea', newServiceArea);
                              }
                            }}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                              !isEditing 
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } disabled:cursor-not-allowed dark:border-gray-600`}
                            placeholder="10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Tab */}
              {activeTab === 'payment' && (
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                        {t('profile.section.payment.title')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                        {t('profile.section.payment.subtitle')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Payment Methods */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCardIcon className="h-5 w-5" />
                        {t('profile.paymentMethods') || 'Payment Methods'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {[
                          { id: 'cash', label: t('payments.method.cash') },
                          { id: 'card', label: t('payments.method.card') },
                          { id: 'bank_transfer', label: t('payments.method.bankTransfer') },
                          { id: 'online', label: t('payments.method.online') },
                          { id: 'crypto', label: t('payments.method.crypto') },
                        ].map((method) => (
                          <label
                            key={method.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors ${
                              isEditing ? 'cursor-pointer hover:border-primary-400' : 'opacity-70 cursor-not-allowed'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={(profile.paymentMethods || []).includes(method.id)}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (!isEditing) return;
                                const current = profile.paymentMethods || [];
                                const next = e.target.checked
                                  ? [...current, method.id]
                                  : current.filter((value) => value !== method.id);
                                handleProfileChange('paymentMethods', next);
                              }}
                              className="rounded text-primary-600 focus:ring-primary-500"
                            />
                            <span className="min-w-0 text-sm text-gray-700 dark:text-gray-300 break-words">{method.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <DocumentCheckIcon className="h-5 w-5" />
                        {t('specialist.paymentDetails') || 'Payment Details'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('specialist.bankName') || 'Bank name'}
                          </label>
                          <input
                            type="text"
                            value={profile.bankDetails?.bankName || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl border transition-colors border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                              !isEditing
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } dark:border-gray-600`}
                            placeholder={t('specialist.bankNamePlaceholder') || 'e.g., PrivatBank'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('specialist.accountName') || 'Account name'}
                          </label>
                          <input
                            type="text"
                            value={profile.bankDetails?.accountName || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleBankDetailsChange('accountName', e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl border transition-colors border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                              !isEditing
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } dark:border-gray-600`}
                            placeholder={t('specialist.accountNamePlaceholder') || 'e.g., Your name'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('specialist.accountNumber') || 'Account number'}
                          </label>
                          <input
                            type="text"
                            value={profile.bankDetails?.accountNumber || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl border transition-colors border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                              !isEditing
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } dark:border-gray-600`}
                            placeholder={t('specialist.accountNumberPlaceholder') || '0000 0000 0000 0000'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('specialist.iban') || 'IBAN'}
                          </label>
                          <input
                            type="text"
                            value={profile.bankDetails?.iban || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleBankDetailsChange('iban', e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl border transition-colors border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                              !isEditing
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } dark:border-gray-600`}
                            placeholder={t('specialist.ibanPlaceholder') || 'UA00 0000 0000 0000 0000 0000 000'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('specialist.swift') || 'SWIFT/BIC'}
                          </label>
                          <input
                            type="text"
                            value={profile.bankDetails?.swift || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleBankDetailsChange('swift', e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl border transition-colors border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                              !isEditing
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } dark:border-gray-600`}
                            placeholder={t('specialist.swiftPlaceholder') || 'PBANUA2X'}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('specialist.bankNotes') || 'Payment notes'}
                        </label>
                        <textarea
                          value={profile.bankDetails?.notes || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleBankDetailsChange('notes', e.target.value)}
                          className={`w-full px-4 py-2 rounded-xl border transition-colors border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                            !isEditing
                              ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          } dark:border-gray-600`}
                          rows={3}
                          placeholder={t('specialist.bankNotesPlaceholder') || 'Add any payment instructions...'}
                        />
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('specialist.paymentQr') || 'Payment QR code'}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          {profile.paymentQrCodeUrl ? (
                            <img
                              src={getAbsoluteImageUrl(profile.paymentQrCodeUrl)}
                              alt={t('specialist.paymentQr') || 'Payment QR code'}
                              className="w-28 h-28 rounded-lg border border-gray-200 dark:border-gray-700 object-cover"
                            />
                          ) : (
                            <div className="w-28 h-28 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 text-xs text-center px-2">
                              {t('profile.paymentQr.empty')}
                            </div>
                          )}

                          {isEditing && (
                            <div className="space-y-2">
                              <input
                                id="payment-qr-upload"
                                type="file"
                                accept="image/*"
                                onChange={handlePaymentQrUpload}
                                className="hidden"
                                disabled={isUploadingPaymentQr}
                              />
                              <div className="flex flex-col sm:flex-row gap-2">
                                <label
                                  htmlFor="payment-qr-upload"
                                  className={`w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors cursor-pointer ${isUploadingPaymentQr ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                >
                                  {isUploadingPaymentQr
                                    ? t('settings.upload.uploading')
                                    : (t('specialist.uploadQr') || 'Upload QR')}
                                </label>
                                {profile.paymentQrCodeUrl && (
                                  <button
                                    type="button"
                                    onClick={handlePaymentQrRemove}
                                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    {t('specialist.removeQr') || 'Remove'}
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('specialist.qrHelp') || 'PNG/JPG/WebP up to 5MB.'}
                              </p>
                              {paymentQrError && (
                                <p className="text-xs text-red-500">{paymentQrError}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                        {t('profile.section.portfolio.title')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                        {t('profile.section.portfolio.subtitle')}
                      </p>
                    </div>
                    {isEditing && (
                      <div className="relative">
                        <input
                          id="portfolio-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePortfolioUpload}
                          className="hidden"
                          disabled={isUploadingPortfolio}
                        />
                        <label
                          htmlFor="portfolio-image-upload"
                          className={`w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 cursor-pointer ${isUploadingPortfolio ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                        >
                          {isUploadingPortfolio ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              {t('settings.upload.uploading')}
                            </>
                          ) : (
                            <>
                              <PlusIcon className="h-4 w-4" />
                              {t('profile.portfolio.addPhoto')}
                            </>
                          )}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {t('profile.portfolio.fileHint')}
                        </p>
                      </div>
                    )}
                  </div>

                  {profile.portfolio && profile.portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {profile.portfolio.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={getAbsoluteImageUrl(item.imageUrl)}
                              alt={item.title || t('profile.portfolio.itemAlt').replace('{number}', String(index + 1))}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                logger.error('Portfolio image failed to load:', item.imageUrl);
                                // Hide broken images
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={(e) => {
                                logger.debug('✅ Portfolio image loaded successfully:', item.imageUrl);
                              }}
                            />
                          </div>
                          {item.title && (
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 break-words">
                                {item.title}
                              </h3>
                              {item.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-xs break-words">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          )}
                          {isEditing && (
                            <button
                              onClick={() => {
                                const updatedPortfolio = profile.portfolio.filter((_, i) => i !== index);
                                handleProfileChange('portfolio', updatedPortfolio);
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 sm:py-16">
                      <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {t('profile.portfolio.emptyTitle')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {t('profile.portfolio.emptySubtitle')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              {isEditing && (
                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50 dark:bg-gray-700 rounded-b-2xl border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="w-full sm:w-auto px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {t('actions.cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      )}
                      {saving 
                        ? t('actions.saving')
                        : t('actions.saveChanges')
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistProfile;
