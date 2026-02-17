import React, { useState, useEffect } from 'react';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { specialistService } from '../../services/specialist.service';
import { serviceService } from '../../services/service.service';
import { isFeatureEnabled } from '../../config/features';
import { logger } from '@/utils/logger';
// Removed SpecialistPageWrapper - layout is handled by SpecialistLayout
import { FloatingElements, UkrainianOrnament } from '../../components/ui/UkrainianElements';
import { CategoryDropdown } from '../../components/ui/CategoryDropdown';
import { LocationPicker } from '../../components/LocationPicker';
import { getCategoryName } from '@/data/serviceCategories';
import { ServiceCategory } from '../../types';
import { reviewsService } from '../../services/reviews.service';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  price?: number; // For backwards compatibility
  currency: string;
  duration: number;
  serviceLocation?: string;
  locationNotes?: string;
  isActive: boolean;
  bookings?: number;
  _count?: {
    bookings: number;
  };
  rating?: number;
  requirements?: string[];
  deliverables?: string[];
  images?: string[];
  requiresApproval?: boolean;
  maxAdvanceBooking?: number;
  minAdvanceBooking?: number;
  // Loyalty Points pricing
  loyaltyPointsEnabled?: boolean;
  loyaltyPointsPrice?: number;
  loyaltyPointsOnly?: boolean;
  // Service Discounts
  discountEnabled?: boolean;
  discountType?: string;
  discountValue?: number;
  discountValidFrom?: string;
  discountValidUntil?: string;
  discountDescription?: string;
}

const sampleServices: Service[] = [
  // No mock services - will load from backend API
];

