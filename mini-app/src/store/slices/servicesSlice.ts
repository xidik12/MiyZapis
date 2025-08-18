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
  };
  tags: string[];
  isActive: boolean;
}

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
  }) => {
    return await apiService.getServices(params);
  }
);

export const fetchServiceAsync = createAsyncThunk(
  'services/fetchService',
  async (id: string) => {
    return await apiService.getService(id);
  }
);

export const fetchCategoriesAsync = createAsyncThunk(
  'services/fetchCategories',
  async () => {
    return await apiService.getServiceCategories();
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