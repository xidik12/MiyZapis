// API client for /api/v1/businesses/* — multi-specialist organisations.
import { apiClient } from './api';

export type BusinessRole = 'OWNER' | 'MANAGER' | 'SPECIALIST';

export interface BusinessMember {
  id: string;
  businessId: string;
  userId: string;
  role: BusinessRole;
  invitedBy?: string | null;
  invitedAt: string;
  joinedAt?: string | null;
  isActive: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    avatar?: string | null;
  };
}

export interface BusinessInvite {
  id: string;
  email: string;
  role: BusinessRole;
  expiresAt: string;
  createdAt: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  ownerId: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
  taxId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: BusinessMember[];
}

export interface CreateBusinessInput {
  name: string;
  slug?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  websiteUrl?: string;
  logoUrl?: string;
  currency?: string;
  timezone?: string;
  taxId?: string;
}

export interface BusinessDashboard {
  business: Business;
  members: number;
  services: number;
  range: { from: string; to: string };
  bookings: {
    total: number;
    totalRevenue: number;
    completed: number;
    completedRevenue: number;
  };
  recentBookings: Array<{
    id: string;
    status: string;
    scheduledAt: string;
    totalAmount: number;
    customer?: { firstName: string; lastName: string };
    specialist?: { firstName: string; lastName: string };
    service?: { name: string };
  }>;
}

// ── Owner-managed staff (employees) ───────────────────────────────────────
export interface StaffService {
  id: string;
  name: string;
  basePrice: number;
  currency: string;
  duration: number;
}

export interface StaffServiceInput {
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  currency?: string;
  duration: number;
}

export interface Staff {
  memberId: string;
  role: BusinessRole;
  user: { id: string; firstName: string; lastName: string; isManaged: boolean };
  specialist: {
    id: string;
    workingHours: Record<string, { isWorking: boolean; start: string; end: string }> | null;
    specialties: string[];
    city?: string | null;
    bio?: string | null;
    experience?: number | null;
  } | null;
  services: StaffService[];
}

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  city?: string;
  workingHours?: Record<string, { isWorking: boolean; start: string; end: string }>;
  services?: StaffServiceInput[];
}

class BusinessService {
  async listMine(): Promise<BusinessMember[]> {
    const res = await apiClient.get<{ memberships: BusinessMember[] }>('/businesses/mine');
    return res.data!.memberships;
  }

  async getById(id: string): Promise<Business> {
    const res = await apiClient.get<{ business: Business }>(`/businesses/${id}`);
    return res.data!.business;
  }

  async getBySlug(slug: string): Promise<Business> {
    const res = await apiClient.get<{ business: Business }>(`/businesses/by-slug/${slug}`);
    return res.data!.business;
  }

  async create(input: CreateBusinessInput): Promise<Business> {
    const res = await apiClient.post<{ business: Business }>('/businesses', input);
    return res.data!.business;
  }

  async update(id: string, patch: Partial<CreateBusinessInput>): Promise<Business> {
    const res = await apiClient.patch<{ business: Business }>(`/businesses/${id}`, patch);
    return res.data!.business;
  }

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/businesses/${id}`);
  }

  // Returns the created member (existing user → joined) or a pending flag
  // (unknown email → email invite sent).
  async invite(businessId: string, email: string, role: BusinessRole): Promise<{ member?: BusinessMember; pending?: boolean; email?: string }> {
    const res = await apiClient.post<{ member?: BusinessMember; pending?: boolean; email?: string }>(`/businesses/${businessId}/members`, { email, role });
    return res.data!;
  }

  async listInvites(businessId: string): Promise<BusinessInvite[]> {
    const res = await apiClient.get<{ invites: BusinessInvite[] }>(`/businesses/${businessId}/invites`);
    return res.data!.invites;
  }

  async revokeInvite(businessId: string, inviteId: string): Promise<void> {
    await apiClient.delete(`/businesses/${businessId}/invites/${inviteId}`);
  }

  async setRole(businessId: string, userId: string, role: BusinessRole): Promise<BusinessMember> {
    const res = await apiClient.patch<{ member: BusinessMember }>(`/businesses/${businessId}/members/${userId}`, { role });
    return res.data!.member;
  }

  async removeMember(businessId: string, userId: string): Promise<void> {
    await apiClient.delete(`/businesses/${businessId}/members/${userId}`);
  }

  async dashboard(businessId: string, from?: Date, to?: Date): Promise<BusinessDashboard> {
    const params: Record<string, string> = {};
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();
    const res = await apiClient.get<BusinessDashboard>(`/businesses/${businessId}/dashboard`, { params });
    return res.data!;
  }

  // ── Staff / Employees ────────────────────────────────────────────────────
  async listStaff(businessId: string): Promise<Staff[]> {
    const res = await apiClient.get<{ staff: Staff[] }>(`/businesses/${businessId}/staff`);
    return res.data!.staff;
  }

  async createStaff(businessId: string, input: CreateStaffInput): Promise<{ userId: string; specialistId: string }> {
    const res = await apiClient.post<{ staff: { userId: string; specialistId: string } }>(`/businesses/${businessId}/staff`, input);
    return res.data!.staff;
  }

  async updateStaff(businessId: string, staffUserId: string, patch: Partial<CreateStaffInput>): Promise<void> {
    await apiClient.put(`/businesses/${businessId}/staff/${staffUserId}`, patch);
  }

  async deleteStaff(businessId: string, staffUserId: string): Promise<void> {
    await apiClient.delete(`/businesses/${businessId}/staff/${staffUserId}`);
  }

  async cloneStaff(businessId: string, staffUserId: string, firstName: string, lastName: string): Promise<{ userId: string; specialistId: string }> {
    const res = await apiClient.post<{ staff: { userId: string; specialistId: string } }>(`/businesses/${businessId}/staff/${staffUserId}/clone`, { firstName, lastName });
    return res.data!.staff;
  }

  async setSchedule(businessId: string, staffUserId: string, workingHours: Record<string, { isWorking: boolean; start: string; end: string }>): Promise<void> {
    await apiClient.put(`/businesses/${businessId}/staff/${staffUserId}/schedule`, { workingHours });
  }

  async setServices(businessId: string, staffUserId: string, services: StaffServiceInput[]): Promise<void> {
    await apiClient.put(`/businesses/${businessId}/staff/${staffUserId}/services`, { services });
  }
}

export const businessService = new BusinessService();
