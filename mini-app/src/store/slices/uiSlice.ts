import { createSlice } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  theme: 'light' | 'dark';
  isBottomSheetOpen: boolean;
  bottomSheetContent: any;
  toasts: Toast[];
  isLoading: boolean;
  loadingMessage?: string;
  isOnline: boolean;
}

const initialState: UIState = {
  theme: 'light',
  isBottomSheetOpen: false,
  bottomSheetContent: null,
  toasts: [],
  isLoading: false,
  loadingMessage: undefined,
  isOnline: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    openBottomSheet: (state, action) => {
      state.isBottomSheetOpen = true;
      state.bottomSheetContent = action.payload;
    },
    closeBottomSheet: (state) => {
      state.isBottomSheetOpen = false;
      state.bottomSheetContent = null;
    },
    addToast: (state, action) => {
      const toast: Toast = {
        id: Date.now().toString(),
        duration: 5000,
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message;
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
  },
});

export const {
  setTheme,
  openBottomSheet,
  closeBottomSheet,
  addToast,
  removeToast,
  clearToasts,
  setLoading,
  setOnlineStatus,
} = uiSlice.actions;

export default uiSlice.reducer;