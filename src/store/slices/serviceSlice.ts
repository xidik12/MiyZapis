import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { serviceService } from '@/services/service.service';
import { Service, ServiceCategory, SearchFilters, SearchResult, Pagination } from '@/types';

interface ServiceState {
  services: Service[];
  featuredServices: Service[];
  categories: ServiceCategory[];
  searchResults: SearchResult | null;
  currentService: Service | null;
  searchFilters: SearchFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: ServiceState = {
  services: [],
  featuredServices: [],
  categories: [],
  searchResults: null,
  currentService: null,
  searchFilters: {},
  isLoading: false,
  error: null,
};

// Async thunks
export const searchServices = createAsyncThunk(
  'service/search',
  async (filters: SearchFilters, { rejectWithValue }) => {
    try {
      return await serviceService.searchServices(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search services');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'service/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await serviceService.getCategories();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

export const fetchService = createAsyncThunk(
  'service/fetchService',
  async (serviceId: string, { rejectWithValue }) => {
    try {
      return await serviceService.getService(serviceId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch service');
    }
  }
);

export const fetchFeaturedServices = createAsyncThunk(
  'service/fetchFeatured',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      return await serviceService.getFeaturedServices(limit);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch featured services');
    }
  }
);

const serviceSlice = createSlice({
  name: 'service',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.searchFilters = action.payload;
    },
    clearSearchFilters: (state) => {
      state.searchFilters = {};
    },
    setCurrentService: (state, action: PayloadAction<Service | null>) => {
      state.currentService = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
  },
  extraReducers: (builder) => {
    // Search Services
    builder
      .addCase(searchServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchServices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Categories
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });

    // Fetch Service
    builder
      .addCase(fetchService.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchService.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentService = action.payload;
      })
      .addCase(fetchService.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Featured Services
    builder
      .addCase(fetchFeaturedServices.fulfilled, (state, action) => {
        state.featuredServices = action.payload;
      });
  },
});

export const {
  clearError,
  setSearchFilters,
  clearSearchFilters,
  setCurrentService,
  clearSearchResults,
} = serviceSlice.actions;

export default serviceSlice.reducer;

// Selectors
export const selectServices = (state: { service: ServiceState }) => state.service.services;
export const selectFeaturedServices = (state: { service: ServiceState }) => state.service.featuredServices;
export const selectCategories = (state: { service: ServiceState }) => state.service.categories;
export const selectSearchResults = (state: { service: ServiceState }) => state.service.searchResults;
export const selectCurrentService = (state: { service: ServiceState }) => state.service.currentService;
export const selectSearchFilters = (state: { service: ServiceState }) => state.service.searchFilters;
export const selectServiceLoading = (state: { service: ServiceState }) => state.service.isLoading;
export const selectServiceError = (state: { service: ServiceState }) => state.service.error;