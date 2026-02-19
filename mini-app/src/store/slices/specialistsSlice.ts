import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';

export interface Specialist {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  bio: string;
  rating: number;
  reviewCount: number;
  experience: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  specialties: string[];
  certifications: string[];
  portfolio: Array<{
    id: string;
    title: string;
    image: string;
    description?: string;
  }>;
  availability: {
    [key: string]: Array<{
      start: string;
      end: string;
      isAvailable: boolean;
    }>;
  };
  isOnline: boolean;
  isVerified: boolean;
}

interface SpecialistsState {
  specialists: Specialist[];
  selectedSpecialist: Specialist | null;
  availability: any;
  isLoading: boolean;
  availabilityLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    service?: string;
    location?: string;
    rating?: number;
    isOnline?: boolean;
  };
}

const initialState: SpecialistsState = {
  specialists: [],
  selectedSpecialist: null,
  availability: null,
  isLoading: false,
  availabilityLoading: false,
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
export const fetchSpecialistsAsync = createAsyncThunk(
  'specialists/fetchSpecialists',
  async (params?: {
    page?: number;
    limit?: number;
    service?: string;
    location?: string;
    rating?: number;
  }) => {
    const response: any = await apiService.getSpecialists(params);
    // API returns { specialists: [...], total, page, totalPages }
    if (response?.specialists) {
      return {
        items: response.specialists.map((s: any) => ({
          ...s,
          name: s.user ? `${s.user.firstName} ${s.user.lastName}`.trim() : s.name || '',
          avatar: s.user?.avatar || s.avatar,
        })),
        pagination: {
          page: response.page || 1,
          limit: params?.limit || 10,
          total: response.total || response.specialists.length,
          totalPages: response.totalPages || 1,
        },
      };
    }
    return response;
  }
);

export const fetchSpecialistAsync = createAsyncThunk(
  'specialists/fetchSpecialist',
  async (id: string) => {
    const raw: any = await apiService.getSpecialist(id);
    return {
      ...raw,
      userId: raw.userId || raw.user?.id || '',
      name: raw.user ? `${raw.user.firstName} ${raw.user.lastName}`.trim() : raw.name || '',
      avatar: raw.user?.avatar || raw.avatar,
      phone: raw.user?.phoneNumber || raw.phoneNumber || raw.phone || '',
      email: raw.user?.email || raw.email || '',
      reviewCount: raw.totalReviews || raw.reviewCount || 0,
    };
  }
);

export const fetchSpecialistServicesAsync = createAsyncThunk(
  'specialists/fetchSpecialistServices',
  async (id: string) => {
    const raw: any = await apiService.getSpecialistServices(id);
    const services = Array.isArray(raw) ? raw : raw?.services || [];
    return services.map((s: any) => ({
      ...s,
      price: Number(s.price) || Number(s.basePrice) || 0,
    }));
  }
);

export const fetchSpecialistAvailabilityAsync = createAsyncThunk(
  'specialists/fetchAvailability',
  async ({ id, date }: { id: string; date: string }) => {
    return await apiService.getSpecialistAvailability(id, date);
  }
);

const specialistsSlice = createSlice({
  name: 'specialists',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSelectedSpecialist: (state, action) => {
      state.selectedSpecialist = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Specialists
    builder.addCase(fetchSpecialistsAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSpecialistsAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.specialists = action.payload.items;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchSpecialistsAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch specialists';
    });

    // Fetch Specialist
    builder.addCase(fetchSpecialistAsync.fulfilled, (state, action) => {
      state.selectedSpecialist = action.payload;
    });

    // Fetch Specialist Services
    builder.addCase(fetchSpecialistServicesAsync.fulfilled, (state, action) => {
      if (state.selectedSpecialist) {
        state.selectedSpecialist.services = action.payload;
      }
    });

    // Fetch Availability
    builder.addCase(fetchSpecialistAvailabilityAsync.pending, (state) => {
      state.availabilityLoading = true;
    });
    builder.addCase(fetchSpecialistAvailabilityAsync.fulfilled, (state, action) => {
      state.availabilityLoading = false;
      state.availability = action.payload;
    });
    builder.addCase(fetchSpecialistAvailabilityAsync.rejected, (state, action) => {
      state.availabilityLoading = false;
      state.error = action.error.message || 'Failed to fetch availability';
    });
  },
});

export const { setFilters, clearFilters, setSelectedSpecialist, clearError } =
  specialistsSlice.actions;
export default specialistsSlice.reducer;