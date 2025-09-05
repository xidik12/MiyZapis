import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { specialistService } from '../../services/specialist.service';
import { serviceService } from '../../services/service.service';
import { isFeatureEnabled } from '../../config/features';
// Removed SpecialistPageWrapper - layout is handled by SpecialistLayout
import { FloatingElements, UkrainianOrnament } from '../../components/ui/UkrainianElements';
import { CategoryDropdown } from '../../components/ui/CategoryDropdown';
import { ServiceCategory } from '../../types';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  price?: number; // For backwards compatibility
  currency: string;
  duration: number;
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
}

const sampleServices: Service[] = [
  // No mock services - will load from backend API
];

const SpecialistServices: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatPrice, currency } = useCurrency();
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
        console.log('📡 Loading services...');
        const servicesData = await specialistService.getServices();
        console.log('📦 Services data received:', servicesData);
        console.log('🔍 First service structure:', servicesData?.[0]);
        console.log('🏷️ Service IDs and metadata:', servicesData?.map(s => ({ 
          id: s.id, 
          name: s.name,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt 
        })));
        console.log('📊 Total services loaded:', servicesData?.length || 0);
        setServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load services');
        console.error('❌ Error loading services:', err);
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
        console.error('Error loading categories:', err);
        // Fallback to empty array if API fails
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);
  
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
    currency: 'UAH', // Default to UAH
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
    timeSlots: ['']
  });
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

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
      price: '',
      currency: 'UAH', // Default to UAH
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
      timeSlots: ['']
    });
    setCustomCategory('');
    setShowCustomCategory(false);
    setFormErrors({});
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (service: Service) => {
    // Check if the service category exists in our loaded categories
    const existingCategory = categories.find(cat => cat.id === service.category || cat.name === service.category);
    
    setFormData({
      name: service.name,
      description: service.description,
      category: existingCategory ? existingCategory.id : '',
      price: service.basePrice?.toString() || service.price?.toString() || '',
      currency: service.currency || 'UAH',
      duration: service.duration.toString(),
      isActive: service.isActive
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
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = t('serviceForm.required');
    }
    
    if (!formData.description.trim()) {
      errors.description = t('serviceForm.required');
    }
    
    if (!formData.category || (showCustomCategory && !categoriesError && !customCategory.trim())) {
      errors.category = t('serviceForm.required');
    }
    
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      errors.price = t('serviceForm.priceMin');
    }
    
    const duration = parseInt(formData.duration);
    if (!formData.duration || isNaN(duration) || duration < 15) {
      errors.duration = t('serviceForm.durationMin');
    }
    
    // Removed availability and timeSlots validation as they're not part of backend schema
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!isFeatureEnabled('ENABLE_SPECIALIST_SERVICES_API')) {
      console.warn('Services API is disabled. Enable ENABLE_SPECIALIST_SERVICES_API to use this feature.');
      closeModal();
      return;
    }
    
    // For category, use the custom category if it's set (and not in error mode), otherwise use the selected category
    const finalCategory = (showCustomCategory && !categoriesError && customCategory.trim()) 
      ? customCategory.trim()
      : formData.category;

    const serviceData = {
      name: formData.name,
      description: formData.description,
      category: finalCategory,
      basePrice: parseFloat(formData.price),
      currency: formData.currency,
      duration: parseInt(formData.duration),
      isActive: formData.isActive,
      requirements: [], // Empty for now, can be extended later
      deliverables: [], // Empty for now, can be extended later
      images: [], // Empty for now, can be extended later
      requiresApproval: true,
      maxAdvanceBooking: 30,
      minAdvanceBooking: 1
    };
    
    try {
      let updatedService;
      if (editingService) {
        updatedService = await specialistService.updateService(editingService.id, serviceData);
        setServices(prev => prev.map(service => 
          service.id === editingService.id ? updatedService : service
        ));
      } else {
        updatedService = await specialistService.createService(serviceData);
        setServices(prev => [updatedService, ...prev]);
      }
      closeModal();
    } catch (err: any) {
      console.error('Error saving service:', err);
      setError(err.message || 'Failed to save service');
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
    
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;
    
    // Show loading state
    setLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ Starting service deletion for ID:', serviceId);
      
      // Debug: Check if service exists before deletion
      const servicesBefore = services.length;
      const serviceToDelete = services.find(s => s.id === serviceId);
      console.log('📊 Pre-deletion state:', {
        totalServices: servicesBefore,
        serviceToDelete: serviceToDelete ? { id: serviceToDelete.id, name: serviceToDelete.name } : 'NOT FOUND',
        allServiceIds: services.map(s => s.id)
      });
      
      const result = await specialistService.deleteService(serviceId);
      console.log('📦 Backend deletion result:', result);
      
      // Verify deletion by fetching services again from backend
      console.log('🔍 Verifying deletion by re-fetching services...');
      const refreshedServices = await specialistService.getServices();
      console.log('📊 Post-deletion verification:', {
        backendServicesCount: refreshedServices.length,
        deletedServiceStillExists: refreshedServices.some(s => s.id === serviceId),
        backendServiceIds: refreshedServices.map(s => s.id)
      });
      
      // Check if service was actually deleted from backend
      const serviceStillExists = refreshedServices.some(s => s.id === serviceId);
      
      if (serviceStillExists) {
        // Backend says success but service still exists - this is the bug!
        console.error('🚨 DELETION BUG DETECTED: Backend returned success but service still exists!', {
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
      console.log('✅ Service deletion verified: Service no longer exists on backend');
      alert('Service deleted successfully and verified!');
      
    } catch (err: any) {
      console.error('❌ Service deletion failed:', {
        serviceId,
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Handle 404 error - service already deleted
      if (err.response?.status === 404) {
        console.log('🔄 Service already deleted (404), removing from local state');
        // Remove the service from local state since it's already deleted on backend
        setServices(prevServices => prevServices.filter(s => s.id !== serviceId));
        alert('Service was already deleted. Refreshing the list.');
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
      alert(`Deletion failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    console.log('🔄 Toggling service status:', { serviceId, isActive });
    
    if (!serviceId) {
      console.error('❌ Service ID is undefined or null');
      setError('Service ID is missing. Cannot update service status.');
      return;
    }
    
    try {
      const updatedService = await specialistService.toggleServiceStatus(serviceId, isActive);
      console.log('✅ Service status updated:', updatedService);
      setServices(prev => prev.map(service => 
        service.id === serviceId ? updatedService : service
      ));
    } catch (err: any) {
      console.error('❌ Error toggling service status:', err);
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
              {service.rating && !isNaN(service.rating) ? service.rating.toFixed(1) : 'N/A'}
            </span>
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-primary-600 mb-2">
            {service.basePrice && !isNaN(service.basePrice) ? formatPrice(service.basePrice) : 'N/A'}
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
          className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 dark:text-primary-300"
        >
          {t('services.edit')}
        </button>
        <button
          onClick={() => {
            console.log('📝 Service object before toggle:', service);
            console.log('🏷️ Service ID:', service.id);
            handleToggleServiceStatus(service.id, !service.isActive);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            service.isActive
              ? 'bg-warning-50 hover:bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:hover:bg-warning-900/30 dark:text-warning-300'
              : 'bg-success-50 hover:bg-success-100 text-success-700 dark:bg-success-900/20 dark:hover:bg-success-900/30 dark:text-success-300'
          }`}
        >
          {service.isActive ? t('services.deactivate') : t('services.activate')}
        </button>
        <button 
          onClick={() => handleDeleteService(service.id)}
          className="p-2 bg-error-50 hover:bg-error-100 text-error-600 rounded-lg transition-colors duration-200 dark:bg-error-900/20 dark:hover:bg-error-900/30 dark:text-error-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading services</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
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
                            : formatPrice(validPrices.reduce((sum, s) => sum + (s.basePrice || s.price), 0) / validPrices.length);
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
                      {category.name}
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-yellow-800">🔧 Service Deletion Debug Panel</h4>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      console.log('🔄 Manual service refresh initiated...');
                      try {
                        const freshServices = await specialistService.getServices();
                        console.log('📦 Fresh services from backend:', freshServices.map(s => ({ id: s.id, name: s.name })));
                        setServices(freshServices);
                        alert(`Refreshed! Found ${freshServices.length} services on backend`);
                      } catch (error) {
                        console.error('❌ Refresh failed:', error);
                        alert('Refresh failed - check console');
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Refresh Services
                  </button>
                  <button
                    onClick={() => {
                      console.log('📊 Current frontend state:', {
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
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingService ? t('serviceForm.editService') : t('serviceForm.addService')}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
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
                {formErrors.description && <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>}
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
                    }}
                    onCustomCategory={(customValue) => {
                      setFormData(prev => ({ ...prev, category: customValue }));
                      setCustomCategory(customValue);
                      setShowCustomCategory(true);
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
                      step="15"
                      className={`w-full px-4 py-3 rounded-xl border ${formErrors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white`}
                    />
                    {formErrors.duration && <p className="mt-1 text-sm text-red-500">{formErrors.duration}</p>}
                  </div>
                </div>
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
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors duration-200"
                >
                  {editingService ? t('common.save') : t('services.addService')}
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