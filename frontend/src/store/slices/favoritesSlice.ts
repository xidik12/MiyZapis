import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { favoritesService, FavoriteSpecialist, FavoriteService, FavoritesCount } from '@/services/favorites.service';
import { Pagination } from '@/types';

export interface FavoritesState {
  specialists: FavoriteSpecialist[];
  services: FavoriteService[];
  specialistsPagination: Pagination | null;
  servicesPagination: Pagination | null;
  favoritesCount: FavoritesCount;
  isLoading: boolean;
  error: string | null;
  favoriteStatusCache: Record<string, boolean>; // Cache for favorite status by ID
}

const initialState: FavoritesState = {
  specialists: [],
  services: [],
  specialistsPagination: null,
  servicesPagination: null,
  favoritesCount: { specialists: 0, services: 0 },
  isLoading: false,
  error: null,
  favoriteStatusCache: {},
};

// Async thunks
export const fetchFavoriteSpecialists = createAsyncThunk(
  'favorites/fetchFavoriteSpecialists',
  async ({ page = 1, limit = 12 }: { page?: number; limit?: number } = {}) => {
    return await favoritesService.getFavoriteSpecialists(page, limit);
  }
);

export const fetchFavoriteServices = createAsyncThunk(
  'favorites/fetchFavoriteServices',
  async ({ page = 1, limit = 12 }: { page?: number; limit?: number } = {}) => {
    return await favoritesService.getFavoriteServices(page, limit);
  }
);

export const addSpecialistToFavorites = createAsyncThunk(
  'favorites/addSpecialistToFavorites',
  async (specialistId: string) => {
    const result = await favoritesService.addSpecialistToFavorites(specialistId);
    return { specialistId, ...result };
  }
);

export const removeSpecialistFromFavorites = createAsyncThunk(
  'favorites/removeSpecialistFromFavorites',
  async (specialistId: string) => {
    const result = await favoritesService.removeSpecialistFromFavorites(specialistId);
    return { specialistId, ...result };
  }
);

export const addServiceToFavorites = createAsyncThunk(
  'favorites/addServiceToFavorites',
  async (serviceId: string) => {
    const result = await favoritesService.addServiceToFavorites(serviceId);
    return { serviceId, ...result };
  }
);

export const removeServiceFromFavorites = createAsyncThunk(
  'favorites/removeServiceFromFavorites',
  async (serviceId: string) => {
    const result = await favoritesService.removeServiceFromFavorites(serviceId);
    return { serviceId, ...result };
  }
);

export const checkSpecialistFavoriteStatus = createAsyncThunk(
  'favorites/checkSpecialistFavoriteStatus',
  async (specialistId: string) => {
    const result = await favoritesService.checkSpecialistInFavorites(specialistId);
    return { specialistId, isInFavorites: result.isInFavorites };
  }
);

export const checkServiceFavoriteStatus = createAsyncThunk(
  'favorites/checkServiceFavoriteStatus',
  async (serviceId: string) => {
    const result = await favoritesService.checkServiceInFavorites(serviceId);
    return { serviceId, isInFavorites: result.isInFavorites };
  }
);

export const fetchFavoritesCount = createAsyncThunk(
  'favorites/fetchFavoritesCount',
  async () => {
    return await favoritesService.getFavoritesCount();
  }
);

