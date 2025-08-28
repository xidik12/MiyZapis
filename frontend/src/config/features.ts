// Feature flags for controlling application features
export const FEATURE_FLAGS = {
  // Notifications system - enabled with proper error handling
  ENABLE_NOTIFICATIONS_API: true,
  
  // Specialist APIs - now enabled with proper backend implementation
  ENABLE_SPECIALIST_SERVICES_API: true,
  ENABLE_SPECIALIST_SCHEDULE_API: true,
  ENABLE_SPECIALIST_PROFILE_API: true,
  
  // Real-time features  
  ENABLE_WEBSOCKETS: true,
  
  // Analytics features
  ENABLE_REAL_TIME_ANALYTICS: false,
  
  // Payment features
  ENABLE_PAYMENT_PROCESSING: true,
  
  // File uploads
  ENABLE_FILE_UPLOADS: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};