import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  images: string[];
  specialistId: string;
  specialist: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    phone?: string;
    email?: string;
  };
  tags: string[];
  isActive: boolean;
}

// Backend returns specialist.user.firstName/lastName and specialist.totalReviews
// Normalize to flat specialist.name and specialist.reviewCount
const normalizeServiceSpecialist = (specialist: Record<string, unknown>) => {
  if (!specialist) return { id: '', name: '', rating: 0, reviewCount: 0 };
  return {
    id: specialist.id || '',
    name: specialist.user
      ? `${specialist.user.firstName || ''} ${specialist.user.lastName || ''}`.trim()
      : specialist.name || '',
    avatar: specialist.user?.avatar || specialist.avatar,
    rating: specialist.rating || 0,
    reviewCount: specialist.totalReviews || specialist.reviewCount || 0,
    phone: specialist.user?.phoneNumber || specialist.phoneNumber || specialist.phone || '',
    email: specialist.user?.email || specialist.email || '',
  };
};

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  serviceCount: number;
}

interface ServicesState {
  services: Service[];
  categories: ServiceCategory[];
  selectedService: Service | null;
  isLoading: boolean;
  categoriesLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
  };
}

const initialState: ServicesState = {
  services: [],
  categories: [],
  selectedService: null,
  isLoading: false,
  categoriesLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchServicesAsync = createAsyncThunk(
  'services/fetchServices',
  async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    city?: string;
  }) => {
    const response: Record<string, unknown> = await apiService.getServices(params);
    // API returns { services: [...], total, page, totalPages }
    // Normalize to { items, pagination }
    if (response?.services) {
      return {
        items: response.services.map((s: Record<string, unknown>) => ({
          ...s,
          price: Number(s.price) || Number(s.basePrice) || 0,
          images: (() => {
            if (Array.isArray(s.images)) return s.images;
            if (typeof s.images === 'string') {
              try { return JSON.parse(s.images); } catch { return []; }
            }
            return [];
          })(),
          specialist: normalizeServiceSpecialist(s.specialist),
        })),
        pagination: {
          page: response.page || 1,
          limit: params?.limit || 10,
          total: response.total || response.services.length,
          totalPages: response.totalPages || 1,
        },
      };
    }
    return response;
  }
);

export const fetchServiceAsync = createAsyncThunk(
  'services/fetchService',
  async (id: string) => {
    const response: Record<string, unknown> = await apiService.getService(id);
    // Backend wraps in { service: {...} } — unwrap it
    const raw = response?.service || response;
    return {
      ...raw,
      price: Number(raw.price) || Number(raw.basePrice) || 0,
      images: (() => {
        if (Array.isArray(raw.images)) return raw.images;
        if (typeof raw.images === 'string') {
          try { return JSON.parse(raw.images); } catch { return []; }
        }
        return [];
      })(),
      specialist: normalizeServiceSpecialist(raw.specialist),
    };
  }
);

export const fetchCategoriesAsync = createAsyncThunk(
  'services/fetchCategories',
  async () => {
    const response: Record<string, unknown> = await apiService.getServiceCategories();
    // API returns { categories: [...] } — extract the array
    return Array.isArray(response) ? response : response?.categories || [];
  }
);

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSelectedService: (state, action) => {
      state.selectedService = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Services
    builder.addCase(fetchServicesAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchServicesAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.services = action.payload.items;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchServicesAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch services';
    });

    // Fetch Service
    builder.addCase(fetchServiceAsync.fulfilled, (state, action) => {
      state.selectedService = action.payload;
    });

    // Fetch Categories
    builder.addCase(fetchCategoriesAsync.pending, (state) => {
      state.categoriesLoading = true;
    });
    builder.addCase(fetchCategoriesAsync.fulfilled, (state, action) => {
      state.categoriesLoading = false;
      state.categories = action.payload;
    });
    builder.addCase(fetchCategoriesAsync.rejected, (state, action) => {
      state.categoriesLoading = false;
      state.error = action.error.message || 'Failed to fetch categories';
    });
  },
});

export const { setFilters, clearFilters, setSelectedService, clearError } =
  servicesSlice.actions;
export default servicesSlice.reducer;