export const clearAllFavorites = createAsyncThunk(
  'favorites/clearAllFavorites',
  async () => {
    return await favoritesService.clearAllFavorites();
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
      state.specialists = [];
      state.services = [];
      state.specialistsPagination = null;
      state.servicesPagination = null;
      state.favoritesCount = { specialists: 0, services: 0 };
      state.favoriteStatusCache = {};
    },
    // Optimistic updates for better UX
    optimisticAddSpecialist: (state, action: PayloadAction<string>) => {
      state.favoriteStatusCache[`specialist_${action.payload}`] = true;
      state.favoritesCount.specialists += 1;
    },
    optimisticRemoveSpecialist: (state, action: PayloadAction<string>) => {
      state.favoriteStatusCache[`specialist_${action.payload}`] = false;
      state.favoritesCount.specialists = Math.max(0, state.favoritesCount.specialists - 1);
      // Remove from specialists list if present
      state.specialists = state.specialists.filter(
        fav => fav.specialist.id !== action.payload
      );
    },
    optimisticAddService: (state, action: PayloadAction<string>) => {
      state.favoriteStatusCache[`service_${action.payload}`] = true;
      state.favoritesCount.services += 1;
    },
    optimisticRemoveService: (state, action: PayloadAction<string>) => {
      state.favoriteStatusCache[`service_${action.payload}`] = false;
      state.favoritesCount.services = Math.max(0, state.favoritesCount.services - 1);
      // Remove from services list if present
      state.services = state.services.filter(
        fav => fav.service.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorite specialists
      .addCase(fetchFavoriteSpecialists.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavoriteSpecialists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.specialists = action.payload.specialists;
        state.specialistsPagination = action.payload.pagination;
        
        // Update cache with current favorites
        action.payload.specialists.forEach(fav => {
          state.favoriteStatusCache[`specialist_${fav.specialist.id}`] = true;
        });
      })
      .addCase(fetchFavoriteSpecialists.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch favorite specialists';
      })
      
      // Fetch favorite services
      .addCase(fetchFavoriteServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavoriteServices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.services = action.payload.services;
        state.servicesPagination = action.payload.pagination;
        
        // Update cache with current favorites
        action.payload.services.forEach(fav => {
          state.favoriteStatusCache[`service_${fav.service.id}`] = true;
        });
      })
      .addCase(fetchFavoriteServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch favorite services';
      })
      
      // Add specialist to favorites
      .addCase(addSpecialistToFavorites.fulfilled, (state, action) => {
        state.favoriteStatusCache[`specialist_${action.payload.specialistId}`] = true;
        state.favoritesCount.specialists += 1;
        state.error = null;
      })
      .addCase(addSpecialistToFavorites.rejected, (state, action) => {
        // Revert optimistic update
        const specialistId = action.meta.arg;
        state.favoriteStatusCache[`specialist_${specialistId}`] = false;
        state.favoritesCount.specialists = Math.max(0, state.favoritesCount.specialists - 1);
        state.error = action.error.message || 'Failed to add specialist to favorites';
      })
      
      // Remove specialist from favorites
      .addCase(removeSpecialistFromFavorites.fulfilled, (state, action) => {
        state.favoriteStatusCache[`specialist_${action.payload.specialistId}`] = false;
        state.favoritesCount.specialists = Math.max(0, state.favoritesCount.specialists - 1);
        state.specialists = state.specialists.filter(
          fav => fav.specialist.id !== action.payload.specialistId
        );
        state.error = null;
      })
      .addCase(removeSpecialistFromFavorites.rejected, (state, action) => {
        // Revert optimistic update
        const specialistId = action.meta.arg;
        state.favoriteStatusCache[`specialist_${specialistId}`] = true;
        state.favoritesCount.specialists += 1;
        state.error = action.error.message || 'Failed to remove specialist from favorites';
      })
      
      // Add service to favorites
      .addCase(addServiceToFavorites.fulfilled, (state, action) => {
        state.favoriteStatusCache[`service_${action.payload.serviceId}`] = true;
        state.favoritesCount.services += 1;
        state.error = null;
      })
      .addCase(addServiceToFavorites.rejected, (state, action) => {
        // Revert optimistic update
        const serviceId = action.meta.arg;
        state.favoriteStatusCache[`service_${serviceId}`] = false;
        state.favoritesCount.services = Math.max(0, state.favoritesCount.services - 1);
        state.error = action.error.message || 'Failed to add service to favorites';
      })
      
      // Remove service from favorites
      .addCase(removeServiceFromFavorites.fulfilled, (state, action) => {
        state.favoriteStatusCache[`service_${action.payload.serviceId}`] = false;
        state.favoritesCount.services = Math.max(0, state.favoritesCount.services - 1);
        state.services = state.services.filter(
          fav => fav.service.id !== action.payload.serviceId
        );
        state.error = null;
      })
      .addCase(removeServiceFromFavorites.rejected, (state, action) => {
        // Revert optimistic update
        const serviceId = action.meta.arg;
        state.favoriteStatusCache[`service_${serviceId}`] = true;
        state.favoritesCount.services += 1;
        state.error = action.error.message || 'Failed to remove service from favorites';
      })
      
      // Check specialist favorite status
      .addCase(checkSpecialistFavoriteStatus.fulfilled, (state, action) => {
        state.favoriteStatusCache[`specialist_${action.payload.specialistId}`] = action.payload.isInFavorites;
      })
      
      // Check service favorite status
      .addCase(checkServiceFavoriteStatus.fulfilled, (state, action) => {
        state.favoriteStatusCache[`service_${action.payload.serviceId}`] = action.payload.isInFavorites;
      })
      
      // Fetch favorites count
      .addCase(fetchFavoritesCount.fulfilled, (state, action) => {
        state.favoritesCount = action.payload;
      })
      
      // Clear all favorites
      .addCase(clearAllFavorites.fulfilled, (state) => {
        state.specialists = [];
        state.services = [];
        state.favoritesCount = { specialists: 0, services: 0 };
        state.favoriteStatusCache = {};
        state.error = null;
      })
      .addCase(clearAllFavorites.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to clear favorites';
      });
  },
});

export const { 
  clearError, 
  resetFavorites, 
  optimisticAddSpecialist, 
  optimisticRemoveSpecialist,
  optimisticAddService,
  optimisticRemoveService
} = favoritesSlice.actions;

// Selectors
export const selectFavorites = (state: { favorites: FavoritesState }) => state.favorites;
export const selectFavoriteSpecialists = (state: { favorites: FavoritesState }) => state.favorites.specialists;
export const selectFavoriteServices = (state: { favorites: FavoritesState }) => state.favorites.services;
export const selectFavoritesCount = (state: { favorites: FavoritesState }) => state.favorites.favoritesCount;
export const selectFavoritesLoading = (state: { favorites: FavoritesState }) => state.favorites.isLoading;
export const selectFavoritesError = (state: { favorites: FavoritesState }) => state.favorites.error;

export const selectIsSpecialistFavorited = (specialistId: string) => (state: { favorites: FavoritesState }) => {
  return state.favorites.favoriteStatusCache[`specialist_${specialistId}`] || false;
};

export const selectIsServiceFavorited = (serviceId: string) => (state: { favorites: FavoritesState }) => {
  return state.favorites.favoriteStatusCache[`service_${serviceId}`] || false;
};

export default favoritesSlice.reducer;