import React, { useState, useEffect } from 'react';
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
import OptimizedImage from '../../components/ui/OptimizedImage';
import { Avatar } from '../../components/ui/Avatar';
import AutoMigrateAvatar from '../../components/AutoMigrateAvatar';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilSquareIcon,
  UserCircleIcon,
  MapPinIcon,
  ClockIcon,
  CreditCardIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  StarIcon,
  PhotoIcon,
  DocumentCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CameraIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@/components/icons';

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
  preciseAddress: string;
  businessPhone: string;
  whatsappNumber: string;
  locationNotes: string;
  parkingInfo: string;
  accessInstructions: string;
  serviceArea: {
    radius: number;
    cities: string[];
  };
  businessHours: BusinessHours;
  paymentMethods: string[];
  bankAccounts: BankAccount[];
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

interface BankAccount {
  type: 'ABA' | 'KHQR';
  accountName: string;
  accountNumber: string;
  qrImageUrl?: string;
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
  preciseAddress: '',
  businessPhone: '',
  whatsappNumber: '',
  locationNotes: '',
  parkingInfo: '',
  accessInstructions: '',
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
  bankAccounts: [],
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
  
  console.log('🔄 mergeProfileData input:', apiData);
  console.log('🔄 defaultProfile:', defaultProfile);
  
  // Extract specialist data from nested structure
  const specialist = apiData?.specialist || apiData;
  
  // Parse JSON strings if they exist (backend stores some fields as JSON strings)
  const parseJsonField = (field: any, fallback: any) => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.warn('⚠️ Failed to parse JSON field:', field, e);
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
    // Location data from specialist
    location: {
      address: specialist?.address || specialist?.location?.address || '',
      city: specialist?.city || specialist?.location?.city || '',
      region: specialist?.state || specialist?.location?.region || specialist?.location?.state || '',
      country: specialist?.country || specialist?.location?.country || '',
    },
    preciseAddress: specialist?.preciseAddress || specialist?.location?.preciseAddress || '',
    businessPhone: specialist?.businessPhone || specialist?.location?.businessPhone || '',
    whatsappNumber: specialist?.whatsappNumber || specialist?.location?.whatsappNumber || '',
    locationNotes: specialist?.locationNotes || specialist?.location?.locationNotes || '',
    parkingInfo: specialist?.parkingInfo || specialist?.location?.parkingInfo || '',
    accessInstructions: specialist?.accessInstructions || specialist?.location?.accessInstructions || '',
    // Parse backend JSON strings and ensure arrays are always arrays
    languages: Array.isArray(specialist?.languages) ? specialist.languages : parseJsonField(specialist?.languages, []),
    specialties: Array.isArray(specialist?.specialties) ? specialist.specialties : parseJsonField(specialist?.specialties, []),
    paymentMethods: Array.isArray(specialist?.paymentMethods) ? specialist.paymentMethods : parseJsonField(specialist?.paymentMethods, []),
    bankAccounts: Array.isArray(specialist?.bankAccounts)
      ? specialist.bankAccounts
      : parseJsonField(specialist?.bankAccounts ?? specialist?.bank_accounts ?? specialist?.payoutAccounts ?? specialist?.payout_accounts, []),
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
  
  console.log('🔄 mergeProfileData result:', result);
  return result;
};

