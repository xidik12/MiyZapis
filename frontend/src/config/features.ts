// Feature flags for controlling application features
export const FEATURE_FLAGS = {
  // Notifications system - disable until backend API is ready
  ENABLE_NOTIFICATIONS_API: false,
  
  // Specialist APIs - now enabled with proper backend implementation
  ENABLE_SPECIALIST_SERVICES_API: true,
  ENABLE_SPECIALIST_SCHEDULE_API: true,
  ENABLE_SPECIALIST_PROFILE_API: true,
  
  // Real-time features
  ENABLE_WEBSOCKETS: false,
  
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