// ============================================================
// Specialist Types — Canonical definitions for MiyZapis
// Merged from frontend/src/types/index.ts and mini-app/src/types/index.ts
// ============================================================

import { BaseEntity, User, Address } from './user';

export interface Specialist extends BaseEntity {
  userId?: string;
  user?: User;
  businessName: string;
  description: string;
  specialties: string[];
  experience: number;
  rating: number;
  totalReviews: number;
  totalBookings?: number;
  isVerified: boolean;
  isActive?: boolean;
  responseTime?: string;
  // Frontend format
  availability?: SpecialistAvailability;
  pricing?: SpecialistPricing;
  revenue?: SpecialistRevenue;
  location?: SpecialistLocation;
  bankDetails?: BankDetails;
  paymentQrCodeUrl?: string;
  // Mini-app format
  workingHours?: WorkingHours;
  services?: any[];
}

export interface SpecialistAvailability {
  timezone: string;
  workingHours: WorkingHoursMap;
  blockedSlots?: BlockedSlot[];
}

// Frontend format: { monday: { start, end, isWorking }, ... }
export interface WorkingHoursMap {
  [key: string]: {
    start: string;
    end: string;
    isWorking: boolean;
  };
}

// Mini-app format: { monday: DaySchedule, ... }
export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorking: boolean;
  openTime: string;
  closeTime: string;
  breaks: Break[];
}

export interface Break {
  startTime: string;
  endTime: string;
}

export interface BlockedSlot {
  id: string;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  isAvailable: boolean;
  isRecurring: boolean;
  recurring: boolean;
  recurringDays?: string[];
}

export interface SpecialistPricing {
  baseRate: number;
  currency: string;
  depositAmount: number;
  depositPercentage?: number;
}

export interface SpecialistRevenue {
  thisMonth: number;
  lastMonth: number;
  total: number;
  growth?: number;
}

export interface SpecialistLocation {
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  preciseAddress?: string;
  businessPhone?: string;
  whatsappNumber?: string;
  locationNotes?: string;
  parkingInfo?: string;
  accessInstructions?: string;
}

export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  notes?: string;
}
