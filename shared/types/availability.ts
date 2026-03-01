// ============================================================
// Calendar & Availability Types — From frontend/src/types/index.ts
// ============================================================

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
  bookingId?: string;
}

export interface DayAvailability {
  date: string;
  slots: AvailabilitySlot[];
}

export interface AvailabilityRequest {
  specialistId: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  serviceId?: string;
}
