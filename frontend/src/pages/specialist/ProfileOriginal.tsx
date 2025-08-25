import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
import { userService } from '../../services/user.service';
import { isFeatureEnabled } from '../../config/features';
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
  ArrowDownTrayIcon
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
    monday: { isOpen: false, startTime: '', endTime: '' },
    tuesday: { isOpen: false, startTime: '', endTime: '' },
    wednesday: { isOpen: false, startTime: '', endTime: '' },
    thursday: { isOpen: false, startTime: '', endTime: '' },
    friday: { isOpen: false, startTime: '', endTime: '' },
    saturday: { isOpen: false, startTime: '', endTime: '' },
    sunday: { isOpen: false, startTime: '', endTime: '' },
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
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const user = useAppSelector(selectUser);
  
  // Helper function to get localized portfolio item content
  const getPortfolioItemText = (item: PortfolioItem, field: 'title' | 'description' | 'category'): string => {
    if (language === 'uk') {
      return (field === 'title' ? item.titleUk : field === 'description' ? item.descriptionUk : item.categoryUk) || item[field];
    }
    if (language === 'ru') {
      return (field === 'title' ? item.titleRu : field === 'description' ? item.descriptionRu : item.categoryRu) || item[field];
    }
    return item[field];
  };
  
  const [profile, setProfile] = useState<SpecialistProfile>(getEmptyProfile());
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'business' | 'portfolio' | 'security'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [portfolioError, setPortfolioError] = useState('');
  const [portfolioFormData, setPortfolioFormData] = useState({ title: '', description: '', category: '' });
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<SpecialistProfile>(getEmptyProfile());
  
  // Success/Error message states
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorAnimation, setShowErrorAnimation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    let completedFields = 0;
    let totalFields = 0;

    // Basic info fields (5 fields)
    const basicFields = ['firstName', 'lastName', 'email', 'phone', 'bio'];
    basicFields.forEach(field => {
      totalFields++;
      if (field === 'bio' ? profile.bio.trim() : (profile as any)[field]?.trim()) {
        completedFields++;
      }
    });

    // Professional fields (4 fields)
    totalFields += 4;
    if (profile.profession.trim()) completedFields++;
    if (profile.experience > 0) completedFields++;
    if (profile.education.trim()) completedFields++;
    if (profile.specialties.length > 0) completedFields++;

    // Business fields (3 fields)
    totalFields += 3;
    if (profile.paymentMethods.length > 0) completedFields++;
    if (Object.values(profile.businessHours).some(h => h.isOpen)) completedFields++;
    if (profile.location.city.trim()) completedFields++;

    // Portfolio (1 field)
    totalFields += 1;
    if (profile.portfolio.length > 0) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const completionPercentage = getProfileCompletion();
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [certificateError, setCertificateError] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [uploadedCertificates, setUploadedCertificates] = useState<{id: string, name: string, file: File, preview?: string}[]>([]);

  // Load profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError(null);
        setFieldErrors({}); // Clear any previous field errors
        
        // Always initialize with user data if available, otherwise use empty profile
        const initialProfile: SpecialistProfile = {
          ...getEmptyProfile(),
          id: user?.id || '1',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: user?.phoneNumber || user?.phone || '',
        };
        
        setProfile(initialProfile);
        setOriginalProfile(initialProfile);
        
        // If user is a specialist, try to load specialist profile
        if (user?.userType === 'specialist' && isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
          try {
            const specialistData = await specialistService.getProfile();
            // Map specialist data to profile format
            const updatedProfile = {
              ...initialProfile,
              bio: specialistData.description || '',
              profession: specialistData.businessName || '',
              experience: specialistData.experience || 0,
              specialties: specialistData.specialties || [],
              verification: {
                ...initialProfile.verification,
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
            // Specialist profile might not exist yet, which is fine for new users
            console.log('No specialist profile yet:', specialistError);
          }
        }
      } catch (err: any) {
        // Only set loading error, not validation error
        const errorMessage = err.message || 'Failed to load profile data';
        setError(errorMessage);
        console.error('Error loading profile:', err);
      } finally {
        // Always set loading to false
        setLoading(false);
      }
    };

    // Only load profile when user data is available or when needed
    if (user || profile.id === '1') {
      // Add a small delay to ensure smooth loading transition
      setTimeout(loadProfile, 100);
    }
  }, [user]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      uploadedCertificates.forEach(cert => {
        if (cert.preview) {
          URL.revokeObjectURL(cert.preview);
        }
      });
      portfolioImages.forEach(imageUrl => {
        if (imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
      });
    };
  }, []);

  const getLocalizedText = (field: string) => {
    if (language === 'uk' && (profile as any)[`${field}Uk`]) {
      return (profile as any)[`${field}Uk`];
    }
    if (language === 'ru' && (profile as any)[`${field}Ru`]) {
      return (profile as any)[`${field}Ru`];
    }
    return (profile as any)[field];
  };


  const getDayName = (day: string) => {
    const dayNames = {
      en: {
        monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
        friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
      },
      uk: {
        monday: 'Понеділок', tuesday: 'Вівторок', wednesday: 'Середа', thursday: 'Четвер',
        friday: 'П\'ятниця', saturday: 'Субота', sunday: 'Неділя'
      },
      ru: {
        monday: 'Понедельник', tuesday: 'Вторник', wednesday: 'Среда', thursday: 'Четверг',
        friday: 'Пятница', saturday: 'Суббота', sunday: 'Воскресенье'
      }
    };
    return dayNames[language as keyof typeof dayNames][day as keyof typeof dayNames.en];
  };

  const getPaymentMethodName = (method: string) => {
    const methods = {
      card: language === 'uk' ? 'Картка' : language === 'ru' ? 'Карта' : 'Card',
      cash: language === 'uk' ? 'Готівка' : language === 'ru' ? 'Наличные' : 'Cash',
      bank_transfer: language === 'uk' ? 'Банківський переказ' : language === 'ru' ? 'Банковский перевод' : 'Bank Transfer',
      apple_pay: 'Apple Pay',
    };
    return methods[method as keyof typeof methods] || method;
  };

  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Clear any previous errors
    setPortfolioError('');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPortfolioError(language === 'uk' ? 'Завантажуйте лише зображення' : language === 'ru' ? 'Загружайте только изображения' : 'Please upload only image files');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setPortfolioError(language === 'uk' ? 'Розмір файлу повинен бути менше 5МБ' : language === 'ru' ? 'Размер файла должен быть меньше 5МБ' : 'File size must be less than 5MB');
      return;
    }

    setPortfolioError('');
    setUploadingPortfolio(true);

    try {
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPortfolioImages(prev => [...prev, e.target!.result as string]);
          setShowPortfolioForm(true);
          setPortfolioError('');
        }
      };
      reader.readAsDataURL(file);

      // Reset form
      event.target.value = '';
      
    } catch (error) {
      setPortfolioError(language === 'uk' ? 'Не вдалося завантажити зображення' : language === 'ru' ? 'Не удалось загрузить изображение' : 'Failed to upload image. Please try again.');
      console.error('Portfolio upload error:', error);
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Clear any previous errors
    setCertificateError('');
    
    // Validate file type (images and PDFs allowed)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setCertificateError(language === 'uk' ? 'Завантажуйте лише зображення (JPG, PNG) або PDF файли' : language === 'ru' ? 'Загружайте только изображения (JPG, PNG) или PDF файлы' : 'Please upload only images (JPG, PNG) or PDF files');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setCertificateError(language === 'uk' ? 'Розмір файлу повинен бути менше 10МБ' : language === 'ru' ? 'Размер файла должен быть меньше 10МБ' : 'File size must be less than 10MB');
      return;
    }

    setCertificateError('');
    setUploadingCertificate(true);

    try {
      // Generate unique ID for the certificate
      const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create preview for images
      let preview = undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      
      // Add to uploaded certificates
      const newCertificate = {
        id: certificateId,
        name: file.name,
        file: file,
        preview: preview
      };
      
      setUploadedCertificates(prev => [...prev, newCertificate]);
      
      // Also add to profile certifications for display
      const newCertificationForProfile = {
        id: certificateId,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for display
        issuer: language === 'uk' ? 'Завантажено користувачем' : language === 'ru' ? 'Загружено пользователем' : 'User uploaded',
        dateIssued: new Date().toISOString().split('T')[0],
        documentUrl: preview || 'document'
      };
      
      setProfile(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertificationForProfile]
      }));
      
      // Reset input
      event.target.value = '';
      
      console.log('Certificate uploaded:', file.name);
      
    } catch (error) {
      setCertificateError(language === 'uk' ? 'Не вдалося завантажити сертифікат. Спробуйте ще раз.' : language === 'ru' ? 'Не удалось загрузить сертификат. Попробуйте еще раз.' : 'Failed to upload certificate. Please try again.');
      console.error('Certificate upload error:', error);
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handleRemoveCertificate = (certificateId: string) => {
    // Remove from uploaded certificates
    const certificateToRemove = uploadedCertificates.find(cert => cert.id === certificateId);
    if (certificateToRemove?.preview) {
      URL.revokeObjectURL(certificateToRemove.preview);
    }
    
    setUploadedCertificates(prev => prev.filter(cert => cert.id !== certificateId));
    
    // Remove from profile certifications
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== certificateId)
    }));
  };

  const handlePortfolioDelete = (index: number) => {
    const imageToDelete = portfolioImages[index];
    if (imageToDelete && imageToDelete.startsWith('blob:')) {
      URL.revokeObjectURL(imageToDelete);
    }
    setPortfolioImages(prev => prev.filter((_, i) => i !== index));
  };

  // Success/Error message handlers
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setTimeout(() => setSuccessMessage(''), 300);
    }, 3000);
  };

  const showErrorNotification = () => {
    setShowErrorAnimation(true);
    setTimeout(() => setShowErrorAnimation(false), 600);
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

  const handleSavePortfolioItem = () => {
    if (!portfolioFormData.title.trim()) {
      setPortfolioError(language === 'uk' ? 'Заголовок обов’язковий' : language === 'ru' ? 'Заголовок обязательный' : 'Title is required');
      return;
    }
    if (!portfolioFormData.description.trim()) {
      setPortfolioError(language === 'uk' ? 'Опис обов’язковий' : language === 'ru' ? 'Описание обязательно' : 'Description is required');
      return;
    }
    if (!portfolioFormData.category.trim()) {
      setPortfolioError(language === 'uk' ? 'Категорія обов’язкова' : language === 'ru' ? 'Категория обязательна' : 'Category is required');
      return;
    }

    // Create new portfolio item
    const lastImageIndex = portfolioImages.length - 1;
    if (lastImageIndex >= 0) {
      const newPortfolioItem: PortfolioItem = {
        id: `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: portfolioFormData.title,
        description: portfolioFormData.description,
        imageUrl: portfolioImages[lastImageIndex],
        category: portfolioFormData.category,
        dateAdded: new Date().toISOString().split('T')[0]
      };

      setProfile(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, newPortfolioItem]
      }));

      // Remove the temporary image from portfolioImages since it's now in portfolio
      setPortfolioImages(prev => prev.slice(0, -1));

      // Reset form
      setPortfolioFormData({ title: '', description: '', category: '' });
      setShowPortfolioForm(false);
      setPortfolioError('');
    }
  };

  const tabs = [
    {
      id: 'personal',
      name: language === 'uk' ? 'Особисте' : language === 'ru' ? 'Личное' : 'Personal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'professional',
      name: language === 'uk' ? 'Професійне' : language === 'ru' ? 'Профессиональное' : 'Professional',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      id: 'business',
      name: language === 'uk' ? 'Бізнес' : language === 'ru' ? 'Бизнес' : 'Business',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: 'portfolio',
      name: t('portfolio.title'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'security',
      name: language === 'uk' ? 'Безпека' : language === 'ru' ? 'Безопасность' : 'Security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'uk' ? 'Завантажуємо профіль...' : language === 'ru' ? 'Загружаем профиль...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">
            {language === 'uk' ? 'Помилка завантаження профілю' : language === 'ru' ? 'Ошибка загрузки профиля' : 'Error loading profile'}
          </div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {language === 'uk' ? 'Повторити' : language === 'ru' ? 'Повторить' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 relative">
      {/* Success/Error Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-success-200 dark:border-success-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-success-800 dark:text-success-200 font-medium text-sm">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && showErrorAnimation && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-error-200 dark:border-error-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <p className="text-error-800 dark:text-error-200 font-medium text-sm">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {language === 'uk' ? 'Бізнес-профіль' : language === 'ru' ? 'Бизнес-профиль' : 'Business Profile'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {language === 'uk' 
                    ? 'Керуйте своїм професійним профілем та налаштуваннями'
                    : language === 'ru'
                    ? 'Управляйте своим профессиональным профилем и настройками'
                    : 'Manage your professional profile and settings'
                  }
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                {/* Profile Completion Indicator */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          completionPercentage < 30 ? 'bg-red-500' :
                          completionPercentage < 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {completionPercentage}% {language === 'uk' ? 'завершено' : language === 'ru' ? 'завершено' : 'complete'}
                    </span>
                  </div>
                </div>
                
                {profile.verification.isVerified && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-success-100 text-success-700 rounded-xl font-medium">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {language === 'uk' ? 'Підтверджено' : language === 'ru' ? 'Подтверждено' : 'Verified'}
                  </span>
                )}
                
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {language === 'uk' ? 'Незбережені зміни' : language === 'ru' ? 'Несохраненные изменения' : 'Unsaved changes'}
                  </span>
                )}
                <button
                  onClick={() => {
                    if (isEditing && hasUnsavedChanges) {
                      if (window.confirm(language === 'uk' ? 'У вас є незбережені зміни. Скасувати редагування?' : language === 'ru' ? 'У вас есть несохраненные изменения. Отменить редактирование?' : 'You have unsaved changes. Cancel editing?')) {
                        setProfile(originalProfile);
                        setHasUnsavedChanges(false);
                        setIsEditing(false);
                        setFieldErrors({});
                        setError(null);
                      }
                    } else {
                      setIsEditing(!isEditing);
                      if (!isEditing) {
                        setOriginalProfile(profile);
                      }
                    }
                  }}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isEditing
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isEditing 
                    ? (language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отменить' : 'Cancel')
                    : (language === 'uk' ? 'Редагувати' : language === 'ru' ? 'Редактировать' : 'Edit Profile')
                  }
                </button>
              </div>
            </div>
            
            <UkrainianOrnament className="mb-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Error Display - Only show during editing mode for form errors */}
              {error && isEditing && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 dark:bg-red-900/20 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-red-700 dark:text-red-400 font-medium">
                        {language === 'uk' ? 'Виявлені помилки у формі' : language === 'ru' ? 'Обнаружены ошибки в форме' : 'Form validation errors detected'}
                      </p>
                      <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                        {language === 'uk' ? 'Будь ласка, виправте помічені червоним поля та спробуйте ще раз' : language === 'ru' ? 'Пожалуйста, исправьте отмеченные красным поля и попробуйте еще раз' : 'Please correct the fields marked in red and try again'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setError(null)}
                      className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
                {/* Personal Information Tab */}
                {activeTab === 'personal' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {language === 'uk' ? 'Особиста інформація' : language === 'ru' ? 'Личная информация' : 'Personal Information'}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Ім\'я' : language === 'ru' ? 'Имя' : 'First Name'}
                        </label>
                        <input
                          type="text"
                          value={profile.firstName}
                          disabled={!isEditing}
                          onChange={(e) => {
                            const newProfile = {...profile, firstName: e.target.value};
                            setProfile(newProfile);
                            setHasUnsavedChanges(JSON.stringify(newProfile) !== JSON.stringify(originalProfile));
                            if (fieldErrors.firstName) {
                              setFieldErrors(prev => {const {firstName, ...rest} = prev; return rest;});
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:ring-2 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300`}
                        />
                        {fieldErrors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Прізвище' : language === 'ru' ? 'Фамилия' : 'Last Name'}
                        </label>
                        <input
                          type="text"
                          value={profile.lastName}
                          disabled={!isEditing}
                          onChange={(e) => {
                            setProfile({...profile, lastName: e.target.value});
                            if (fieldErrors.lastName) {
                              setFieldErrors(prev => {const {lastName, ...rest} = prev; return rest;});
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:ring-2 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300`}
                        />
                        {fieldErrors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Електронна пошта' : language === 'ru' ? 'Электронная почта' : 'Email'}
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled={!isEditing}
                          onChange={(e) => {
                            setProfile({...profile, email: e.target.value});
                            if (fieldErrors.email) {
                              setFieldErrors(prev => {const {email, ...rest} = prev; return rest;});
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:ring-2 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300`}
                        />
                        {fieldErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Телефон' : language === 'ru' ? 'Телефон' : 'Phone'}
                        </label>
                        <input
                          type="tel"
                          value={profile.phone}
                          disabled={!isEditing}
                          onChange={(e) => {
                            setProfile({...profile, phone: e.target.value});
                            if (fieldErrors.phone) {
                              setFieldErrors(prev => {const {phone, ...rest} = prev; return rest;});
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:ring-2 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300`}
                        />
                        {fieldErrors.phone && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'uk' ? 'Про себе' : language === 'ru' ? 'О себе' : 'Bio'}
                      </label>
                      <textarea
                        value={getLocalizedText('bio')}
                        disabled={!isEditing}
                        onChange={(e) => {
                          const newProfile = {...profile, bio: e.target.value};
                          setProfile(newProfile);
                          setHasUnsavedChanges(JSON.stringify(newProfile) !== JSON.stringify(originalProfile));
                        }}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                      />
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'uk' ? 'Місцезнаходження' : language === 'ru' ? 'Местоположение' : 'Location'}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder={language === 'uk' ? 'Адреса' : language === 'ru' ? 'Адрес' : 'Address'}
                          value={profile.location.address}
                          disabled={!isEditing}
                          onChange={(e) => setProfile({...profile, location: {...profile.location, address: e.target.value}})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                        />
                        <input
                          type="text"
                          placeholder={language === 'uk' ? 'Місто' : language === 'ru' ? 'Город' : 'City'}
                          value={profile.location.city}
                          disabled={!isEditing}
                          onChange={(e) => setProfile({...profile, location: {...profile.location, city: e.target.value}})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {language === 'uk' ? 'Мови' : language === 'ru' ? 'Языки' : 'Languages'}
                        </label>
                        {isEditing && (
                          <div className="flex gap-2">
                            <select
                              onChange={(e) => {
                                const lang = e.target.value;
                                if (lang && !profile.languages.includes(lang)) {
                                  setProfile({...profile, languages: [...profile.languages, lang]});
                                  e.target.value = '';
                                }
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600"
                            >
                              <option value="" className="text-gray-900 dark:text-gray-100">{language === 'uk' ? 'Додати мову' : language === 'ru' ? 'Добавить язык' : 'Add Language'}</option>
                              <option value="uk" className="text-gray-900 dark:text-gray-100">Українська</option>
                              <option value="en" className="text-gray-900 dark:text-gray-100">English</option>
                              <option value="ru" className="text-gray-900 dark:text-gray-100">Русский</option>
                              <option value="de" className="text-gray-900 dark:text-gray-100">Deutsch</option>
                              <option value="fr" className="text-gray-900 dark:text-gray-100">Français</option>
                              <option value="es" className="text-gray-900 dark:text-gray-100">Español</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {profile.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium dark:bg-primary-900/30 dark:text-primary-300 flex items-center gap-2"
                          >
                            {lang === 'uk' ? 'Українська' : lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : lang === 'de' ? 'Deutsch' : lang === 'fr' ? 'Français' : lang === 'es' ? 'Español' : lang}
                            {isEditing && (
                              <button
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    languages: profile.languages.filter((_, i) => i !== index)
                                  });
                                }}
                                className="text-primary-500 hover:text-primary-700 ml-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </span>
                        ))}
                        {profile.languages.length === 0 && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                            {language === 'uk' ? 'Додайте мови, якими ви володієте' : language === 'ru' ? 'Добавьте языки, которыми владеете' : 'Add languages you speak'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Information Tab */}
                {activeTab === 'professional' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {language === 'uk' ? 'Професійна інформація' : language === 'ru' ? 'Профессиональная информация' : 'Professional Information'}
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Професія' : language === 'ru' ? 'Профессия' : 'Profession'}
                        </label>
                        <input
                          type="text"
                          value={profile.profession}
                          disabled={!isEditing}
                          onChange={(e) => {
                            setProfile({...profile, profession: e.target.value});
                            if (fieldErrors.profession) {
                              setFieldErrors(prev => {const {profession, ...rest} = prev; return rest;});
                            }
                          }}
                          placeholder={language === 'uk' ? 'Введіть професію' : language === 'ru' ? 'Введите профессию' : 'Enter profession'}
                          className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.profession ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:ring-2 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300`}
                        />
                        {fieldErrors.profession && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.profession}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Досвід (років)' : language === 'ru' ? 'Опыт (лет)' : 'Experience (years)'}
                        </label>
                        <input
                          type="number"
                          value={profile.experience}
                          disabled={!isEditing}
                          onChange={(e) => setProfile({...profile, experience: parseInt(e.target.value) || 0})}
                          placeholder="0"
                          min="0"
                          max="50"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'uk' ? 'Освіта' : language === 'ru' ? 'Образование' : 'Education'}
                        </label>
                        <textarea
                          value={getLocalizedText('education')}
                          disabled={!isEditing}
                          onChange={(e) => setProfile({...profile, education: e.target.value})}
                          placeholder={language === 'uk' ? 'Опишіть вашу освіту' : language === 'ru' ? 'Опишите ваше образование' : 'Describe your education'}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'uk' ? 'Спеціалізації' : language === 'ru' ? 'Специализации' : 'Specialties'}
                          </label>
                          {isEditing && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newSpecialty}
                                onChange={(e) => setNewSpecialty(e.target.value)}
                                placeholder={language === 'uk' ? 'Нова спеціалізація' : language === 'ru' ? 'Новая специализация' : 'New specialty'}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newSpecialty.trim()) {
                                    e.preventDefault();
                                    if (!profile.specialties.includes(newSpecialty.trim())) {
                                      setProfile({...profile, specialties: [...profile.specialties, newSpecialty.trim()]});
                                      setNewSpecialty('');
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  if (newSpecialty.trim() && !profile.specialties.includes(newSpecialty.trim())) {
                                    setProfile({...profile, specialties: [...profile.specialties, newSpecialty.trim()]});
                                    setNewSpecialty('');
                                  }
                                }}
                                className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                              >
                                {language === 'uk' ? 'Додати' : language === 'ru' ? 'Добавить' : 'Add'}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {profile.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg text-sm font-medium dark:bg-secondary-900/30 dark:text-secondary-300 flex items-center gap-2"
                            >
                              {specialty}
                              {isEditing && (
                                <button
                                  onClick={() => {
                                    setProfile({
                                      ...profile,
                                      specialties: profile.specialties.filter((_, i) => i !== index)
                                    });
                                  }}
                                  className="text-secondary-500 hover:text-secondary-700 ml-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </span>
                          ))}
                          {profile.specialties.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                              {language === 'uk' ? 'Додайте свої спеціалізації' : language === 'ru' ? 'Добавьте свои специализации' : 'Add your specialties'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {language === 'uk' ? 'Сертифікати' : language === 'ru' ? 'Сертификаты' : 'Certifications'}
                          </h3>
                          {isEditing && (
                            <div className="flex flex-col gap-2">
                              <label className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 cursor-pointer text-center">
                                {uploadingCertificate ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>{language === 'uk' ? 'Завантаження...' : language === 'ru' ? 'Загрузка...' : 'Uploading...'}</span>
                                  </div>
                                ) : (
                                  language === 'uk' ? 'Додати сертифікат' : language === 'ru' ? 'Добавить сертификат' : 'Add Certificate'
                                )}
                                <input
                                  type="file"
                                  onChange={handleCertificateUpload}
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  className="hidden"
                                  disabled={uploadingCertificate}
                                />
                              </label>
                              {certificateError && (
                                <p className="text-red-500 text-sm">{certificateError}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          {profile.certifications.map((cert) => {
                            const uploadedCert = uploadedCertificates.find(uc => uc.id === cert.id);
                            return (
                              <div key={cert.id} className="border border-gray-200 rounded-xl p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      {/* File Preview */}
                                      {uploadedCert?.preview ? (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-300">
                                          <img 
                                            src={uploadedCert.preview} 
                                            alt={cert.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : cert.documentUrl && cert.documentUrl !== 'document' ? (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-300">
                                          <img 
                                            src={cert.documentUrl} 
                                            alt={cert.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
                                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        </div>
                                      )}
                                      
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                                        <p className="text-gray-600 text-sm">{cert.issuer}</p>
                                        <p className="text-gray-500 text-sm mt-1">
                                          {new Date(cert.dateIssued).toLocaleDateString()} 
                                          {cert.expiryDate && ` - ${new Date(cert.expiryDate).toLocaleDateString()}`}
                                        </p>
                                        {uploadedCert && (
                                          <p className="text-primary-600 text-xs mt-1">
                                            {Math.round(uploadedCert.file.size / 1024)} KB • {uploadedCert.file.type.split('/')[1].toUpperCase()}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {isEditing && (
                                    <div className="flex gap-2">
                                      {/* View/Download button */}
                                      {uploadedCert && (
                                        <button
                                          onClick={() => {
                                            if (uploadedCert.preview) {
                                              window.open(uploadedCert.preview, '_blank');
                                            } else {
                                              // For PDFs and other files, create a download link
                                              const url = URL.createObjectURL(uploadedCert.file);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = uploadedCert.file.name;
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              URL.revokeObjectURL(url);
                                            }
                                          }}
                                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                          title={language === 'uk' ? 'Переглянути/Завантажити' : language === 'ru' ? 'Просмотреть/Скачать' : 'View/Download'}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                      )}
                                      {/* Remove button */}
                                      <button 
                                        onClick={() => handleRemoveCertificate(cert.id)}
                                        className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors duration-200"
                                        title={language === 'uk' ? 'Видалити сертифікат' : language === 'ru' ? 'Удалить сертификат' : 'Remove certificate'}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {profile.certifications.length === 0 && (
                            <div className="text-center py-8">
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-500">
                                {language === 'uk' ? 'Сертифікати не додано' : language === 'ru' ? 'Сертификаты не добавлены' : 'No certificates added'}
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                {language === 'uk' ? 'Додайте свої професійні сертифікати' : language === 'ru' ? 'Добавьте свои профессиональные сертификаты' : 'Add your professional certificates'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Settings Tab */}
                {activeTab === 'business' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {language === 'uk' ? 'Бізнес-налаштування' : language === 'ru' ? 'Бизнес-настройки' : 'Business Settings'}
                    </h2>
                    
                    <div className="space-y-8">
                      {/* Business Hours */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          {language === 'uk' ? 'Робочі години' : language === 'ru' ? 'Рабочие часы' : 'Business Hours'}
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(profile.businessHours).map(([day, hours]) => (
                            <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                              <div className="w-24">
                                <span className="font-medium text-gray-900">{getDayName(day)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={hours.isOpen}
                                  disabled={!isEditing}
                                  onChange={(e) => {
                                    if (isEditing) {
                                      setProfile({
                                        ...profile,
                                        businessHours: {
                                          ...profile.businessHours,
                                          [day]: {
                                            ...hours,
                                            isOpen: e.target.checked,
                                            startTime: e.target.checked ? hours.startTime || '09:00' : '',
                                            endTime: e.target.checked ? hours.endTime || '17:00' : ''
                                          }
                                        }
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {language === 'uk' ? 'Відкрито' : language === 'ru' ? 'Открыто' : 'Open'}
                                </span>
                              </div>
                              {hours.isOpen && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={hours.startTime}
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      if (isEditing) {
                                        setProfile({
                                          ...profile,
                                          businessHours: {
                                            ...profile.businessHours,
                                            [day]: {
                                              ...hours,
                                              startTime: e.target.value
                                            }
                                          }
                                        });
                                      }
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                                  />
                                  <span className="text-gray-500 dark:text-gray-400">-</span>
                                  <input
                                    type="time"
                                    value={hours.endTime}
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      if (isEditing) {
                                        setProfile({
                                          ...profile,
                                          businessHours: {
                                            ...profile.businessHours,
                                            [day]: {
                                              ...hours,
                                              endTime: e.target.value
                                            }
                                          }
                                        });
                                      }
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          {language === 'uk' ? 'Способи оплати' : language === 'ru' ? 'Способы оплаты' : 'Payment Methods'}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['card', 'cash', 'bank_transfer', 'apple_pay'].map((method) => (
                            <div 
                              key={method} 
                              onClick={() => {
                                if (!isEditing) return;
                                const currentMethods = profile.paymentMethods;
                                const isSelected = currentMethods.includes(method);
                                const newMethods = isSelected 
                                  ? currentMethods.filter(m => m !== method)
                                  : [...currentMethods, method];
                                setProfile({...profile, paymentMethods: newMethods});
                              }}
                              className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all duration-200 ${
                                profile.paymentMethods.includes(method)
                                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'
                              } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                              <div className="text-sm font-medium">{getPaymentMethodName(method)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Service Area */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          {language === 'uk' ? 'Зона обслуговування' : language === 'ru' ? 'Зона обслуживания' : 'Service Area'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {language === 'uk' ? 'Радіус (км)' : language === 'ru' ? 'Радиус (км)' : 'Radius (km)'}
                            </label>
                            <input
                              type="number"
                              value={profile.serviceArea.radius}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  setProfile({
                                    ...profile,
                                    serviceArea: {
                                      ...profile.serviceArea,
                                      radius: parseInt(e.target.value) || 0
                                    }
                                  });
                                }
                              }}
                              min="0"
                              max="500"
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {language === 'uk' ? 'Міста обслуговування' : language === 'ru' ? 'Города обслуживания' : 'Service Cities'}
                            </label>
                            {isEditing && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={language === 'uk' ? 'Нове місто' : language === 'ru' ? 'Новый город' : 'New city'}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.target as HTMLInputElement;
                                      const city = input.value.trim();
                                      if (city && !profile.serviceArea.cities.includes(city)) {
                                        setProfile({
                                          ...profile,
                                          serviceArea: {
                                            ...profile.serviceArea,
                                            cities: [...profile.serviceArea.cities, city]
                                          }
                                        });
                                        input.value = '';
                                      }
                                    }
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                    const city = input.value.trim();
                                    if (city && !profile.serviceArea.cities.includes(city)) {
                                      setProfile({
                                        ...profile,
                                        serviceArea: {
                                          ...profile.serviceArea,
                                          cities: [...profile.serviceArea.cities, city]
                                        }
                                      });
                                      input.value = '';
                                    }
                                  }}
                                  className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                                >
                                  {language === 'uk' ? 'Додати' : language === 'ru' ? 'Добавить' : 'Add'}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {profile.serviceArea.cities.map((city, index) => (
                              <span
                                key={index}
                                className="px-3 py-2 bg-success-100 text-success-700 rounded-lg text-sm font-medium dark:bg-success-900/30 dark:text-success-300 flex items-center gap-2"
                              >
                                {city}
                                {isEditing && (
                                  <button
                                    onClick={() => {
                                      setProfile({
                                        ...profile,
                                        serviceArea: {
                                          ...profile.serviceArea,
                                          cities: profile.serviceArea.cities.filter((_, i) => i !== index)
                                        }
                                      });
                                    }}
                                    className="text-success-500 hover:text-success-700 ml-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </span>
                            ))}
                            {profile.serviceArea.cities.length === 0 && (
                              <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                                {language === 'uk' ? 'Додайте міста обслуговування' : language === 'ru' ? 'Добавьте города обслуживания' : 'Add cities you serve'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('portfolio.title')}
                      </h2>
                      {isEditing && (
                        <>
                          <input
                            type="file"
                            id="portfolio-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePortfolioUpload}
                          />
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => document.getElementById('portfolio-upload')?.click()}
                              disabled={uploadingPortfolio}
                              className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {uploadingPortfolio && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              )}
                              {uploadingPortfolio ? 
                                (language === 'uk' ? 'Завантаження...' : language === 'ru' ? 'Загрузка...' : 'Uploading...') : 
                                (language === 'uk' ? 'Додати фото' : language === 'ru' ? 'Добавить фото' : 'Add Photo')
                              }
                            </button>
                            {portfolioError && (
                              <p className="text-red-500 text-sm">{portfolioError}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Uploaded Images with Form */}
                      {portfolioImages.map((imageUrl, index) => (
                        <div key={`uploaded-${index}`} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
                          <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
                            <img 
                              src={imageUrl} 
                              alt={`Uploaded portfolio ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {isEditing && (
                              <button
                                onClick={() => handlePortfolioDelete(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {language === 'uk' ? 'Нове фото' : language === 'ru' ? 'Новое фото' : 'New Photo'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                              {language === 'uk' ? 'Додайте інформацію про роботу' : language === 'ru' ? 'Добавьте информацию о работе' : 'Add work information'}
                            </p>
                            {showPortfolioForm && index === portfolioImages.length - 1 && (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  placeholder={language === 'uk' ? 'Назва роботи' : language === 'ru' ? 'Название работы' : 'Work Title'}
                                  value={portfolioFormData.title}
                                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, title: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600"
                                />
                                <textarea
                                  placeholder={language === 'uk' ? 'Опис роботи' : language === 'ru' ? 'Описание работы' : 'Work Description'}
                                  value={portfolioFormData.description}
                                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, description: e.target.value }))}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600"
                                />
                                <input
                                  type="text"
                                  placeholder={language === 'uk' ? 'Категорія' : language === 'ru' ? 'Категория' : 'Category'}
                                  value={portfolioFormData.category}
                                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, category: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSavePortfolioItem}
                                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                                  >
                                    {language === 'uk' ? 'Зберегти' : language === 'ru' ? 'Сохранить' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowPortfolioForm(false);
                                      setPortfolioFormData({ title: '', description: '', category: '' });
                                      setPortfolioError('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                  >
                                    {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отменить' : 'Cancel'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Existing Portfolio Items */}
                      {profile.portfolio.map((item) => (
                        <div key={item.id} className="bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                          <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={getPortfolioItemText(item, 'title')}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{getPortfolioItemText(item, 'title')}</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{getPortfolioItemText(item, 'description')}</p>
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-medium">
                                {getPortfolioItemText(item, 'category')}
                              </span>
                              {isEditing && (
                                <button 
                                  onClick={() => {
                                    setProfile(prev => ({
                                      ...prev,
                                      portfolio: prev.portfolio.filter(p => p.id !== item.id)
                                    }));
                                  }}
                                  className="p-1 text-error-600 hover:bg-error-50 rounded transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Photo Placeholder */}
                      {isEditing && (
                        <div 
                          onClick={() => document.getElementById('portfolio-upload')?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors duration-200 cursor-pointer"
                        >
                          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className="text-sm font-medium">
                            {t('portfolio.addPhoto')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {language === 'uk' ? 'Безпека та приватність' : language === 'ru' ? 'Безопасность и конфиденциальность' : 'Security & Privacy'}
                    </h2>
                    
                    <div className="space-y-8">
                      {/* Verification Status */}
                      <div className="bg-success-50 border border-success-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="text-lg font-semibold text-success-900">
                            {language === 'uk' ? 'Статус верифікації' : language === 'ru' ? 'Статус верификации' : 'Verification Status'}
                          </h3>
                        </div>
                        <p className="text-success-800 mb-3">
                          {language === 'uk' 
                            ? 'Ваш профіль підтверджено. Верифіковано'
                            : language === 'ru'
                            ? 'Ваш профиль подтвержден. Верифицирован'
                            : 'Your profile is verified. Verified on'
                          } {new Date(profile.verification.verifiedDate).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {profile.verification.documentsSubmitted.map((doc, index) => (
                            <span key={index} className="px-3 py-1 bg-success-200 text-success-800 rounded-lg text-sm font-medium">
                              {doc === 'diploma' 
                                ? (language === 'uk' ? 'Диплом' : language === 'ru' ? 'Диплом' : 'Diploma')
                                : doc === 'certificate'
                                ? (language === 'uk' ? 'Сертифікат' : language === 'ru' ? 'Сертификат' : 'Certificate')
                                : doc === 'id_card'
                                ? (language === 'uk' ? 'Паспорт' : language === 'ru' ? 'Паспорт' : 'ID Card')
                                : doc
                              }
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Privacy Settings */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          {language === 'uk' ? 'Налаштування приватності' : language === 'ru' ? 'Настройки конфиденциальности' : 'Privacy Settings'}
                        </h3>
                        <div className="space-y-4">
                          {[
                            { key: 'showPhone', label: language === 'uk' ? 'Показувати телефон' : language === 'ru' ? 'Показывать телефон' : 'Show Phone Number' },
                            { key: 'showEmail', label: language === 'uk' ? 'Показувати email' : language === 'ru' ? 'Показывать email' : 'Show Email Address' },
                            { key: 'showAddress', label: language === 'uk' ? 'Показувати адресу' : language === 'ru' ? 'Показывать адрес' : 'Show Address' },
                            { key: 'allowDirectBooking', label: language === 'uk' ? 'Дозволити пряме бронювання' : language === 'ru' ? 'Разрешить прямое бронирование' : 'Allow Direct Booking' },
                            { key: 'requireApproval', label: language === 'uk' ? 'Вимагати підтвердження' : language === 'ru' ? 'Требовать подтверждение' : 'Require Approval' },
                          ].map((setting) => (
                            <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-800">
                              <span className="font-medium text-gray-900 dark:text-white">{setting.label}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(profile.privacy as any)[setting.key]}
                                  disabled={!isEditing}
                                  onChange={(e) => {
                                    if (isEditing) {
                                      setProfile({
                                        ...profile,
                                        privacy: {
                                          ...profile.privacy,
                                          [setting.key]: e.target.checked
                                        }
                                      });
                                    }
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notification Settings */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          {language === 'uk' ? 'Налаштування сповіщень' : language === 'ru' ? 'Настройки уведомлений' : 'Notification Settings'}
                        </h3>
                        <div className="space-y-4">
                          {[
                            { key: 'emailBookings', label: language === 'uk' ? 'Email про бронювання' : language === 'ru' ? 'Email о бронированиях' : 'Email Bookings' },
                            { key: 'emailReviews', label: language === 'uk' ? 'Email про відгуки' : language === 'ru' ? 'Email об отзывах' : 'Email Reviews' },
                            { key: 'emailMessages', label: language === 'uk' ? 'Email повідомлення' : language === 'ru' ? 'Email сообщения' : 'Email Messages' },
                            { key: 'pushBookings', label: language === 'uk' ? 'Push про бронювання' : language === 'ru' ? 'Push о бронированиях' : 'Push Bookings' },
                            { key: 'pushReviews', label: language === 'uk' ? 'Push про відгуки' : language === 'ru' ? 'Push об отзывах' : 'Push Reviews' },
                            { key: 'pushMessages', label: language === 'uk' ? 'Push повідомлення' : language === 'ru' ? 'Push сообщения' : 'Push Messages' },
                            { key: 'smsBookings', label: language === 'uk' ? 'SMS про бронювання' : language === 'ru' ? 'SMS о бронированиях' : 'SMS Bookings' },
                          ].map((setting) => (
                            <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-800">
                              <span className="font-medium text-gray-900 dark:text-white">{setting.label}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(profile.notifications as any)[setting.key]}
                                  disabled={!isEditing}
                                  onChange={(e) => {
                                    if (isEditing) {
                                      setProfile({
                                        ...profile,
                                        notifications: {
                                          ...profile.notifications,
                                          [setting.key]: e.target.checked
                                        }
                                      });
                                    }
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Social Media Links */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          {language === 'uk' ? 'Соціальні мережі' : language === 'ru' ? 'Социальные сети' : 'Social Media'}
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {language === 'uk' ? 'Веб-сайт' : language === 'ru' ? 'Веб-сайт' : 'Website'}
                            </label>
                            <input
                              type="url"
                              value={profile.socialMedia.website || ''}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  setProfile({
                                    ...profile,
                                    socialMedia: {
                                      ...profile.socialMedia,
                                      website: e.target.value
                                    }
                                  });
                                }
                              }}
                              placeholder="https://..."
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instagram</label>
                            <input
                              type="text"
                              value={profile.socialMedia.instagram || ''}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  setProfile({
                                    ...profile,
                                    socialMedia: {
                                      ...profile.socialMedia,
                                      instagram: e.target.value
                                    }
                                  });
                                }
                              }}
                              placeholder="@username"
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LinkedIn</label>
                            <input
                              type="text"
                              value={profile.socialMedia.linkedin || ''}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  setProfile({
                                    ...profile,
                                    socialMedia: {
                                      ...profile.socialMedia,
                                      linkedin: e.target.value
                                    }
                                  });
                                }
                              }}
                              placeholder="username"
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Facebook</label>
                            <input
                              type="text"
                              value={profile.socialMedia.facebook || ''}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  setProfile({
                                    ...profile,
                                    socialMedia: {
                                      ...profile.socialMedia,
                                      facebook: e.target.value
                                    }
                                  });
                                }
                              }}
                              placeholder="username"
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-900 text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {isEditing && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          if (hasUnsavedChanges) {
                            if (window.confirm(language === 'uk' ? 'У вас є незбережені зміни. Скасувати зміни?' : language === 'ru' ? 'У вас есть несохраненные изменения. Отменить изменения?' : 'You have unsaved changes. Cancel changes?')) {
                              setProfile(originalProfile);
                              setHasUnsavedChanges(false);
                              setIsEditing(false);
                              setFieldErrors({});
                              setError(null);
                            }
                          } else {
                            setIsEditing(false);
                          }
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отменить' : 'Cancel'}
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            // Set loading state
                            setSavingProfile(true);
                            setError(null);
                            setFieldErrors({});
                            
                            // Only validate if we're in editing mode and profile is loaded
                            if (!profile || loading || !user) {
                              console.warn('Profile or user not loaded yet, cannot save');
                              setError(language === 'uk' ? 'Профіль ще завантажується, спробуйте пізніше' : language === 'ru' ? 'Профиль еще загружается, попробуйте позже' : 'Profile is still loading, please try again');
                              setSavingProfile(false);
                              return;
                            }
                            
                            // Validate required fields
                            const newFieldErrors: Record<string, string> = {};
                            
                            if (!profile.firstName.trim()) {
                              newFieldErrors.firstName = language === 'uk' ? 'Ім\'я обов\'язкове' : language === 'ru' ? 'Имя обязательно' : 'First name is required';
                            }
                            if (!profile.lastName.trim()) {
                              newFieldErrors.lastName = language === 'uk' ? 'Прізвище обов\'язкове' : language === 'ru' ? 'Фамилия обязательна' : 'Last name is required';
                            }
                            if (!profile.email.trim()) {
                              newFieldErrors.email = language === 'uk' ? 'Email обов\'язковий' : language === 'ru' ? 'Email обязателен' : 'Email is required';
                            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
                              newFieldErrors.email = language === 'uk' ? 'Невірний формат email' : language === 'ru' ? 'Неверный формат email' : 'Invalid email format';
                            }
                            if (!profile.profession.trim()) {
                              newFieldErrors.profession = language === 'uk' ? 'Професія обов\'язкова' : language === 'ru' ? 'Профессия обязательна' : 'Profession is required';
                            }
                            if (!profile.phone.trim()) {
                              newFieldErrors.phone = language === 'uk' ? 'Телефон обов\'язковий' : language === 'ru' ? 'Телефон обязателен' : 'Phone is required';
                            }
                            
                            // Validation for business hours
                            const openDays = Object.entries(profile.businessHours).filter(([_, hours]) => hours.isOpen);
                            if (openDays.length > 0) {
                              for (const [day, hours] of openDays) {
                                if (!hours.startTime || !hours.endTime) {
                                  newFieldErrors[`businessHours_${day}`] = language === 'uk' ? `Вкажіть час роботи для ${getDayName(day)}` : language === 'ru' ? `Укажите время работы для ${getDayName(day)}` : `Specify working hours for ${getDayName(day)}`;
                                } else if (hours.startTime >= hours.endTime) {
                                  newFieldErrors[`businessHours_${day}`] = language === 'uk' ? 'Час початку повинен бути раніше часу закінчення' : language === 'ru' ? 'Время начала должно быть раньше времени окончания' : 'Start time must be before end time';
                                }
                              }
                            }
                            
                            if (Object.keys(newFieldErrors).length > 0) {
                              setFieldErrors(newFieldErrors);
                              // Don't set the main error, just show field errors
                              setSavingProfile(false);
                              return;
                            }
                            
                            // Simulate API delay
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            
                            // Save profile data
                            if (isFeatureEnabled('ENABLE_SPECIALIST_PROFILE_API')) {
                              // TODO: Implement API call when backend is ready
                              // await specialistService.updateProfile(profile);
                              
                              // For now, also upload certificates if any
                              if (uploadedCertificates.length > 0) {
                                console.log('Certificates to upload:', uploadedCertificates.length);
                                // TODO: Upload certificates to backend
                                // for (const cert of uploadedCertificates) {
                                //   await specialistService.uploadCertificate(cert.file);
                                // }
                              }
                            }
                            
                            // Success
                            setIsEditing(false);
                            setHasUnsavedChanges(false);
                            setOriginalProfile(profile);
                            setValidationErrors({});
                            
                            // Show success message
                            showSuccessNotification(
                              language === 'uk' 
                                ? 'Профіль успішно збережено!'
                                : language === 'ru'
                                ? 'Профиль успешно сохранен!'
                                : 'Profile saved successfully!'
                            );
                            
                            console.log('Profile changes saved:', {
                              profile,
                              uploadedCertificates: uploadedCertificates.length,
                              specialties: profile.specialties.length,
                              portfolioItems: profile.portfolio.length,
                              completionPercentage: getProfileCompletion()
                            });
                            
                            // Clear any temporary data
                            setPortfolioError('');
                            setCertificateError('');
                            
                          } catch (err: any) {
                            console.error('Error saving profile:', err);
                            setError(language === 'uk' ? 'Не вдалося зберегти зміни профілю. Спробуйте ще раз.' : language === 'ru' ? 'Не удалось сохранить изменения профиля. Попробуйте еще раз.' : 'Failed to save profile changes. Please try again.');
                            showErrorNotification();
                          } finally {
                            setSavingProfile(false);
                          }
                        }}
                        disabled={savingProfile}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {savingProfile && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {savingProfile 
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
      </div>
    
  );
};

export default SpecialistProfile;