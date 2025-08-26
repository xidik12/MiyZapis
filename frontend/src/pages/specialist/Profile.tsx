import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
import { userService } from '../../services/user.service';
import { isFeatureEnabled } from '../../config/features';
import { ProfessionDropdown } from '../../components/ui/ProfessionDropdown';
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
} from '@heroicons/react/24/outline';

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

const SpecialistProfile: React.FC = () => {
  const { language } = useLanguage();
  const user = useAppSelector(selectUser);
  
  // State management
  const [profile, setProfile] = useState<SpecialistProfile>(getEmptyProfile());
  const [originalProfile, setOriginalProfile] = useState<SpecialistProfile>(getEmptyProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Success/Error message states
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  // Fix verification date formatting
  const formatVerificationDate = (date: string) => {
    if (!date || date === '' || date === 'Invalid Date') return null;
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj.toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
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
    const hasWorkingDays = Object.values(profile.businessHours).some(day => day.isOpen);
    if (hasWorkingDays) completedFields++;

    // Experience
    totalFields++;
    if (profile.experience > 0) completedFields++;

    // Languages
    totalFields++;
    if (profile.languages.length > 0) completedFields++;

    // Specialties
    totalFields++;
    if (profile.specialties.length > 0) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        
        if (user && isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
          try {
            const specialistData = await specialistService.getProfile();
            const updatedProfile = {
              ...getEmptyProfile(),
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phone: user.phoneNumber || '',
              profession: specialistData.businessName || '',
              experience: specialistData.experience || 0,
              specialties: specialistData.specialties || [],
              location: {
                ...getEmptyProfile().location,
                address: specialistData.address || '',
                city: specialistData.city || '',
                region: specialistData.state || '',
                country: specialistData.country || '',
              },
              verification: {
                ...getEmptyProfile().verification,
                isVerified: specialistData.isVerified || false,
                verifiedDate: specialistData.isVerified && specialistData.verifiedDate 
                  ? specialistData.verifiedDate 
                  : specialistData.isVerified 
                  ? new Date().toISOString().split('T')[0] 
                  : '',
              },
            };
            setProfile(updatedProfile);
            setOriginalProfile(updatedProfile);
          } catch (specialistError) {
            console.warn('Specialist API not available, using user data only:', specialistError);
            const basicProfile = {
              ...getEmptyProfile(),
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phone: user.phoneNumber || '',
            };
            setProfile(basicProfile);
            setOriginalProfile(basicProfile);
          }
        } else {
          const basicProfile = {
            ...getEmptyProfile(),
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: user?.phoneNumber || '',
          };
          setProfile(basicProfile);
          setOriginalProfile(basicProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        showErrorNotification(
          language === 'uk' 
            ? 'Не вдалося завантажити профіль' 
            : language === 'ru' 
            ? 'Не удалось загрузить профиль' 
            : 'Failed to load profile'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, language]);

  // Handle profile changes
  const handleProfileChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
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
      errors.firstName = language === 'uk' ? 'Ім\'я обов\'язкове' : language === 'ru' ? 'Имя обязательно' : 'First name is required';
    }
    if (!profile.lastName?.trim()) {
      errors.lastName = language === 'uk' ? 'Прізвище обов\'язкове' : language === 'ru' ? 'Фамилия обязательна' : 'Last name is required';
    }
    if (!profile.email?.trim()) {
      errors.email = language === 'uk' ? 'Email обов\'язковий' : language === 'ru' ? 'Email обязателен' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email = language === 'uk' ? 'Невірний формат email' : language === 'ru' ? 'Неверный формат email' : 'Invalid email format';
    }
    if (!profile.profession?.trim()) {
      errors.profession = language === 'uk' ? 'Професія обов\'язкова' : language === 'ru' ? 'Профессия обязательна' : 'Profession is required';
    }
    
    // Validate phone if provided
    if (profile.phone && profile.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(profile.phone)) {
      errors.phone = language === 'uk' ? 'Невірний формат телефону' : language === 'ru' ? 'Неверный формат телефона' : 'Invalid phone format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save profile
  const handleSave = async () => {
    if (!validateProfile()) {
      // Show specific validation errors
      const errorFields = Object.keys(validationErrors);
      const errorMessage = errorFields.length > 0 
        ? (language === 'uk' 
          ? `Будь ласка, заповніть обов'язкові поля: ${errorFields.map(field => {
              switch(field) {
                case 'firstName': return "Ім'я";
                case 'lastName': return 'Прізвище';
                case 'email': return 'Email';
                case 'profession': return 'Професія';
                default: return field;
              }
            }).join(', ')}`
          : language === 'ru'
          ? `Пожалуйста, заполните обязательные поля: ${errorFields.map(field => {
              switch(field) {
                case 'firstName': return 'Имя';
                case 'lastName': return 'Фамилия';
                case 'email': return 'Email';
                case 'profession': return 'Профессия';
                default: return field;
              }
            }).join(', ')}`
          : `Please fill in the required fields: ${errorFields.map(field => {
              switch(field) {
                case 'firstName': return 'First Name';
                case 'lastName': return 'Last Name';
                case 'email': return 'Email';
                case 'profession': return 'Profession';
                default: return field;
              }
            }).join(', ')}`)
        : (language === 'uk'
          ? 'Будь ласка, виправте помилки у формі'
          : language === 'ru'
          ? 'Пожалуйста, исправьте ошибки в форме'
          : 'Please fix the errors in the form');
          
      showErrorNotification(errorMessage);
      return;
    }

    try {
      setSaving(true);
      
      if (isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
        try {
          // Prepare the specialist profile data for API
          const specialistData = {
            bio: profile.bio,
            bioUk: profile.bioUk,
            bioRu: profile.bioRu,
            profession: profile.profession,
            specialties: JSON.stringify(profile.specialties),
            experience: profile.experience,
            hourlyRate: profile.hourlyRate,
            currency: profile.currency,
            availability: JSON.stringify(profile.availability),
            location: JSON.stringify(profile.location),
            contactInfo: JSON.stringify(profile.contactInfo),
            businessHours: JSON.stringify(profile.businessHours),
            languages: JSON.stringify(profile.languages),
            education: JSON.stringify(profile.education),
            certifications: JSON.stringify(profile.certifications),
            socialMedia: JSON.stringify(profile.socialMedia),
            avatar: profile.avatar,
            portfolio: JSON.stringify(profile.portfolio),
            workingHours: JSON.stringify(profile.workingHours),
            isAvailableForBooking: profile.isAvailableForBooking
          };

          // Call the API to update the specialist profile
          await specialistService.updateProfile(specialistData);
          
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
          const updatedProfile = await specialistService.getProfile();
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
      
      showSuccessNotification(
        language === 'uk' 
          ? 'Профіль успішно збережено!'
          : language === 'ru'
          ? 'Профиль успешно сохранен!'
          : 'Profile saved successfully!'
      );
      
    } catch (error) {
      console.error('Error saving profile:', error);
      showErrorNotification(
        language === 'uk' 
          ? 'Не вдалося зберегти зміни'
          : language === 'ru'
          ? 'Не удалось сохранить изменения'
          : 'Failed to save changes'
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (window.confirm(
        language === 'uk' 
          ? 'У вас є незбережені зміни. Скасувати редагування?' 
          : language === 'ru' 
          ? 'У вас есть несохраненные изменения. Отменить редактирование?' 
          : 'You have unsaved changes. Cancel editing?'
      )) {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'uk' ? 'Завантаження профілю...' : language === 'ru' ? 'Загрузка профиля...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  const completionPercentage = getProfileCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Success/Error Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-success-200 dark:border-success-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-success-800 dark:text-success-200 font-semibold text-sm mb-1">
                {language === 'uk' ? 'Успішно!' : language === 'ru' ? 'Успешно!' : 'Success!'}
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
                {language === 'uk' ? 'Помилка!' : language === 'ru' ? 'Ошибка!' : 'Error!'}
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
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-800">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          console.log('Avatar upload:', file.name);
                        }
                      }}
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
                      {profile.profession || (language === 'uk' ? 'Професія не вказана' : language === 'ru' ? 'Профессия не указана' : 'Profession not specified')}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {/* Profile Completion */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {completionPercentage}% {language === 'uk' ? 'завершено' : language === 'ru' ? 'завершено' : 'complete'}
                    </span>
                  </div>
                  
                  {/* Verification Badge */}
                  {profile.verification.isVerified && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300 rounded-xl border border-success-200 dark:border-success-800">
                      <DocumentCheckIcon className="h-5 w-5" />
                      <span className="font-medium text-sm">
                        {language === 'uk' ? 'Підтверджено' : language === 'ru' ? 'Подтверждено' : 'Verified'}
                      </span>
                      {formatVerificationDate(profile.verification.verifiedDate) && (
                        <span className="text-xs opacity-75 ml-1">
                          ({formatVerificationDate(profile.verification.verifiedDate)})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Unsaved Changes Warning */}
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300 rounded-xl border border-warning-200 dark:border-warning-800">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="font-medium text-sm">
                        {language === 'uk' ? 'Незбережені зміни' : language === 'ru' ? 'Несохраненные изменения' : 'Unsaved changes'}
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
                    if (user?.userType === 'SPECIALIST') {
                      // Open specialist's public profile in a new tab - use current user ID
                      const publicProfileUrl = `/specialist/${user.id}`;
                      window.open(publicProfileUrl, '_blank');
                    } else {
                      console.warn('User is not a specialist');
                      showErrorNotification(
                        language === 'uk' ? 'Профіль недоступний для перегляду' : 
                        language === 'ru' ? 'Профиль недоступен для просмотра' : 
                        'Profile not available for preview'
                      );
                    }
                  }}
                  className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  {language === 'uk' ? 'Перегляд' : language === 'ru' ? 'Просмотр' : 'Preview'}
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
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isEditing ? (
                  <>
                    <XCircleIcon className="h-5 w-5" />
                    {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отменить' : 'Cancel'}
                  </>
                ) : (
                  <>
                    <PencilSquareIcon className="h-5 w-5" />
                    {language === 'uk' ? 'Редагувати' : language === 'ru' ? 'Редактировать' : 'Edit Profile'}
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
                {language === 'uk' ? 'Розділи профілю' : language === 'ru' ? 'Разделы профиля' : 'Profile Sections'}
              </h3>
              <nav className="space-y-2">
                {[
                  { id: 'personal', name: language === 'uk' ? 'Особиста інформація' : language === 'ru' ? 'Личная информация' : 'Personal Info', icon: UserCircleIcon },
                  { id: 'professional', name: language === 'uk' ? 'Професійне' : language === 'ru' ? 'Профессиональное' : 'Professional', icon: BriefcaseIcon },
                  { id: 'business', name: language === 'uk' ? 'Бізнес' : language === 'ru' ? 'Бизнес' : 'Business', icon: BuildingOfficeIcon },
                  { id: 'portfolio', name: language === 'uk' ? 'Портфоліо' : language === 'ru' ? 'Портфолио' : 'Portfolio', icon: PhotoIcon }
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
                        {language === 'uk' ? 'Особиста інформація' : language === 'ru' ? 'Личная информация' : 'Personal Information'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {language === 'uk' ? 'Основні дані вашого профілю' : language === 'ru' ? 'Основные данные вашего профиля' : 'Basic information about you'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Ім\'я *' : language === 'ru' ? 'Имя *' : 'First Name *'}
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
                          placeholder={language === 'uk' ? 'Введіть ім\'я' : language === 'ru' ? 'Введите имя' : 'Enter first name'}
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
                          {language === 'uk' ? 'Прізвище *' : language === 'ru' ? 'Фамилия *' : 'Last Name *'}
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
                          placeholder={language === 'uk' ? 'Введіть прізвище' : language === 'ru' ? 'Введите фамилию' : 'Enter last name'}
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
                          {language === 'uk' ? 'Електронна пошта *' : language === 'ru' ? 'Электронная почта *' : 'Email *'}
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
                            placeholder={language === 'uk' ? 'example@email.com' : language === 'ru' ? 'example@email.com' : 'example@email.com'}
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
                          {language === 'uk' ? 'Телефон' : language === 'ru' ? 'Телефон' : 'Phone'}
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
                        {language === 'uk' ? 'Про себе' : language === 'ru' ? 'О себе' : 'Bio'}
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
                        placeholder={language === 'uk' ? 'Розкажіть про себе...' : language === 'ru' ? 'Расскажите о себе...' : 'Tell us about yourself...'}
                      />
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Адреса' : language === 'ru' ? 'Адрес' : 'Address'}
                        </label>
                        <div className="relative">
                          <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            id="address"
                            name="address"
                            type="text"
                            value={profile.location?.address || ''}
                            disabled={!isEditing}
                            onChange={(e) => handleProfileChange('location', {...(profile.location || {}), address: e.target.value})}
                            autoComplete="street-address"
                            className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                              !isEditing 
                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } disabled:cursor-not-allowed dark:border-gray-600`}
                            placeholder={language === 'uk' ? 'вул. Хрещатик, 1' : language === 'ru' ? 'ул. Крещатик, 1' : 'Khreshchatyk Street, 1'}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Місто' : language === 'ru' ? 'Город' : 'City'}
                        </label>
                        <input
                          id="city"
                          name="city"
                          type="text"
                          value={profile.location?.city || ''}
                          disabled={!isEditing}
                          onChange={(e) => handleProfileChange('location', {...(profile.location || {}), city: e.target.value})}
                          autoComplete="address-level2"
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 border-gray-300 focus:border-primary-500 focus:ring-primary-500 ${
                            !isEditing 
                              ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          } disabled:cursor-not-allowed dark:border-gray-600`}
                          placeholder={language === 'uk' ? 'Київ' : language === 'ru' ? 'Киев' : 'Kyiv'}
                        />
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
                        {language === 'uk' ? 'Професійна інформація' : language === 'ru' ? 'Профессиональная информация' : 'Professional Information'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {language === 'uk' ? 'Ваші професійні навички та досвід' : language === 'ru' ? 'Ваши профессиональные навыки и опыт' : 'Your professional skills and experience'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Profession */}
                    <div>
                      <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'uk' ? 'Професія *' : language === 'ru' ? 'Профессия *' : 'Profession *'}
                      </label>
                      {isEditing ? (
                        <ProfessionDropdown
                          value={profile.profession || ''}
                          onChange={(value) => handleProfileChange('profession', value)}
                          onCustomProfession={(customValue) => handleProfileChange('profession', customValue)}
                          placeholder={language === 'uk' ? 'Оберіть професію' : language === 'ru' ? 'Выберите профессию' : 'Select a profession'}
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
                            placeholder={language === 'uk' ? 'Професія не вказана' : language === 'ru' ? 'Профессия не указана' : 'Profession not specified'}
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
                        {language === 'uk' ? 'Досвід роботи (років)' : language === 'ru' ? 'Опыт работы (лет)' : 'Years of Experience'}
                      </label>
                      <input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        max="50"
                        value={profile.experience || 0}
                        disabled={!isEditing}
                        onChange={(e) => handleProfileChange('experience', parseInt(e.target.value) || 0)}
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
                        {language === 'uk' ? 'Освіта' : language === 'ru' ? 'Образование' : 'Education'}
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
                          placeholder={language === 'uk' ? 'Опишіть вашу освіту та кваліфікації...' : language === 'ru' ? 'Опишите ваше образование и квалификации...' : 'Describe your education and qualifications...'}
                        />
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'uk' ? 'Мови' : language === 'ru' ? 'Языки' : 'Languages'}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 rounded-lg text-sm font-medium"
                          >
                            <GlobeAltIcon className="h-4 w-4" />
                            {lang === 'uk' ? 'Українська' : lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : lang}
                            {isEditing && (
                              <button
                                onClick={() => {
                                  const newLanguages = profile.languages.filter((_, i) => i !== index);
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
                              if (e.target.value && !profile.languages.includes(e.target.value)) {
                                handleProfileChange('languages', [...profile.languages, e.target.value]);
                              }
                              e.target.value = '';
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                          >
                            <option value="">{language === 'uk' ? 'Додати мову' : language === 'ru' ? 'Добавить язык' : 'Add Language'}</option>
                            <option value="uk">Українська</option>
                            <option value="ru">Русский</option>
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
                        {language === 'uk' ? 'Спеціалізації' : language === 'ru' ? 'Специализации' : 'Specialties'}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-secondary-100 text-secondary-700 dark:bg-secondary-900/20 dark:text-secondary-300 rounded-lg text-sm font-medium"
                          >
                            <StarIcon className="h-4 w-4" />
                            {specialty}
                            {isEditing && (
                              <button
                                onClick={() => {
                                  const newSpecialties = profile.specialties.filter((_, i) => i !== index);
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
                            placeholder={language === 'uk' ? 'Додати спеціалізацію' : language === 'ru' ? 'Добавить специализацию' : 'Add Specialty'}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = (e.target as HTMLInputElement).value.trim();
                                if (value && !profile.specialties.includes(value)) {
                                  handleProfileChange('specialties', [...profile.specialties, value]);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const input = document.querySelector('input[placeholder*="специализацию"], input[placeholder*="спеціалізацію"], input[placeholder*="Specialty"]') as HTMLInputElement;
                              const value = input?.value.trim();
                              if (value && !profile.specialties.includes(value)) {
                                handleProfileChange('specialties', [...profile.specialties, value]);
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
                        {language === 'uk' ? 'Бізнес інформація' : language === 'ru' ? 'Бизнес информация' : 'Business Information'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {language === 'uk' ? 'Налаштування роботи та обслуговування' : language === 'ru' ? 'Настройки работы и обслуживания' : 'Work schedule and service settings'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Business Hours */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" />
                        {language === 'uk' ? 'Графік роботи' : language === 'ru' ? 'График работы' : 'Business Hours'}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(profile.businessHours).map(([day, hours]) => (
                          <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className="w-24">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {language === 'uk' 
                                  ? day === 'monday' ? 'Понеділок' 
                                  : day === 'tuesday' ? 'Вівторок'
                                  : day === 'wednesday' ? 'Середа'
                                  : day === 'thursday' ? 'Четвер'
                                  : day === 'friday' ? 'П\'ятниця'
                                  : day === 'saturday' ? 'Субота'
                                  : 'Неділя'
                                  : language === 'ru'
                                  ? day === 'monday' ? 'Понедельник' 
                                  : day === 'tuesday' ? 'Вторник'
                                  : day === 'wednesday' ? 'Среда'
                                  : day === 'thursday' ? 'Четверг'
                                  : day === 'friday' ? 'Пятница'
                                  : day === 'saturday' ? 'Суббота'
                                  : 'Воскресенье'
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
                                {language === 'uk' ? 'Відкрито' : language === 'ru' ? 'Открыто' : 'Open'}
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
                        {language === 'uk' ? 'Способи оплати' : language === 'ru' ? 'Способы оплаты' : 'Payment Methods'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['cash', 'card', 'transfer', 'paypal', 'crypto', 'apple_pay'].map((method) => (
                          <div 
                            key={method}
                            onClick={() => {
                              if (!isEditing) return;
                              const currentMethods = profile.paymentMethods;
                              const isSelected = currentMethods.includes(method);
                              const newMethods = isSelected 
                                ? currentMethods.filter(m => m !== method)
                                : [...currentMethods, method];
                              handleProfileChange('paymentMethods', newMethods);
                            }}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              profile.paymentMethods.includes(method)
                                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'
                            } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {method === 'cash' ? (language === 'uk' ? 'Готівка' : language === 'ru' ? 'Наличные' : 'Cash')
                                : method === 'card' ? (language === 'uk' ? 'Картка' : language === 'ru' ? 'Карта' : 'Card')
                                : method === 'transfer' ? (language === 'uk' ? 'Переказ' : language === 'ru' ? 'Перевод' : 'Transfer')
                                : method === 'paypal' ? 'PayPal'
                                : method === 'crypto' ? (language === 'uk' ? 'Крипто' : language === 'ru' ? 'Крипто' : 'Crypto')
                                : method === 'apple_pay' ? 'Apple Pay'
                                : method}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Service Area */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPinIcon className="h-5 w-5" />
                        {language === 'uk' ? 'Зона обслуговування' : language === 'ru' ? 'Зона обслуживания' : 'Service Area'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {language === 'uk' ? 'Радіус (км)' : language === 'ru' ? 'Радиус (км)' : 'Radius (km)'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={profile.serviceArea.radius}
                            disabled={!isEditing}
                            onChange={(e) => {
                              if (isEditing) {
                                const newServiceArea = {
                                  ...profile.serviceArea,
                                  radius: parseInt(e.target.value) || 0
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
                        {language === 'uk' ? 'Портфоліо' : language === 'ru' ? 'Портфолио' : 'Portfolio'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {language === 'uk' ? 'Покажіть свої роботи та досягнення' : language === 'ru' ? 'Покажите свои работы и достижения' : 'Showcase your work and achievements'}
                      </p>
                    </div>
                  </div>

                  <div className="text-center py-16">
                    <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {language === 'uk' ? 'Портфоліо поки порожнє' : language === 'ru' ? 'Портфолио пока пустое' : 'Portfolio is empty'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {language === 'uk' ? 'Додайте фотографії своїх робіт, щоб клієнти побачили ваші навички' : language === 'ru' ? 'Добавьте фотографии своих работ, чтобы клиенты увидели ваши навыки' : 'Add photos of your work to show clients your skills'}
                    </p>
                    {isEditing && (
                      <button className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto">
                        <PlusIcon className="h-5 w-5" />
                        {language === 'uk' ? 'Додати фото' : language === 'ru' ? 'Добавить фото' : 'Add Photo'}
                      </button>
                    )}
                  </div>
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
                      {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отменить' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      )}
                      {saving 
                        ? (language === 'uk' ? 'Збереження...' : language === 'ru' ? 'Сохранение...' : 'Saving...')
                        : (language === 'uk' ? 'Зберегти зміни' : language === 'ru' ? 'Сохранить изменения' : 'Save Changes')
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