// Helper function to get the service currency
const getServiceCurrency = (service: Service): 'USD' | 'EUR' | 'UAH' => {
  // Use the service's stored currency, defaulting to UAH if not specified
  return (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD';
};

const SpecialistServices: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatPrice, currency, getCurrencySymbol } = useCurrency();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      if (!isFeatureEnabled('ENABLE_SPECIALIST_SERVICES_API')) {
        setLoading(false);
        setError(null);
        setServices([]); // Empty services until API is ready
        return;
      }

      try {
        setLoading(true);
        setError(null);
        logger.debug('Loading services...');
        const servicesData = await specialistService.getServices();
        logger.debug('Services data received:', servicesData);
        logger.debug('First service structure:', servicesData?.[0]);
        logger.debug('Service IDs and metadata:', servicesData?.map(s => ({
          id: s.id,
          name: s.name,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })));
        logger.debug('Total services loaded:', servicesData?.length || 0);
        setServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load services');
        logger.error('Error loading services:', err);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        const categoriesData = await serviceService.getCategories();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err: any) {
        setCategoriesError(err.message || 'Failed to load categories');
        logger.error('Error loading categories:', err);
        // Fallback to empty array if API fails
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Enhance services with real ratings from reviews (specialist-wide), then map to services
  useEffect(() => {
    const enhanceRatings = async () => {
      if (!services || services.length === 0) return;
      try {
        // Get current specialist ID
        const profile = await specialistService.getProfile();
        const specialistId = (profile as any)?.id || (profile as any)?.specialist?.id;
        if (!specialistId) return;

        // Load up to 200 recent reviews and compute per-service averages
        const { reviews } = await reviewsService.getSpecialistReviews(specialistId, 1, 100);
        if (!reviews || reviews.length === 0) return;

        const perService: Record<string, { sum: number; count: number }> = {};
        reviews.forEach(r => {
          const sid = r.booking?.service?.id || r.service?.id || r.service?.name || r.booking?.service?.name;
          if (!sid || typeof r.rating !== 'number') return;
          if (!perService[sid]) perService[sid] = { sum: 0, count: 0 };
          perService[sid].sum += r.rating;
          perService[sid].count += 1;
        });

        // Apply to services by matching id first, then name
        setServices(prev => prev.map(s => {
          const keyById = perService[s.id];
          const keyByName = perService[s.name];
          const entry = keyById || keyByName;
          if (entry && entry.count > 0) {
            return { ...s, rating: +(entry.sum / entry.count).toFixed(1) } as any;
          }
          return s;
        }));
      } catch (e) {
        logger.warn('Unable to enhance service ratings from reviews:', e);
      }
    };

    enhanceRatings();
  }, [services.length]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameUk: '',
    nameRu: '',
    description: '',
    descriptionUk: '',
    descriptionRu: '',
    category: '',
    price: '',
    currency: currency, // Default to user's selected currency
    duration: '',
    serviceLocation: '',
    locationNotes: '',
    isActive: true,
    // Loyalty Points pricing
    loyaltyPointsEnabled: false,
    loyaltyPointsPrice: undefined as number | undefined,
    loyaltyPointsOnly: false,
    // Service Discounts
    discountEnabled: false,
    discountType: 'PERCENTAGE',
    discountValue: '',
    discountValidFrom: '',
    discountValidUntil: '',
    discountDescription: '',
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    timeSlots: [''],
    // Group Session fields
    isGroupSession: false,
    maxParticipants: undefined as number | undefined,
    minParticipants: 1,
  });

  // Location state for LocationPicker
  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    region: '',
    country: '',
    postalCode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form handling functions
  const resetForm = () => {
    setFormData({
      name: '',
      nameUk: '',
      nameRu: '',
      description: '',
      descriptionUk: '',
      descriptionRu: '',
      category: '',
      serviceLocation: '',
      locationNotes: '',
      price: '',
      currency: currency, // Default to user's selected currency
      duration: '',
      isActive: true,
      availability: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      timeSlots: [''],
      // Loyalty Points pricing
      loyaltyPointsEnabled: false,
      loyaltyPointsPrice: '',
      loyaltyPointsOnly: false,
      // Service Discounts
      discountEnabled: false,
      discountType: 'PERCENTAGE',
      discountValue: '',
      discountValidFrom: '',
      discountValidUntil: '',
      discountDescription: '',
      // Group Session fields
      isGroupSession: false,
      maxParticipants: undefined,
      minParticipants: 1,
    });
    setLocationData({
      address: '',
      city: '',
      region: '',
      country: '',
      postalCode: '',
      latitude: undefined,
      longitude: undefined,
    });
    setCustomCategory('');
    setShowCustomCategory(false);
    setFormErrors({});
    setHasAttemptedSubmit(false);
    setIsSubmitting(false); // Reset submission state
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (service: Service) => {
    logger.debug('Opening edit modal for service:', service);
    logger.debug('Service duration value:', service.duration);

    // Check if the service category exists in our loaded categories
    const existingCategory = categories.find(cat => cat.id === service.category || cat.name === service.category);

    const formDataToSet = {
      name: service.name,
      nameUk: '', // These localized fields aren't used in the backend yet
      nameRu: '',
      description: service.description,
      descriptionUk: '',
      descriptionRu: '',
      category: existingCategory ? existingCategory.id : '',
      price: service.basePrice?.toString() || service.price?.toString() || '',
      currency: service.currency || 'USD',
      duration: (service.duration || 60).toString(),
      serviceLocation: service.serviceLocation || '',
      locationNotes: service.locationNotes || '',
      isActive: service.isActive,
      availability: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      timeSlots: [''],
      // Loyalty Points pricing
      loyaltyPointsEnabled: service.loyaltyPointsEnabled || false,
      loyaltyPointsPrice: service.loyaltyPointsPrice?.toString() || '',
      loyaltyPointsOnly: service.loyaltyPointsOnly || false,
      // Service Discounts
      discountEnabled: service.discountEnabled || false,
      discountType: service.discountType || 'PERCENTAGE',
      discountValue: service.discountValue?.toString() || '',
      discountValidFrom: service.discountValidFrom ? service.discountValidFrom.split('T')[0] : '',
      discountValidUntil: service.discountValidUntil ? service.discountValidUntil.split('T')[0] : '',
      discountDescription: service.discountDescription || '',
    };

    logger.debug('Form data being set:', formDataToSet);
    logger.debug('Duration in form data:', formDataToSet.duration);

    setFormData(formDataToSet);

    // Set location data from service
    setLocationData({
      address: service.serviceLocation || '',
      city: '',
      region: '',
      country: '',
      postalCode: '',
      latitude: (service as any).latitude,
      longitude: (service as any).longitude,
    });

    // If category doesn't exist in our list, show it as custom
    if (!existingCategory) {
      setShowCustomCategory(true);
      setCustomCategory(service.category);
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
    }

    setEditingService(service);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingService(null);
    resetForm();
  };

  const validateForm = () => {
    // Only run validation if user has attempted to submit
    if (!hasAttemptedSubmit) {
      logger.debug('Validation skipped - user has not attempted submit yet');
      return true;
    }

    const errors: {[key: string]: string} = {};

    // Name validation: required, 3-100 characters
    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed) {
      errors.name = t('serviceForm.required');
    } else if (nameTrimmed.length < 3) {
      errors.name = 'Service name must be at least 3 characters';
    } else if (nameTrimmed.length > 100) {
      errors.name = 'Service name cannot exceed 100 characters';
    }

    // Description validation: required, 10-1000 characters
    const descriptionTrimmed = formData.description.trim();
    if (!descriptionTrimmed) {
      errors.description = t('serviceForm.required');
    } else if (descriptionTrimmed.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (descriptionTrimmed.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }

    // Check category validation - formData.category should always contain the value (custom or regular)
    logger.debug('Category validation:', {
      showCustomCategory,
      customCategory: customCategory.trim(),
      formDataCategory: formData.category,
      hasCustomValue: !!customCategory.trim(),
      hasRegularValue: !!formData.category
    });

    // Always check formData.category since both regular and custom categories are stored there
    if (!formData.category) {
      errors.category = t('serviceForm.required');
      logger.debug('Category validation failed - no category in formData.category');
    } else {
      logger.debug('Category validation passed:', formData.category);
    }
    
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      errors.price = t('serviceForm.priceMin');
    }
    
    const duration = parseInt(formData.duration);
    if (!formData.duration || isNaN(duration) || duration < 15) {
      errors.duration = t('serviceForm.durationMin');
    }

    // Loyalty Points validation
    if (formData.loyaltyPointsEnabled) {
      if (!formData.loyaltyPointsPrice || formData.loyaltyPointsPrice < 1) {
        errors.loyaltyPointsPrice = 'Loyalty points price must be at least 1';
      }
    }

    // Discount validation
    if (formData.discountEnabled) {
      const discountValue = parseFloat(formData.discountValue);
      if (!formData.discountValue || isNaN(discountValue) || discountValue <= 0) {
        errors.discountValue = 'Discount value must be greater than 0';
      } else if (formData.discountType === 'PERCENTAGE' && discountValue > 100) {
        errors.discountValue = 'Percentage discount cannot exceed 100%';
      }

      // Validate dates if provided
      if (formData.discountValidFrom && formData.discountValidUntil) {
        const fromDate = new Date(formData.discountValidFrom);
        const untilDate = new Date(formData.discountValidUntil);
        if (fromDate >= untilDate) {
          errors.discountValidUntil = 'End date must be after start date';
        }
      }
    }

    // Removed availability and timeSlots validation as they're not part of backend schema

    logger.debug('Validation result:', {
      hasErrors: Object.keys(errors).length > 0,
      errors,
      totalErrors: Object.keys(errors).length
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setHasAttemptedSubmit(true);

    if (!validateForm()) {
      return;
    }

    if (!isFeatureEnabled('ENABLE_SPECIALIST_SERVICES_API')) {
      logger.warn('Services API is disabled. Enable ENABLE_SPECIALIST_SERVICES_API to use this feature.');
      closeModal();
      return;
    }
    
    // For category, use the custom category if it's set, otherwise use the selected category
    const finalCategory = (showCustomCategory && customCategory.trim())
      ? customCategory.trim()
      : formData.category;

    logger.debug('Form data before submission:', formData);
    logger.debug('Category data:', {
      originalCategory: formData.category,
      showCustomCategory,
      customCategory,
      finalCategory
    });
    logger.debug('Duration from form:', formData.duration, typeof formData.duration);
    logger.debug('Duration parsed as int:', parseInt(formData.duration));
    
    const serviceData = {
      name: formData.name,
      description: formData.description,
      category: finalCategory,
      basePrice: parseFloat(formData.price),
      currency: formData.currency,
      duration: parseInt(formData.duration),
      serviceLocation: locationData.address || formData.serviceLocation || undefined,
      locationNotes: formData.locationNotes || undefined,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      isActive: formData.isActive,
      requirements: [], // Empty for now, can be extended later
      deliverables: [], // Empty for now, can be extended later
      images: [], // Empty for now, can be extended later
      requiresApproval: true,
      maxAdvanceBooking: 30,
      minAdvanceBooking: 1,
      // Loyalty Points pricing
      loyaltyPointsEnabled: formData.loyaltyPointsEnabled,
      loyaltyPointsPrice: formData.loyaltyPointsEnabled ? parseInt(formData.loyaltyPointsPrice || '0') : undefined,
      loyaltyPointsOnly: formData.loyaltyPointsOnly,
      // Service Discounts
      discountEnabled: formData.discountEnabled,
      discountType: formData.discountEnabled ? formData.discountType : undefined,
      discountValue: formData.discountEnabled ? parseFloat(formData.discountValue) : undefined,
      discountValidFrom: formData.discountEnabled && formData.discountValidFrom ? formData.discountValidFrom : undefined,
      discountValidUntil: formData.discountEnabled && formData.discountValidUntil ? formData.discountValidUntil : undefined,
      discountDescription: formData.discountEnabled && formData.discountDescription ? formData.discountDescription : undefined,
      // Group Session fields
      isGroupSession: formData.isGroupSession,
      maxParticipants: formData.isGroupSession ? formData.maxParticipants : undefined,
      minParticipants: formData.isGroupSession ? formData.minParticipants : 1,
    };

    logger.debug('Service data being sent to backend:', serviceData);
    logger.debug('Duration in service data:', serviceData.duration);

    setIsSubmitting(true);
    setError(null); // Clear any previous errors

    try {
      let updatedService;
      if (editingService) {
        logger.debug('Updating existing service:', editingService.id);
        updatedService = await specialistService.updateService(editingService.id, serviceData);
        logger.debug('Service updated, response from backend:', updatedService);
        logger.debug('Duration in updated service:', updatedService.duration);
        setServices(prev => prev.map(service =>
          service.id === editingService.id ? updatedService : service
        ));
      } else {
        logger.debug('Creating new service');
        updatedService = await specialistService.createService(serviceData);
        logger.debug('Service created, response from backend:', updatedService);
        logger.debug('Duration in created service:', updatedService.duration);
        setServices(prev => [updatedService, ...prev]);
      }
      closeModal();
    } catch (err: any) {
      logger.error('Error saving service:', err);
      setError(err.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false); // Always clear loading state
    }
  };

  // Removed availability and timeSlots functions as they're not part of backend schema

  const getLocalizedText = (item: any, field: string) => {
    return item[field] || '';
  };

  const getBookingCount = (service: Service): number => {
    return service._count?.bookings || service.bookings || 0;
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!serviceId) {
      setError('Cannot delete service: Service ID is missing');
      return;
    }
    
    const { confirm } = await import('../../components/ui/Confirm');
    const ok = await confirm({
      title: 'Delete service?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });
    if (!ok) return;
    
    // Show loading state
    setLoading(true);
    setError(null);

    try {
      logger.debug('Starting service deletion for ID:', serviceId);

      // Debug: Check if service exists before deletion
      const servicesBefore = services.length;
      const serviceToDelete = services.find(s => s.id === serviceId);
      logger.debug('Pre-deletion state:', {
        totalServices: servicesBefore,
        serviceToDelete: serviceToDelete ? { id: serviceToDelete.id, name: serviceToDelete.name } : 'NOT FOUND',
        allServiceIds: services.map(s => s.id)
      });

      const result = await specialistService.deleteService(serviceId);
      logger.debug('Backend deletion result:', result);

      // Verify deletion by fetching services again from backend
      logger.debug('Verifying deletion by re-fetching services...');
      const refreshedServices = await specialistService.getServices();
      logger.debug('Post-deletion verification:', {
        backendServicesCount: refreshedServices.length,
        deletedServiceStillExists: refreshedServices.some(s => s.id === serviceId),
        backendServiceIds: refreshedServices.map(s => s.id)
      });

      // Check if service was actually deleted from backend
      const serviceStillExists = refreshedServices.some(s => s.id === serviceId);

      if (serviceStillExists) {
        // Backend says success but service still exists - this is the bug!
        logger.error('DELETION BUG DETECTED: Backend returned success but service still exists!', {
          serviceId,
          backendResponse: result,
          serviceStillInBackend: true
        });

        // Update UI to reflect actual backend state
        setServices(refreshedServices);

        throw new Error(
          `Deletion failed: Backend returned success but service still exists in database. ` +
          `This indicates a backend bug. Please check server logs and database state. ` +
          `Service ID: ${serviceId}`
        );
      }

      // If we reach here, deletion was actually successful
      setServices(refreshedServices); // Use fresh data from backend
      logger.debug('Service deletion verified: Service no longer exists on backend');
      // toast.success('Service deleted successfully and verified!');

    } catch (err: any) {
      logger.error('Service deletion failed:', {
        serviceId,
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      // Handle 404 error - service already deleted
      if (err.response?.status === 404) {
        logger.debug('Service already deleted (404), removing from local state');
        // Remove the service from local state since it's already deleted on backend
        setServices(prevServices => prevServices.filter(s => s.id !== serviceId));
        // toast.info('Service was already deleted. Refreshing the list.');
        return; // Exit early, don't show error
      }
      
      // More user-friendly error messages for other errors
      let errorMessage = err.message || 'Failed to delete service';
      
      // Check for specific backend error details
      if (err.response?.data?.error) {
        errorMessage = `Backend Error: ${err.response.data.error}`;
      } else if (err.response?.data?.message) {
        errorMessage = `Backend Error: ${err.response.data.message}`;
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred while deleting service. This may be due to existing bookings or database dependencies. Please try again later or contact support.';
      } else if (err.message?.includes('existing bookings')) {
        errorMessage = 'Cannot delete service because it has existing bookings. Please cancel all bookings first or contact support.';
      } else if (err.message?.includes('dependencies')) {
        errorMessage = 'Cannot delete service due to existing dependencies. Please contact support for assistance.';
      }
      
      setError(errorMessage);
      // Prefer toast but leave developer console logs
      // toast.error(`Deletion failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    logger.debug('Toggling service status:', { serviceId, isActive });

    if (!serviceId) {
      logger.error('Service ID is undefined or null');
      setError('Service ID is missing. Cannot update service status.');
      return;
    }

    try {
      const updatedService = await specialistService.toggleServiceStatus(serviceId, isActive);
      logger.debug('Service status updated:', updatedService);
      setServices(prev => prev.map(service =>
        service.id === serviceId ? updatedService : service
      ));
    } catch (err: any) {
      logger.error('Error toggling service status:', err);
      setError(err.message || 'Failed to update service status');
    }
  };

  const filteredServices = (Array.isArray(services) ? services : []).filter(service => {
    const matchesCategory = selectedCategory === 'all' || 
      service.category === selectedCategory ||
      // Also check by category name for backwards compatibility
      categories.find(cat => cat.name === service.category && cat.id === selectedCategory);
    const matchesSearch = getLocalizedText(service, 'name').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  // Removed getDayName function as availability is no longer supported

  const ServiceCard: React.FC<{ service: Service }> = ({ service }) => (
    <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/20 ${!service.isActive ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {getLocalizedText(service, 'name')}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              service.isActive
                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {service.isActive ? t('services.active') : t('services.inactive')}
            </span>
            {service.isGroupSession && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('services.groupSession')}
                {service.maxParticipants && ` (${service.maxParticipants})`}
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm leading-relaxed">
            {getLocalizedText(service, 'description')}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {service.duration} {t('services.min')}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {getBookingCount(service)} {t('services.bookings')}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-secondary-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {service.rating && !isNaN(Number(service.rating)) ? Number(service.rating).toFixed(1) : (t('common.notAvailable') || 'N/A')}
            </span>
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-primary-600 mb-2">
            {service.basePrice && !isNaN(Number(service.basePrice)) ? formatPrice(Number(service.basePrice), getServiceCurrency(service)) : (t('common.notAvailable') || 'N/A')}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {getLocalizedText(service, 'category')}
          </div>
        </div>
      </div>

      {/* Removed availability and timeSlots display as they're not part of backend schema */}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => openEditModal(service)}
          className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-xl font-medium transition-colors duration-200 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 dark:text-primary-300"
        >
          {t('services.edit')}
        </button>
        <button
          onClick={() => {
            logger.debug('Service object before toggle:', service);
            logger.debug('Service ID:', service.id);
            handleToggleServiceStatus(service.id, !service.isActive);
          }}
          className={`px-4 py-2 rounded-xl font-medium transition-colors duration-200 ${
            service.isActive
              ? 'bg-warning-50 hover:bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:hover:bg-warning-900/30 dark:text-warning-300'
              : 'bg-success-50 hover:bg-success-100 text-success-700 dark:bg-success-900/20 dark:hover:bg-success-900/30 dark:text-success-300'
          }`}
        >
          {service.isActive ? t('services.deactivate') : t('services.activate')}
        </button>
        <button 
          onClick={() => handleDeleteService(service.id)}
          className="p-2 bg-error-50 hover:bg-error-100 text-error-600 rounded-xl transition-colors duration-200 dark:bg-error-900/20 dark:hover:bg-error-900/30 dark:text-error-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <FullScreenHandshakeLoader title={t('common.loading')} subtitle={t('dashboard.nav.services')} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{t('services.errorLoading') || 'Error loading services'}</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
          >
            {t('actions.retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        <FloatingElements />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('services.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('services.subtitle')}
                </p>
              </div>
              <div className="flex gap-3 mt-4 lg:mt-0">
                <button
                  onClick={openAddModal}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('services.addService')}
                </button>
              </div>
            </div>
            
            <UkrainianOrnament className="mb-6" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-xl mr-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5a3.375 3.375 0 00-3.375 3.375v2.625m15 0a3 3 0 01-3 3h-9a3 3 0 01-3-3m12-9.75v-2.25a2.25 2.25 0 00-2.25-2.25h-7.5a2.25 2.25 0 00-2.25 2.25v2.25" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t('services.activeServices')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{services.filter(s => s.isActive).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center">
                <div className="p-3 bg-secondary-100 rounded-xl mr-4">
                  <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t('services.totalBookings')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{services.reduce((sum, s) => sum + getBookingCount(s), 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center">
                <div className="p-3 bg-success-100 rounded-xl mr-4">
                  <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t('services.avgRating')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {services.length === 0 
                      ? t('services.noDataYet') || 'No data yet'
                      : (() => {
                          const validRatings = services.filter(s => s.rating && !isNaN(s.rating));
                          return validRatings.length === 0 
                            ? t('services.noDataYet') || 'No data yet'
                            : (validRatings.reduce((sum, s) => sum + s.rating, 0) / validRatings.length).toFixed(1);
                        })()
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center">
                <div className="p-3 bg-warning-100 rounded-xl mr-4">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t('services.avgPrice')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {services.length === 0 
                      ? t('services.noDataYet') || 'No data yet'
                      : (() => {
                          const validPrices = services.filter(s => {
                            const price = s.basePrice || s.price;
                            return price && !isNaN(price);
                          });
                          return validPrices.length === 0 
                            ? t('services.noDataYet') || 'No data yet'
                            : formatPrice(validPrices.reduce((sum, s) => sum + (s.basePrice || s.price), 0) / validPrices.length, validPrices[0]?.currency as 'USD' | 'EUR' | 'UAH' || 'USD');
                        })()
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={t('services.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={categoriesLoading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="all">
                    {categoriesLoading ? t('services.loadingCategories') || 'Loading categories...' : t('services.allCategories')}
                  </option>
                  {!categoriesLoading && categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryName?.(category.id, language as 'en' | 'uk' | 'ru') || category.name}
                    </option>
                  ))}
                  {categoriesError && (
                    <option disabled>
                      {t('services.categoriesError') || 'Failed to load categories'}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Debug Panel - Only show in development or when needed */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-yellow-800">🔧 Service Deletion Debug Panel</h4>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      logger.debug('Manual service refresh initiated...');
                      try {
                        const freshServices = await specialistService.getServices();
                        logger.debug('Fresh services from backend:', freshServices.map(s => ({ id: s.id, name: s.name })));
                        setServices(freshServices);
                        // toast.success(`Refreshed! Found ${freshServices.length} services on backend`);
                      } catch (error) {
                        logger.error('Refresh failed:', error);
                        // toast.error('Refresh failed - check console');
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Refresh Services
                  </button>
                  <button
                    onClick={() => {
                      logger.debug('Current frontend state:', {
                        totalServices: services.length,
                        serviceIds: services.map(s => s.id),
                        services: services.map(s => ({ id: s.id, name: s.name, createdAt: s.createdAt }))
                      });
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Log State
                  </button>
                </div>
              </div>
              <div className="text-xs text-yellow-700">
                <strong>Current Services ({services.length}):</strong> {services.map(s => `${s.name} (${s.id})`).join(', ') || 'None'}
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                Use "Refresh Services" after deletion to check if service persists on backend. Check browser console for detailed logs.
              </div>
            </div>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 max-w-md mx-auto">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5a3.375 3.375 0 00-3.375 3.375v2.625m15 0a3 3 0 01-3 3h-9a3 3 0 01-3-3m12-9.75v-2.25a2.25 2.25 0 00-2.25-2.25h-7.5a2.25 2.25 0 00-2.25 2.25v2.25" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('services.noServicesFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t('services.noServicesDesc')}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-medium transition-colors duration-200"
                >
                  {t('services.addService')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingService ? t('serviceForm.editService') : t('serviceForm.addService')}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Validation Error Summary */}
              {hasAttemptedSubmit && Object.keys(formErrors).length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                        Please fix the following errors:
                      </h3>
                      <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                        {Object.entries(formErrors).map(([field, error]) => (
                          <li key={field}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('serviceForm.serviceName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('serviceForm.serviceNamePlaceholder')}
                  className={`w-full px-4 py-3 rounded-xl border ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
                />
                <div className="flex justify-between mt-1">
                  {formErrors.name ? (
                    <p className="text-sm text-red-500">{formErrors.name}</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Minimum 3 characters</p>
                  )}
                  <p className={`text-xs ${formData.name.length > 100 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formData.name.length}/100
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('serviceForm.description')} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('serviceForm.descriptionPlaceholder')}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border ${formErrors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
                />
                <div className="flex justify-between mt-1">
                  {formErrors.description ? (
                    <p className="text-sm text-red-500">{formErrors.description}</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Minimum 10 characters</p>
                  )}
                  <p className={`text-xs ${formData.description.length > 1000 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formData.description.length}/1000
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('serviceForm.category')} *
                  </label>
                  <CategoryDropdown
                    value={formData.category}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, category: value }));
                      setShowCustomCategory(false);
                      setCustomCategory('');
                      // Clear any existing category errors since we now have a selected category
                      if (value) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.category;
                          return newErrors;
                        });
                      }
                    }}
                    onCustomCategory={(customValue) => {
                      logger.debug('Services.tsx: onCustomCategory called with:', customValue);
                      setFormData(prev => ({ ...prev, category: customValue }));
                      setCustomCategory(customValue);
                      setShowCustomCategory(true);
                      // Clear any existing category errors since we now have a custom category
                      setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.category;
                        return newErrors;
                      });
                      logger.debug('Services.tsx: States updated - showCustomCategory: true, customCategory:', customValue);
                    }}
                    placeholder={t('serviceForm.selectCategory') || 'Select a category'}
                    error={formErrors.category}
                    allowCustom={true}
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {t('serviceForm.serviceActive')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Group Session */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Group Session Settings
                </h3>
                <div className="flex items-center mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isGroupSession}
                      onChange={(e) => {
                        logger.debug('Group Session checkbox clicked:', e.target.checked);
                        setFormData(prev => ({
                          ...prev,
                          isGroupSession: e.target.checked,
                          maxParticipants: e.target.checked ? prev.maxParticipants : undefined,
                          minParticipants: e.target.checked ? (prev.minParticipants || 1) : 1
                        }));
                      }}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('serviceForm.groupSession')}
                    </span>
                  </label>
                </div>

                {formData.isGroupSession && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ml-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('serviceForm.maxParticipants')}
                      </label>
                      <input
                        type="number"
                        value={formData.maxParticipants || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          maxParticipants: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        min="1"
                        placeholder={t('serviceForm.maxParticipantsPlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('serviceForm.minParticipants')}
                      </label>
                      <input
                        type="number"
                        value={formData.minParticipants || 1}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          minParticipants: e.target.value ? parseInt(e.target.value) : 1
                        }))}
                        min="1"
                        max={formData.maxParticipants || undefined}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Duration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('serviceForm.pricing')}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('serviceForm.price')} *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        min="0"
                        step="0.01"
                        className={`flex-1 px-4 py-3 rounded-xl border ${formErrors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
                      />
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="UAH">₴ UAH</option>
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                      </select>
                    </div>
                    {formErrors.price && <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('serviceForm.duration')} *
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      min="15"
                      step="1"
                      className={`w-full px-4 py-3 rounded-xl border ${formErrors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
                    />
                    {formErrors.duration && <p className="mt-1 text-sm text-red-500">{formErrors.duration}</p>}
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language === 'uk' ? 'Місцезнаходження' : language === 'ru' ? 'Местоположение' : 'Location Information'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {language === 'uk' ? 'Ця інформація буде показана клієнтам після оплати' : language === 'ru' ? 'Эта информация будет показана клиентам после оплаты' : 'This information will be shown to customers after payment'}
                </p>
                <div className="grid grid-cols-1 gap-6">
                  {/* Service Location with Google Maps */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'uk' ? 'Адреса або місце надання послуги' : language === 'ru' ? 'Адрес или место предоставления услуги' : 'Service Location Address'}
                    </label>
                    <LocationPicker
                      location={locationData}
                      onLocationChange={(newLocation) => {
                        setLocationData(newLocation);
                        // Also update formData.serviceLocation for backwards compatibility
                        setFormData(prev => ({
                          ...prev,
                          serviceLocation: newLocation.address
                        }));
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Location Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'uk' ? 'Додаткові інструкції' : language === 'ru' ? 'Дополнительные инструкции' : 'Additional Instructions'}
                    </label>
                    <textarea
                      value={formData.locationNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, locationNotes: e.target.value }))}
                      placeholder={language === 'uk' ? 'напр. Паркування позаду будівлі, домофон 15' : language === 'ru' ? 'напр. Парковка за зданием, домофон 15' : 'e.g. Parking behind building, buzzer #15'}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Loyalty Points Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('serviceForm.loyaltyPointsPricing')}</h3>

                {/* Enable Loyalty Points */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.loyaltyPointsEnabled || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        loyaltyPointsEnabled: e.target.checked,
                        // If disabling, also clear the points-only setting
                        loyaltyPointsOnly: e.target.checked ? prev.loyaltyPointsOnly : false
                      }))}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {t('serviceForm.allowLoyaltyBooking')}
                    </span>
                  </label>
                </div>

                {/* Loyalty Points Options */}
                {formData.loyaltyPointsEnabled && (
                  <div className="space-y-4 pl-8 border-l-2 border-primary-200 dark:border-primary-800">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Points Required *
                      </label>
                      <input
                        type="number"
                        value={formData.loyaltyPointsPrice || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          loyaltyPointsPrice: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        min="1"
                        step="1"
                        placeholder="e.g., 500 points"
                        className={`w-full px-4 py-3 rounded-xl border ${formErrors.loyaltyPointsPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
                      />
                      {formErrors.loyaltyPointsPrice && <p className="mt-1 text-sm text-red-500">{formErrors.loyaltyPointsPrice}</p>}
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.loyaltyPointsOnly || false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            loyaltyPointsOnly: e.target.checked
                          }))}
                          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          Only bookable with loyalty points (no cash payment option)
                        </span>
                      </label>
                    </div>

                    {formData.loyaltyPointsPrice && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          💰 This service will be bookable for <strong>{formData.loyaltyPointsPrice} loyalty points</strong>
                          {formData.loyaltyPointsOnly
                            ? ' (points only - no cash payment option)'
                            : ` or ${formatPrice(parseFloat(formData.price || '0'), getServiceCurrency(formData as any))} (customers can choose)`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service Discounts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('serviceForm.serviceDiscounts')}</h3>

                {/* Enable Discounts */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.discountEnabled || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        discountEnabled: e.target.checked,
                        // Clear discount fields if disabling
                        discountValue: e.target.checked ? prev.discountValue : '',
                        discountValidFrom: e.target.checked ? prev.discountValidFrom : '',
                        discountValidUntil: e.target.checked ? prev.discountValidUntil : '',
                        discountDescription: e.target.checked ? prev.discountDescription : ''
                      }))}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {t('serviceForm.enablePromotionalDiscount')}
                    </span>
                  </label>
                </div>

                {/* Discount Options */}
                {formData.discountEnabled && (
                  <div className="space-y-4 pl-8 border-l-2 border-primary-200 dark:border-primary-800">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Discount Type *
                        </label>
                        <select
                          value={formData.discountType}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            discountType: e.target.value,
                            discountValue: '' // Clear value when changing type
                          }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="PERCENTAGE">Percentage (%) Discount</option>
                          <option value="FIXED_AMOUNT">Fixed Amount Discount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Discount Value *
                        </label>
                        <div className="flex items-center">
                          {formData.discountType === 'PERCENTAGE' && (
                            <span className="mr-2 text-gray-500 dark:text-gray-400">%</span>
                          )}
                          {formData.discountType === 'FIXED_AMOUNT' && (
                            <span className="mr-2 text-gray-500 dark:text-gray-400">{getCurrencySymbol(formData.currency as 'USD' | 'EUR' | 'UAH')}</span>
                          )}
                          <input
                            type="number"
                            value={formData.discountValue}
                            onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                            min="0"
                            max={formData.discountType === 'PERCENTAGE' ? "100" : undefined}
                            step={formData.discountType === 'PERCENTAGE' ? "1" : "0.01"}
                            placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 50'}
                            className={`w-full px-4 py-3 rounded-xl border ${
                              formErrors.discountValue ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
                          />
                        </div>
                        {formErrors.discountValue && <p className="mt-1 text-sm text-red-500">{formErrors.discountValue}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Valid From (Optional)
                        </label>
                        <input
                          type="date"
                          value={formData.discountValidFrom}
                          onChange={(e) => setFormData(prev => ({ ...prev, discountValidFrom: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Valid Until (Optional)
                        </label>
                        <input
                          type="date"
                          value={formData.discountValidUntil}
                          onChange={(e) => setFormData(prev => ({ ...prev, discountValidUntil: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border ${
                            formErrors.discountValidUntil ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
                        />
                        {formErrors.discountValidUntil && <p className="mt-1 text-sm text-red-500">{formErrors.discountValidUntil}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Discount Description (Optional)
                      </label>
                      <textarea
                        value={formData.discountDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountDescription: e.target.value }))}
                        placeholder="e.g., Early bird special, Limited time offer, etc."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {formData.discountValue && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          🎉 <strong>Discount Preview:</strong> {' '}
                          {formData.discountType === 'PERCENTAGE'
                            ? `${formData.discountValue}% off`
                            : `${getCurrencySymbol(formData.currency as 'USD' | 'EUR' | 'UAH')}${formData.discountValue} off`
                          }
                          {' '}
                          {formData.price && (
                            <span>
                              (New price: {' '}
                              {formData.discountType === 'PERCENTAGE'
                                ? formatPrice(
                                    parseFloat(formData.price) * (1 - parseFloat(formData.discountValue) / 100),
                                    formData.currency as 'USD' | 'EUR' | 'UAH'
                                  )
                                : formatPrice(
                                    parseFloat(formData.price) - parseFloat(formData.discountValue),
                                    formData.currency as 'USD' | 'EUR' | 'UAH'
                                  )
                              })
                            </span>
                          )}
                          {formData.discountValidFrom && formData.discountValidUntil && (
                            <span className="block mt-1">
                              📅 Valid from {formData.discountValidFrom} to {formData.discountValidUntil}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Removed availability and timeSlots form sections as they're not part of backend schema */}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center gap-2 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting
                    ? (editingService ? 'Saving...' : 'Creating...')
                    : (editingService ? t('common.save') : t('services.addService'))
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SpecialistServices;