const SpecialistProfile: React.FC = () => {
  const { language, t } = useLanguage();
  const isKh = language === 'kh';
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
  
  // Avatar upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [bankUploadState, setBankUploadState] = useState<Record<'ABA' | 'KHQR', boolean>>({
    ABA: false,
    KHQR: false,
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'business' | 'portfolio'>('personal');

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
        console.log('📥 Starting profile load, user:', user);
        setLoading(true);
        
        if (user && isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
          console.log('📡 API feature enabled, fetching specialist profile...');
          try {
            const specialistData = await specialistService.getProfile();
            console.log('📡 Raw data from backend getProfile:', specialistData);
            
            // Extract specialist data from nested response
            const specialist = specialistData.specialist || specialistData;
            console.log('📦 Extracted specialist data:', specialist);
            
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
            
            console.log('📥 Profile input before merge:', profileInput);
            const updatedProfile = mergeProfileData(profileInput);
            console.log('📥 Final merged profile:', updatedProfile);
            
            setProfile(updatedProfile);
            setOriginalProfile(updatedProfile);
            console.log('✅ Profile loaded successfully');
          } catch (specialistError) {
            console.warn('Specialist API not available, using user data only:', specialistError);
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
        console.error('Error loading profile:', error);
        showErrorNotification(
          isKh ? 'មិនអាចផ្ទុកប្រវត្តិរូបបាន' : 'Failed to load profile'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, language]); // Only depend on user ID, not the entire user object

  // Handle profile changes
  const handleProfileChange = (field: string, value: any) => {
    console.log(`📝 Profile field changed: ${field} =`, value);
    setProfile(prev => {
      const newProfile = {
        ...prev,
        [field]: value
      };
      console.log('📝 New profile state:', newProfile);
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

  const updateBankAccount = (type: 'ABA' | 'KHQR', updates: Partial<BankAccount>) => {
    const currentAccounts = Array.isArray(profile.bankAccounts) ? profile.bankAccounts : [];
    const existing = currentAccounts.find((account) => account.type === type);
    const nextAccounts = existing
      ? currentAccounts.map((account) =>
          account.type === type ? { ...account, ...updates, type } : account
        )
      : [
          ...currentAccounts,
          {
            type,
            accountName: '',
            accountNumber: '',
            ...updates,
          }
        ];

    handleProfileChange('bankAccounts', nextAccounts);
  };

  const handleBankQrUpload = async (type: 'ABA' | 'KHQR', file: File) => {
    if (!isEditing) return;
    try {
      setBankUploadState((prev) => ({ ...prev, [type]: true }));
      const uploaded = await fileUploadService.uploadFile(file, {
        type: 'document',
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif'],
      });
      updateBankAccount(type, { qrImageUrl: uploaded.url });
      showSuccessNotification(isKh ? 'បានផ្ទុក QR ដោយជោគជ័យ' : 'QR image uploaded');
    } catch (error: any) {
      console.error('Failed to upload QR image:', error);
      showErrorNotification(error?.message || (isKh ? 'មិនអាចផ្ទុក QR បានទេ' : 'Failed to upload QR image'));
    } finally {
      setBankUploadState((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Validate profile data
  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profile.firstName?.trim()) {
      errors.firstName = isKh ? 'ត្រូវបំពេញនាម' : 'First name is required';
    }
    if (!profile.lastName?.trim()) {
      errors.lastName = isKh ? 'ត្រូវបំពេញនាមត្រកូល' : 'Last name is required';
    }
    if (!profile.email?.trim()) {
      errors.email = isKh ? 'ត្រូវបំពេញអ៊ីមែល' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email = isKh ? 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ' : 'Invalid email format';
    }
    if (!profile.profession?.trim()) {
      errors.profession = isKh ? 'ត្រូវបំពេញមុខរបរ' : 'Profession is required';
    }
    
    // Validate phone if provided
    if (profile.phone && profile.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(profile.phone)) {
      errors.phone = isKh ? 'ទម្រង់លេខទូរស័ព្ទមិនត្រឹមត្រូវ' : 'Invalid phone format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save profile
  const handleSave = async () => {
    if (!validateProfile()) {
      // Show specific validation errors
      const errorFields = Object.keys(validationErrors);
      const fieldLabels: Record<string, string> = {
        firstName: isKh ? 'នាម' : 'First Name',
        lastName: isKh ? 'នាមត្រកូល' : 'Last Name',
        email: isKh ? 'អ៊ីមែល' : 'Email',
        profession: isKh ? 'មុខរបរ' : 'Profession',
      };
      const missingFields = errorFields.map((field) => fieldLabels[field] || field);
      const errorMessage = errorFields.length > 0
        ? `${isKh ? 'សូមបំពេញព័ត៌មានចាំបាច់៖' : 'Please fill in the required fields:'} ${missingFields.join(', ')}`
        : (isKh ? 'សូមពិនិត្យកំហុសនៅក្នុងទម្រង់' : 'Please fix the errors in the form');
          
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
            preciseAddress: profile.preciseAddress || '',
            businessPhone: profile.businessPhone || '',
            whatsappNumber: profile.whatsappNumber || '',
            locationNotes: profile.locationNotes || '',
            parkingInfo: profile.parkingInfo || '',
            accessInstructions: profile.accessInstructions || '',
            timezone: 'UTC', // Default timezone
            workingHours: profile.businessHours || {},
            paymentMethods: Array.isArray(profile.paymentMethods) ? profile.paymentMethods : [],
            bankAccounts: Array.isArray(profile.bankAccounts) ? profile.bankAccounts : [],
            serviceArea: profile.serviceArea || { radius: 0, cities: [] },
            notifications: profile.notifications || {},
            privacy: profile.privacy || {},
            socialMedia: profile.socialMedia || {},
            portfolioImages: Array.isArray(profile.portfolio) ? profile.portfolio : [],
            certifications: Array.isArray(profile.certifications) ? profile.certifications : []
          };

          console.log('💾 Sending specialist data to backend:', specialistData);
          console.log('💾 Current profile state before save:', profile);

          // Call the API to update the specialist profile
          try {
            const updateResult = await specialistService.updateProfile(specialistData);
            console.log('✅ Backend response for specialist update:', updateResult);
          } catch (updateError: any) {
            console.error('❌ Update failed, error:', updateError);
            // If specialist profile doesn't exist, try to create it first
            if (updateError.message?.includes('SPECIALIST_NOT_FOUND') || updateError.message?.includes('not found')) {
              console.log('Specialist profile not found, attempting to create...');
              try {
                await specialistService.createProfile(specialistData);
                console.log('Specialist profile created successfully');
              } catch (createError: any) {
                console.error('Failed to create specialist profile:', createError);
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
            
            console.log('Updating user profile with data:', userUpdateData);
            
            try {
              // Import userService dynamically to avoid circular dependencies
              const { userService } = await import('../../services/user.service');
              await userService.updateProfile(userUpdateData);
              console.log('User profile updated successfully');
              
              // Update Redux store so changes persist
              dispatch(updateUserProfile(userUpdateData));
            } catch (userError: any) {
              console.error('Failed to update user info:', userError);
              console.error('Error details:', userError.message);
              // Don't throw error here - let specialist profile save continue
            }
          }
          
        } catch (apiError: any) {
          console.error('API call failed:', apiError);
          throw new Error(apiError.message || 'Failed to save profile');
        }
      }
      
      // Success - reload profile data to get the latest from server
      if (isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
        try {
          // Reload the profile from the API to ensure we have the latest data
          const apiData = await specialistService.getProfile();
          console.log('Profile data after save reload:', apiData);
          
          // Extract specialist data from nested response
          const specialist = apiData.specialist || apiData;
          console.log('📦 Extracted specialist after save:', specialist);
          
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
          console.log('Merged profile after save:', updatedProfile);
          setProfile(updatedProfile);
          setOriginalProfile(updatedProfile);
        } catch (reloadError) {
          console.warn('Failed to reload profile after save:', reloadError);
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

      showSuccessNotification(
        isKh ? 'បានរក្សាទុកប្រវត្តិរូបដោយជោគជ័យ!' : 'Profile saved successfully!'
      );
      
    } catch (error) {
      console.error('Error saving profile:', error);
      showErrorNotification(
        isKh ? 'មិនអាចរក្សាទុកការផ្លាស់ប្តូរ​បានទេ' : 'Failed to save changes'
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Warn user if they're replacing a Google avatar
    if (user?.avatar && (user.avatar.includes('googleusercontent.com') || user.avatar.includes('google.com'))) {
      const { confirm } = await import('../../components/ui/Confirm');
      const confirmed = await confirm({
        title: isKh ? 'ប្តូររូបអវតារ?' : 'Replace avatar?',
        message: isKh ? 'តើអ្នកប្រាកដថាចង់ប្តូររូបអវតារពី Google ទេ?' : 'Are you sure you want to replace your Google avatar?',
        confirmText: isKh ? 'ប្តូរ' : 'Replace',
        cancelText: isKh ? 'បោះបង់' : 'Cancel',
      });
      if (!confirmed) {
        event.target.value = ''; // Reset file input
        return;
      }
    }

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showErrorNotification(
        isKh ? 'សូមជ្រើសរើសឯកសាររូបភាព' : 'Please select an image file'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showErrorNotification(
        isKh ? 'ទំហំឯកសារត្រូវតិចជាង 5MB' : 'File size must be less than 5MB'
      );
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      // Upload the image
      const result = await fileUploadService.uploadAvatar(file);
      
      // Update user profile with new avatar URL
      await userService.updateProfile({ avatar: result.url });
      
      // Update Redux store so changes persist
      dispatch(updateUserProfile({ avatar: result.url }));
      
      showSuccessNotification(
        isKh ? 'បានធ្វើបច្ចុប្បន្នភាពរូបអវតារដោយជោគជ័យ' : 'Avatar updated successfully'
      );

      // Clear the file input
      event.target.value = '';
      
    } catch (error: any) {
      console.error('❤️ Avatar upload error:', error);
      showErrorNotification(
        error.message || 
        (isKh ? 'មិនអាចផ្ទុករូបអវតារបានទេ' : 'Failed to upload avatar')
      );
    } finally {
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
      showErrorNotification(
        isKh ? 'សូមជ្រើសរើសឯកសាររូបភាព' : 'Please select an image file'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showErrorNotification(
        isKh ? 'ទំហំឯកសារត្រូវតិចជាង 5MB' : 'File size must be less than 5MB'
      );
      return;
    }

    try {
      setIsUploadingPortfolio(true);
      console.log('📸 Uploading portfolio image:', file.name, 'Size:', file.size);
      
      const result = await specialistService.uploadPortfolioImage(file);
      console.log('✅ Portfolio image uploaded, imageUrl length:', result.imageUrl?.length);
      console.log('🔍 Image URL preview:', result.imageUrl?.substring(0, 100) + '...');
      
      // Add the new image to the portfolio
      const newPortfolioItem = {
        id: `portfolio_${Date.now()}`,
        imageUrl: result.imageUrl,
        title: file.name || '',
        description: '',
        tags: []
      };
      
      console.log('💼 New portfolio item:', newPortfolioItem);
      
      const updatedPortfolio = [...profile.portfolio, newPortfolioItem];
      console.log('📋 Updated portfolio array:', updatedPortfolio.length, 'items');
      handleProfileChange('portfolio', updatedPortfolio);
      
      showSuccessNotification(
        isKh ? 'បានបន្ថែមរូបភាពទៅផតហ្វូលីអូដោយជោគជ័យ' : 'Image successfully added to portfolio'
      );

      // Clear the file input
      event.target.value = '';
      
    } catch (error: any) {
      console.error('❌ Portfolio upload error:', error);
      showErrorNotification(
        error.message || 
        (isKh ? 'មិនអាចផ្ទុករូបភាពបានទេ' : 'Failed to upload image')
      );
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  // Handle cancel editing
  const handleCancelEdit = async () => {
    if (hasUnsavedChanges) {
      const { confirm } = await import('../../components/ui/Confirm');
      const ok = await confirm({
        title: isKh ? 'បោះបង់ការកែសម្រួល?' : 'Cancel editing?',
        message: isKh ? 'អ្នកមានការផ្លាស់ប្តូរដែលមិនបានរក្សាទុក។' : 'You have unsaved changes.',
        confirmText: isKh ? 'បោះបង់' : 'Discard',
        cancelText: isKh ? 'ត្រឡប់ក្រោយ' : 'Go back',
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
    const subtitle = isKh ? 'កំពុងផ្ទុកប្រវត្តិរូបរបស់អ្នក' : 'Fetching your profile';
    return (<FullScreenHandshakeLoader title={t('common.loading')} subtitle={subtitle} />);
  }

  const completionPercentage = getProfileCompletion();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-success-200 dark:border-success-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-success-800 dark:text-success-200 font-semibold text-sm mb-1">
                {isKh ? 'ជោគជ័យ!' : 'Success!'}
              </p>
              <p className="text-success-700 dark:text-success-300 text-xs">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-error-200 dark:border-error-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center flex-shrink-0">
              <XCircleIcon className="h-6 w-6 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <p className="text-error-800 dark:text-error-200 font-semibold text-sm mb-1">
                {isKh ? 'កំហុស!' : 'Error!'}
              </p>
              <p className="text-error-700 dark:text-error-300 text-xs">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Profile Info Section */}
            <div className="flex items-start gap-6">
              {/* Modern Avatar */}
              <div className="relative group">
                {user?.avatar ? (
                  <Avatar
                    src={user.avatar}
                    alt={profile.firstName || 'Profile'}
                    size="custom"
                    className="w-28 h-28 rounded-2xl object-cover shadow-lg ring-4 ring-white dark:ring-gray-800"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-800">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={handleAvatarUpload}
                    />
                    <CameraIcon className="h-4 w-4" />
                  </label>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-xl text-primary-600 dark:text-primary-400 font-medium mb-3">
                      {profile.profession || t('specialist.professionNotSpecified') || 'Profession not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {/* Profile Completion */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {completionPercentage}% {t('profile.complete') || 'complete'}
                    </span>
                  </div>
                  
                  {/* Verification Badge */}
                  {profile.verification?.isVerified && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300 rounded-xl border border-success-200 dark:border-success-800">
                      <DocumentCheckIcon className="h-5 w-5" />
                      <span className="font-medium text-sm">
                        {t('specialist.verified') || 'Verified'}
                      </span>
                      {formatVerificationDate(profile.verification?.verifiedDate) && (
                        <span className="text-xs opacity-75 ml-1">
                          ({formatVerificationDate(profile.verification?.verifiedDate)})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Unsaved Changes Warning */}
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300 rounded-xl border border-warning-200 dark:border-warning-800">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="font-medium text-sm">
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
                      console.log('🔍 Opening preview for specialist ID:', specialistId);
                      window.open(publicProfileUrl, '_blank');
                    } else {
                      console.warn('User is not a specialist');
                      showErrorNotification(
                        isKh ? 'មិនអាចមើលប្រវត្តិរូបបានទេ' : 'Profile not available for preview'
                      );
                    }
                  }}
                  className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  {isKh ? 'មើលជាមុន' : 'Preview'}
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
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isEditing
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isEditing ? (
                  <>
                    <XCircleIcon className="h-5 w-5" />
                    {isKh ? 'បោះបង់' : 'Cancel'}
                  </>
                ) : (
                  <>
                    <PencilSquareIcon className="h-5 w-5" />
                    {isKh ? 'កែសម្រួលប្រវត្តិរូប' : 'Edit Profile'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isKh ? 'ផ្នែកប្រវត្តិរូប' : 'Profile Sections'}
              </h3>
              <nav className="space-y-2">
                {[
                  { id: 'personal', name: isKh ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Info', icon: UserCircleIcon },
                  { id: 'professional', name: isKh ? 'វិជ្ជាជីវៈ' : 'Professional', icon: BriefcaseIcon },
                  { id: 'business', name: isKh ? 'អាជីវកម្ម' : 'Business', icon: BuildingOfficeIcon },
                  { id: 'portfolio', name: isKh ? 'ផតហ្វូលីអូ' : 'Portfolio', icon: PhotoIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
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
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isKh ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Information'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isKh ? 'ព័ត៌មានមូលដ្ឋានអំពីអ្នក' : 'Basic information about you'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isKh ? 'នាម *' : 'First Name *'}
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
                          placeholder={isKh ? 'បញ្ចូលនាម' : 'Enter first name'}
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
                          {isKh ? 'នាមត្រកូល *' : 'Last Name *'}
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
                          placeholder={isKh ? 'បញ្ចូលនាមត្រកូល' : 'Enter last name'}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isKh ? 'អ៊ីមែល *' : 'Email *'}
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
                            placeholder="example@email.com"
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
                          {isKh ? 'ទូរស័ព្ទ' : 'Phone'}
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
                        {isKh ? 'អំពីខ្លួនអ្នក' : 'Bio'}
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
                        placeholder={isKh ? 'ប្រាប់អំពីខ្លួនអ្នក...' : 'Tell us about yourself...'}
                      />
                    </div>

                    {/* Location Picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isKh ? 'ទីតាំង' : 'Location'}
                      </label>
                      {isEditing ? (
                        <LocationPicker
                          location={profile.location || { address: '', city: '', region: '', country: '' }}
                          onLocationChange={(newLocation) => handleProfileChange('location', newLocation)}
                          className="border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-5 w-5 text-gray-400" />
                            <span>
                              {profile.location?.address || profile.location?.city ? 
                                [profile.location.address, profile.location.city, profile.location.region, profile.location.country]
                                  .filter(Boolean).join(', ') 
                                : (isKh ? 'មិនបានបញ្ជាក់ទីតាំង' : 'No location specified')
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact Information for Confirmed Bookings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isKh ? 'អាសយដ្ឋានលម្អិត (បង្ហាញតែអតិថិជនដែលបានបញ្ជាក់)' : 'Precise Address (Shown only to confirmed customers)'}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.preciseAddress || ''}
                            onChange={(e) => handleProfileChange('preciseAddress', e.target.value)}
                            placeholder={isKh ? 'ឧ. អគារ A, បន្ទប់ 5B, ផ្លូវ 123' : 'Apt 5B, Building A, 123 Main Street'}
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <div className="flex items-center space-x-2">
                              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                              <span>{profile.preciseAddress || (isKh ? 'មិនបានបញ្ជាក់' : 'Not specified')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isKh ? 'ទូរស័ព្ទអាជីវកម្ម' : 'Business Phone'}
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={profile.businessPhone || ''}
                            onChange={(e) => handleProfileChange('businessPhone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <div className="flex items-center space-x-2">
                              <PhoneIcon className="h-5 w-5 text-gray-400" />
                              <span>{profile.businessPhone || (isKh ? 'មិនបានបញ្ជាក់' : 'Not specified')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isKh ? 'លេខ WhatsApp (ជម្រើស)' : 'WhatsApp Number (Optional)'}
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={profile.whatsappNumber || ''}
                            onChange={(e) => handleProfileChange('whatsappNumber', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <div className="flex items-center space-x-2">
                              <PhoneIcon className="h-5 w-5 text-green-500" />
                              <span>{profile.whatsappNumber || (isKh ? 'មិនបានបញ្ជាក់' : 'Not specified')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isKh ? 'កំណត់សម្គាល់ទីតាំង' : 'Location Notes'}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={profile.locationNotes || ''}
                            onChange={(e) => handleProfileChange('locationNotes', e.target.value)}
                            placeholder={isKh ? 'ការណែនាំពិសេសសម្រាប់រកទីតាំង...' : 'Special instructions for finding the location...'}
                            rows={3}
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <span>{profile.locationNotes || (isKh ? 'គ្មានការណែនាំពិសេស' : 'No special instructions')}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isKh ? 'ព័ត៌មានចំណតរថយន្ត' : 'Parking Information'}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={profile.parkingInfo || ''}
                            onChange={(e) => handleProfileChange('parkingInfo', e.target.value)}
                            placeholder={isKh ? 'ការណែនាំចំណត តម្លៃ និងការកំណត់...' : 'Parking instructions, costs, restrictions...'}
                            rows={3}
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <span>{profile.parkingInfo || (isKh ? 'មិនបានផ្តល់ព័ត៌មានចំណត' : 'No parking information provided')}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isKh ? 'ការណែនាំចូលដំណើរការ' : 'Access Instructions'}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={profile.accessInstructions || ''}
                            onChange={(e) => handleProfileChange('accessInstructions', e.target.value)}
                            placeholder={isKh ? 'លេខកូដចូលអាគារ ការណែនាំកណ្ដឹង ជាដើម...' : 'Building access codes, buzzer instructions, etc...'}
                            rows={3}
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <span>{profile.accessInstructions || (isKh ? 'មិនបានផ្តល់ការណែនាំចូល' : 'No access instructions provided')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {isKh ? 'ការជូនដំណឹងអំពីភាពឯកជន' : 'Privacy Notice'}
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {isKh
                              ? 'ព័ត៌មានទំនាក់ទំនងលម្អិតនេះ នឹងចែករំលែកតែបន្ទាប់ពីការកក់ត្រូវបានបញ្ជាក់។ ប្រវត្តិរូបសាធារណៈនឹងបង្ហាញតែទីក្រុង/តំបន់ទូទៅប៉ុណ្ណោះ ដើម្បីការពារភាពឯកជន។'
                              : 'This detailed contact information will only be shared with customers after their booking is confirmed. Public profiles will only show your general city/area for privacy protection.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Tab */}
              {activeTab === 'professional' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isKh ? 'ព័ត៌មានវិជ្ជាជីវៈ' : 'Professional Information'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isKh ? 'ជំនាញ និងបទពិសោធន៍វិជ្ជាជីវៈរបស់អ្នក' : 'Your professional skills and experience'}
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
                        {isKh ? 'បទពិសោធន៍ (ឆ្នាំ)' : 'Years of Experience'}
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
                        {isKh ? 'ការអប់រំ' : 'Education'}
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
                          placeholder={isKh ? 'ពិពណ៌នាអំពីការអប់រំ និងលទ្ធភាពរបស់អ្នក...' : 'Describe your education and qualifications...'}
                        />
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isKh ? 'ភាសា' : 'Languages'}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.languages?.map((lang, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 rounded-lg text-sm font-medium"
                          >
                            <GlobeAltIcon className="h-4 w-4" />
                            {lang === 'kh' ? 'ខ្មែរ' : lang === 'uk' ? 'Українська' : lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : lang}
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
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value && !(profile.languages || []).includes(e.target.value)) {
                                handleProfileChange('languages', [...(profile.languages || []), e.target.value]);
                              }
                              e.target.value = '';
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                          >
                            <option value="">{isKh ? 'បន្ថែមភាសា' : 'Add Language'}</option>
                            <option value="kh">ខ្មែរ</option>
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                            <option value="fr">Français</option>
                            <option value="es">Español</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Specialties */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isKh ? 'ជំនាញពិសេស' : 'Specialties'}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.specialties?.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-secondary-100 text-secondary-700 dark:bg-secondary-900/20 dark:text-secondary-300 rounded-lg text-sm font-medium"
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
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={isKh ? 'បន្ថែមជំនាញពិសេស' : 'Add Specialty'}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
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
                              const input = document.querySelector('input[placeholder*="специализацию"], input[placeholder*="спеціалізацію"], input[placeholder*="Specialty"]') as HTMLInputElement;
                              const value = input?.value.trim();
                              if (value && !(profile.specialties || []).includes(value)) {
                                handleProfileChange('specialties', [...(profile.specialties || []), value]);
                                input.value = '';
                              }
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
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
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isKh ? 'ព័ត៌មានអាជីវកម្ម' : 'Business Information'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isKh ? 'ការកំណត់ម៉ោងធ្វើការ និងសេវាកម្ម' : 'Work schedule and service settings'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Business Hours */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" />
                        {isKh ? 'ម៉ោងធ្វើការ' : 'Business Hours'}
                      </h3>
                      <div className="space-y-3">
                        {profile.businessHours && Object.entries(profile.businessHours).map(([day, hours]) => (
                          <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className="w-full sm:w-24">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {isKh
                                  ? day === 'monday' ? 'ច័ន្ទ'
                                  : day === 'tuesday' ? 'អង្គារ'
                                  : day === 'wednesday' ? 'ពុធ'
                                  : day === 'thursday' ? 'ព្រហស្បតិ៍'
                                  : day === 'friday' ? 'សុក្រ'
                                  : day === 'saturday' ? 'សៅរ៍'
                                  : 'អាទិត្យ'
                                  : day.charAt(0).toUpperCase() + day.slice(1)
                                }
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
                                        ...hours,
                                        isOpen: e.target.checked
                                      }
                                    };
                                    handleProfileChange('businessHours', newBusinessHours);
                                  }
                                }}
                                className="rounded text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {isKh ? 'បើក' : 'Open'}
                              </span>
                            </label>
                            {hours.isOpen && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={hours.startTime}
                                  disabled={!isEditing}
                                  onChange={(e) => {
                                    if (isEditing) {
                                      const newBusinessHours = {
                                        ...profile.businessHours,
                                        [day]: {
                                          ...hours,
                                          startTime: e.target.value
                                        }
                                      };
                                      handleProfileChange('businessHours', newBusinessHours);
                                    }
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                  type="time"
                                  value={hours.endTime}
                                  disabled={!isEditing}
                                  onChange={(e) => {
                                    if (isEditing) {
                                      const newBusinessHours = {
                                        ...profile.businessHours,
                                        [day]: {
                                          ...hours,
                                          endTime: e.target.value
                                        }
                                      };
                                      handleProfileChange('businessHours', newBusinessHours);
                                    }
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCardIcon className="h-5 w-5" />
                        {isKh ? 'វិធីសាស្រ្តបង់ប្រាក់' : 'Payment Methods'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['cash', 'card', 'transfer', 'aba', 'khqr', 'paypal', 'crypto', 'apple_pay'].map((method) => (
                          <div 
                            key={method}
                            onClick={() => {
                              if (!isEditing) return;
                              const currentMethods = profile.paymentMethods || [];
                              const isSelected = currentMethods.includes(method);
                              const newMethods = isSelected 
                                ? currentMethods.filter(m => m !== method)
                                : [...currentMethods, method];
                              handleProfileChange('paymentMethods', newMethods);
                            }}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              (profile.paymentMethods || []).includes(method)
                                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'
                            } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {method === 'cash' ? (isKh ? 'សាច់ប្រាក់' : 'Cash')
                                : method === 'card' ? (isKh ? 'កាត' : 'Card')
                                : method === 'transfer' ? (isKh ? 'ផ្ទេរ' : 'Transfer')
                                : method === 'aba' ? 'ABA'
                                : method === 'khqr' ? 'KHQR'
                                : method === 'paypal' ? 'PayPal'
                                : method === 'crypto' ? (isKh ? 'គ្រីបតូ' : 'Crypto')
                                : method === 'apple_pay' ? 'Apple Pay'
                                : method}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ABA / KHQR bank details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCardIcon className="h-5 w-5" />
                        {isKh ? 'ព័ត៌មានធនាគារ' : 'Bank Details'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {isKh ? 'បន្ថែមព័ត៌មានគណនី និងរូបភាព QR សម្រាប់ការទូទាត់ ABA ឬ KHQR។' : 'Add account details and a QR image for ABA or KHQR payments.'}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['ABA', 'KHQR'] as const).map((type) => {
                          const account =
                            (profile.bankAccounts || []).find((item) => item.type === type) ||
                            { type, accountName: '', accountNumber: '', qrImageUrl: '' };
                          return (
                            <div key={type} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                              <div className="flex items-center justify-between mb-4">
                                <span className="font-semibold text-gray-900 dark:text-white">{type}</span>
                                {account.qrImageUrl && (
                                  <img
                                    src={account.qrImageUrl}
                                    alt={`${type} QR`}
                                    className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-gray-600"
                                  />
                                )}
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isKh ? 'ឈ្មោះគណនី' : 'Account Name'}
                                  </label>
                                  <input
                                    type="text"
                                    value={account.accountName}
                                    disabled={!isEditing}
                                    onChange={(e) => updateBankAccount(type, { accountName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                                    placeholder={isKh ? 'ឈ្មោះម្ចាស់គណនី' : 'Account holder name'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isKh ? 'លេខគណនី' : 'Account Number'}
                                  </label>
                                  <input
                                    type="text"
                                    value={account.accountNumber}
                                    disabled={!isEditing}
                                    onChange={(e) => updateBankAccount(type, { accountNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                                    placeholder={isKh ? 'ឧ. 00123456789' : 'e.g. 00123456789'}
                                  />
                                </div>
                                <div className="flex items-center gap-3">
                                  {isEditing && (
                                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:border-primary-400">
                                      <CameraIcon className="h-4 w-4" />
                                      {bankUploadState[type] ? (isKh ? 'កំពុងផ្ទុក...' : 'Uploading...') : (isKh ? 'បញ្ចូល QR' : 'Upload QR')}
                                        <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/heic,image/heif"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleBankQrUpload(type, file);
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                  {isEditing && account.qrImageUrl && (
                                    <button
                                      type="button"
                                      onClick={() => updateBankAccount(type, { qrImageUrl: '' })}
                                      className="text-sm text-red-500 hover:text-red-600"
                                    >
                                      {isKh ? 'លុប QR' : 'Remove QR'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Service Area */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPinIcon className="h-5 w-5" />
                        {isKh ? 'តំបន់សេវាកម្ម' : 'Service Area'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {isKh ? 'កាំ (គម)' : 'Radius (km)'}
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

              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isKh ? 'ផតហ្វូលីអូ' : 'Portfolio'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isKh ? 'បង្ហាញការងារ និងសមិទ្ធផលរបស់អ្នក' : 'Showcase your work and achievements'}
                      </p>
                    </div>
                    {isEditing && (
                      <div className="relative">
                        <input
                          type="file"
                          id="portfolio-upload"
                          accept="image/*"
                          onChange={handlePortfolioUpload}
                          className="hidden"
                          disabled={isUploadingPortfolio}
                        />
                        <button
                          onClick={() => document.getElementById('portfolio-upload')?.click()}
                          disabled={isUploadingPortfolio}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploadingPortfolio ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              {isKh ? 'កំពុងផ្ទុក...' : 'Uploading...'}
                            </>
                          ) : (
                            <>
                              <PlusIcon className="h-4 w-4" />
                              {isKh ? 'បន្ថែមរូបភាព' : 'Add Photo'}
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {isKh
                            ? 'ទំហំឯកសារអតិបរមា: 5MB។ ទ្រង់ទ្រាយដែលគាំទ្រ: JPG, PNG, WebP'
                            : 'Maximum file size: 5MB. Supported formats: JPG, PNG, WebP'}
                        </p>
                      </div>
                    )}
                  </div>

                  {profile.portfolio && profile.portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.portfolio.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={getAbsoluteImageUrl(item.imageUrl)}
                              alt={item.title || `Portfolio item ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                console.error('Portfolio image failed to load:', item.imageUrl);
                                // Hide broken images
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={(e) => {
                                console.log('✅ Portfolio image loaded successfully:', item.imageUrl);
                              }}
                            />
                          </div>
                          {item.title && (
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                {item.title}
                              </h3>
                              {item.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-xs">
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
                              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {isKh ? 'ផតហ្វូលីអូទទេ' : 'Portfolio is empty'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isKh ? 'បន្ថែមរូបភាពការងាររបស់អ្នក ដើម្បីឲ្យអតិថិជនឃើញជំនាញ' : 'Add photos of your work to show clients your skills'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              {isEditing && (
                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700 rounded-b-2xl border-t border-gray-200 dark:border-gray-600">
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {isKh ? 'បោះបង់' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      )}
                      {saving 
                        ? (isKh ? 'កំពុងរក្សាទុក...' : 'Saving...')
                        : (isKh ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')
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
