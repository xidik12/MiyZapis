// Favorites slice - adapted for React Native
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { favoritesService } from '../../services/favorites.service';
import { Service, Specialist } from '../../types';

interface FavoritesState {
  services: Service[];
  specialists: Specialist[];
  isLoading: boolean;
  error: string | null;
  favoriteStatusCache: Record<string, boolean>;
}

const initialState: FavoritesState = {
  services: [],
  specialists: [],
  isLoading: false,
  error: null,
  favoriteStatusCache: {},
};

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      return await favoritesService.getFavorites();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch favorites');
    }
  }
);

export const addServiceToFavorites = createAsyncThunk(
  'favorites/addService',
  async (serviceId: string, { rejectWithValue }) => {
    try {
      await favoritesService.addService(serviceId);
      return serviceId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add service to favorites');
    }
  }
);

export const removeServiceFromFavorites = createAsyncThunk(
  'favorites/removeService',
  async (serviceId: string, { rejectWithValue }) => {
    try {
      await favoritesService.removeService(serviceId);
      return serviceId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove service from favorites');
    }
  }
);

export const addSpecialistToFavorites = createAsyncThunk(
  'favorites/addSpecialist',
  async (specialistId: string, { rejectWithValue }) => {
    try {
      await favoritesService.addSpecialist(specialistId);
      return specialistId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add specialist to favorites');
    }
  }
);

export const removeSpecialistFromFavorites = createAsyncThunk(
  'favorites/removeSpecialist',
  async (specialistId: string, { rejectWithValue }) => {
    try {
      await favoritesService.removeSpecialist(specialistId);
      return specialistId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove specialist from favorites');
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetFavorites: (state) => {
      state.services = [];
      state.specialists = [];
      state.favoriteStatusCache = {};
    },
    optimisticAddService: (state, action: PayloadAction<string>) => {
      state.favoriteStatusCache[`service_${action.payload}`] = true;
    },
    optimisticRemoveService: (state, action: PayloadAction<string>) => {
      state.favoriteStatusCache[`service_${action.payload}`] = false;
      state.services = state.services.filter(s => s.id !== action.payload);
    },
    optimisticAddSpecialist: (state, action: PayloadAction<string>) => {
      state.favoriteStatusCache[`specialist_${action.payload}`] = true;
    },
    optimisticRemoveSpecialist: (state, action: PayloadAction<string>) => {
      state.favoriteStatusCache[`specialist_${action.payload}`] = false;
      state.specialists = state.specialists.filter(s => s.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.services = action.payload.services;
        state.specialists = action.payload.specialists;
        action.payload.services.forEach(s => {
          state.favoriteStatusCache[`service_${s.id}`] = true;
        });
        action.payload.specialists.forEach(s => {
          state.favoriteStatusCache[`specialist_${s.id}`] = true;
        });
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addServiceToFavorites.fulfilled, (state, action) => {
        state.favoriteStatusCache[`service_${action.payload}`] = true;
      })
      .addCase(removeServiceFromFavorites.fulfilled, (state, action) => {
        state.favoriteStatusCache[`service_${action.payload}`] = false;
        state.services = state.services.filter(s => s.id !== action.payload);
      })
      .addCase(addSpecialistToFavorites.fulfilled, (state, action) => {
        state.favoriteStatusCache[`specialist_${action.payload}`] = true;
      })
      .addCase(removeSpecialistFromFavorites.fulfilled, (state, action) => {
        state.favoriteStatusCache[`specialist_${action.payload}`] = false;
        state.specialists = state.specialists.filter(s => s.id !== action.payload);
      });
  },
});

export const {
  clearError,
  resetFavorites,
  optimisticAddService,
  optimisticRemoveService,
  optimisticAddSpecialist,
  optimisticRemoveSpecialist,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;

// Selectors
export const selectFavorites = (state: { favorites: FavoritesState }) => state.favorites;
export const selectFavoriteServices = (state: { favorites: FavoritesState }) => state.favorites.services;
export const selectFavoriteSpecialists = (state: { favorites: FavoritesState }) => state.favorites.specialists;
export const selectFavoritesLoading = (state: { favorites: FavoritesState }) => state.favorites.isLoading;
export const selectFavoritesError = (state: { favorites: FavoritesState }) => state.favorites.error;
export const selectIsServiceFavorited = (serviceId: string) => (state: { favorites: FavoritesState }) => {
  return state.favorites.favoriteStatusCache[`service_${serviceId}`] || false;
};
export const selectIsSpecialistFavorited = (specialistId: string) => (state: { favorites: FavoritesState }) => {
  return state.favorites.favoriteStatusCache[`specialist_${specialistId}`] || false;
};

