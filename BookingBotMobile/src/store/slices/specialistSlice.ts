// Specialist slice - adapted for React Native
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { specialistService } from '../../services/specialist.service';
import { Specialist, Service, SpecialistAnalytics } from '../../types';

interface SpecialistState {
  profile: Specialist | null;
  services: Service[];
  analytics: SpecialistAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SpecialistState = {
  profile: null,
  services: [],
  analytics: null,
  isLoading: false,
  error: null,
};

export const fetchSpecialistProfile = createAsyncThunk(
  'specialist/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await specialistService.getProfile();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch specialist profile');
    }
  }
);

export const updateSpecialistProfile = createAsyncThunk(
  'specialist/updateProfile',
  async (data: Partial<Specialist>, { rejectWithValue }) => {
    try {
      return await specialistService.updateProfile(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update specialist profile');
    }
  }
);

export const fetchSpecialistServices = createAsyncThunk(
  'specialist/fetchServices',
  async (_, { rejectWithValue }) => {
    try {
      // Note: specialistService.getServices() doesn't exist, using getSpecialistServices with profile
      // This will need to be implemented or adapted
      return await specialistService.getProfile();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch specialist services');
    }
  }
);

export const fetchSpecialistAnalytics = createAsyncThunk(
  'specialist/fetchAnalytics',
  async (period: 'week' | 'month' | 'year' = 'month', { rejectWithValue }) => {
    try {
      return await specialistService.getAnalytics(period);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  }
);

const specialistSlice = createSlice({
  name: 'specialist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateProfileData: (state, action: PayloadAction<Partial<Specialist>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    addService: (state, action: PayloadAction<Service>) => {
      state.services.push(action.payload);
    },
    updateServiceInList: (state, action: PayloadAction<Service>) => {
      const index = state.services.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.services[index] = action.payload;
      }
    },
    removeServiceFromList: (state, action: PayloadAction<string>) => {
      state.services = state.services.filter(s => s.id !== action.payload);
    },
    clearSpecialist: (state) => {
      state.profile = null;
      state.services = [];
      state.analytics = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpecialistProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSpecialistProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchSpecialistProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSpecialistProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(fetchSpecialistAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const {
  clearError,
  updateProfileData,
  addService,
  updateServiceInList,
  removeServiceFromList,
  clearSpecialist,
} = specialistSlice.actions;

export default specialistSlice.reducer;

// Selectors
export const selectSpecialistProfile = (state: { specialist: SpecialistState }) => state.specialist.profile;
export const selectSpecialistServices = (state: { specialist: SpecialistState }) => state.specialist.services;
export const selectSpecialistAnalytics = (state: { specialist: SpecialistState }) => state.specialist.analytics;
export const selectSpecialistLoading = (state: { specialist: SpecialistState }) => state.specialist.isLoading;
export const selectSpecialistError = (state: { specialist: SpecialistState }) => state.specialist.error;

