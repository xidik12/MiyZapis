import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
// Import reducers
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import bookingSlice from './slices/bookingSlice';
import serviceSlice from './slices/serviceSlice';
import specialistSlice from './slices/specialistSlice';
import notificationSlice from './slices/notificationSlice';
import paymentSlice from './slices/paymentSlice';
import uiSlice from './slices/uiSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  booking: bookingSlice,
  service: serviceSlice,
  specialist: specialistSlice,
  notification: notificationSlice,
  payment: paymentSlice,
  ui: uiSlice,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user', 'ui'], // Only persist certain slices
  blacklist: ['booking', 'service', 'specialist', 'notification', 'payment'], // Don't persist real-time data
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store;