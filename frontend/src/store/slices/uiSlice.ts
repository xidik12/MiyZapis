import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // Layout appearance
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Modals and dialogs
  activeModal: string | null;
  modalData: unknown;
  
  // Toast notifications
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  
  // Search and filters
  searchQuery: string;
  activeFilters: Record<string, any>;
  
  // Page state
  currentPage: string;
  previousPage: string | null;
  pageTitle: string;
  
  // Connection status
  isOnline: boolean;
  socketConnected: boolean;
  
  // User preferences (theme/language/currency managed by Context providers)
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
  sidebarOpen: true,
  mobileMenuOpen: false,
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
  isOnline: navigator.onLine,
  socketConnected: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
    // Layout appearance
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    
    // Loading states
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = null;
      }
    },
    setLoadingMessage: (state, action: PayloadAction<string | null>) => {
      state.loadingMessage = action.payload;
    },
    
    // Modals and dialogs
    openModal: (state, action: PayloadAction<{ modalId: string; data?: unknown }>) => {
      state.activeModal = action.payload.modalId;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    
    // Toast notifications
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
    
    // Search and filters
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setActiveFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.activeFilters = action.payload;
    },
    updateFilter: (state, action: PayloadAction<{ key: string; value: unknown }>) => {
      state.activeFilters[action.payload.key] = action.payload.value;
    },
    removeFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload];
    },
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    
    // Page state
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.previousPage = state.currentPage;
      state.currentPage = action.payload;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
      document.title = action.payload;
    },
    
    // Connection status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
    
    // User preferences (theme/language/currency managed by Context providers)
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
    
    // Layout preferences
    setLayout: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.layout = action.payload;
    },
    setDensity: (state, action: PayloadAction<'comfortable' | 'compact'>) => {
      state.density = action.payload;
    },
    
    // Accessibility
    setReducedMotion: (state, action: PayloadAction<boolean>) => {
      state.reducedMotion = action.payload;
    },
    setHighContrast: (state, action: PayloadAction<boolean>) => {
      state.highContrast = action.payload;
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
    },
    
    // Batch updates
    updateUIPreferences: (state, action: PayloadAction<Partial<UIState>>) => {
      Object.assign(state, action.payload);
    },
    
    // Reset
    resetUI: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  // Layout appearance
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  
  // Loading states
  setGlobalLoading,
  setLoadingMessage,
  
  // Modals and dialogs
  openModal,
  closeModal,
  
  // Toast notifications
  addToast,
  removeToast,
  clearToasts,
  
  // Search and filters
  setSearchQuery,
  setActiveFilters,
  updateFilter,
  removeFilter,
  clearFilters,
  
  // Page state
  setCurrentPage,
  setPageTitle,
  
  // Connection status
  setOnlineStatus,
  setSocketConnected,
  
  // User preferences
  setTimezone,
  
  // Layout preferences
  setLayout,
  setDensity,
  
  // Accessibility
  setReducedMotion,
  setHighContrast,
  setFontSize,
  
  // Batch updates
  updateUIPreferences,
  
  // Reset
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state: { ui: UIState }) => state.ui.mobileMenuOpen;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectLoadingMessage = (state: { ui: UIState }) => state.ui.loadingMessage;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectModalData = (state: { ui: UIState }) => state.ui.modalData;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectSearchQuery = (state: { ui: UIState }) => state.ui.searchQuery;
export const selectActiveFilters = (state: { ui: UIState }) => state.ui.activeFilters;
export const selectCurrentPage = (state: { ui: UIState }) => state.ui.currentPage;
export const selectPageTitle = (state: { ui: UIState }) => state.ui.pageTitle;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline;
export const selectSocketConnected = (state: { ui: UIState }) => state.ui.socketConnected;
export const selectTimezone = (state: { ui: UIState }) => state.ui.timezone;
export const selectLayout = (state: { ui: UIState }) => state.ui.layout;
export const selectDensity = (state: { ui: UIState }) => state.ui.density;
export const selectReducedMotion = (state: { ui: UIState }) => state.ui.reducedMotion;
export const selectHighContrast = (state: { ui: UIState }) => state.ui.highContrast;
export const selectFontSize = (state: { ui: UIState }) => state.ui.fontSize;