// UI slice - adapted for React Native (removed web-specific features)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Modals and dialogs
  activeModal: string | null;
  modalData: any;
  
  // Toast notifications
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
  }>;
  
  // Search and filters
  searchQuery: string;
  activeFilters: Record<string, any>;
  
  // Page state
  currentPage: string;
  previousPage: string | null;
  pageTitle: string;
  
  // Connection status (React Native NetInfo)
  isOnline: boolean;
  socketConnected: boolean;
  
  // User preferences
  language: string;
  currency: string;
  timezone: string;
  
  // Layout preferences
  layout: 'grid' | 'list';
  density: 'comfortable' | 'compact';
  
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

const initialState: UIState = {
  theme: 'system',
  globalLoading: false,
  loadingMessage: null,
  activeModal: null,
  modalData: null,
  toasts: [],
  searchQuery: '',
  activeFilters: {},
  currentPage: '',
  previousPage: null,
  pageTitle: '',
  isOnline: true, // Default to online, will be updated by NetInfo
  socketConnected: false,
  language: 'en',
  currency: 'USD',
  timezone: 'UTC',
  layout: 'grid',
  density: 'comfortable',
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = null;
      }
    },
    setLoadingMessage: (state, action: PayloadAction<string | null>) => {
      state.loadingMessage = action.payload;
    },
    openModal: (state, action: PayloadAction<{ modalId: string; data?: any }>) => {
      state.activeModal = action.payload.modalId;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    addToast: (state, action: PayloadAction<Omit<UIState['toasts'][0], 'id'>>) => {
      const toast = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setActiveFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.activeFilters = action.payload;
    },
    updateFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      state.activeFilters[action.payload.key] = action.payload.value;
    },
    removeFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload];
    },
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.previousPage = state.currentPage;
      state.currentPage = action.payload;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
    setLayout: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.layout = action.payload;
    },
    setDensity: (state, action: PayloadAction<'comfortable' | 'compact'>) => {
      state.density = action.payload;
    },
    setReducedMotion: (state, action: PayloadAction<boolean>) => {
      state.reducedMotion = action.payload;
    },
    setHighContrast: (state, action: PayloadAction<boolean>) => {
      state.highContrast = action.payload;
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
    },
    updateUIPreferences: (state, action: PayloadAction<Partial<UIState>>) => {
      Object.assign(state, action.payload);
    },
    resetUI: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setTheme,
  setGlobalLoading,
  setLoadingMessage,
  openModal,
  closeModal,
  addToast,
  removeToast,
  clearToasts,
  setSearchQuery,
  setActiveFilters,
  updateFilter,
  removeFilter,
  clearFilters,
  setCurrentPage,
  setPageTitle,
  setOnlineStatus,
  setSocketConnected,
  setLanguage,
  setCurrency,
  setTimezone,
  setLayout,
  setDensity,
  setReducedMotion,
  setHighContrast,
  setFontSize,
  updateUIPreferences,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectLoadingMessage = (state: { ui: UIState }) => state.ui.loadingMessage;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectModalData = (state: { ui: UIState }) => state.ui.modalData;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectSearchQuery = (state: { ui: UIState }) => state.ui.searchQuery;
export const selectActiveFilters = (state: { ui: UIState }) => state.ui.activeFilters;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline;
export const selectSocketConnected = (state: { ui: UIState }) => state.ui.socketConnected;
export const selectLanguage = (state: { ui: UIState }) => state.ui.language;
export const selectCurrency = (state: { ui: UIState }) => state.ui.currency;

